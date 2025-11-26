
const fs = require("fs");
const fsPromises = require("fs/promises");
const { setTimeout: delay } = require("timers/promises");

// ----------------------------- Arg parsing -----------------------------

function parseArgs() {
  const argv = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" && argv[i + 1]) {
      flags.input = argv[++i];
    } else if (a === "--save" && argv[i + 1]) {
      flags.save = argv[++i];
    } else if (a === "--fetch") {
      flags.fetch = true;
    } else if (a === "--concurrency" && argv[i + 1]) {
      flags.concurrency = parseInt(argv[++i], 10);
    } else if (a === "--timeout" && argv[i + 1]) {
      flags.timeout = parseInt(argv[++i], 10);
    } else if (a === "--retries" && argv[i + 1]) {
      flags.retries = parseInt(argv[++i], 10);
    } else {
     }
  }
  return flags;
}


 function normalizeInput(input) {
  if (Array.isArray(input)) return input.map((x) => ({ ...x }));
  if (input && typeof input === "object") {
    return Object.keys(input).map((k) => ({ _key: k, ...input[k] }));
  }
  throw new Error("Input must be an array or an object (map).");
}

function getDot(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
     const maybeIndex = /^\d+$/.test(p) ? Number(p) : p;
    cur = cur[maybeIndex];
  }
  return cur;
}

 function applyTemplate(value, context) {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(/{{\s*steps\.([a-zA-Z0-9_\-]+)\.([^}]+)\s*}}/g, (_, id, path) => {
      const stepObj = context.steps && context.steps[id];
      if (!stepObj) return "";
      const v = getDot(stepObj, path.trim());
      return v === undefined || v === null ? "" : String(v);
    });
  }
   if (Array.isArray(value)) {
    return value.map((v) => applyTemplate(v, context));
  }
  if (typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = applyTemplate(value[k], context);
    return out;
  }
  return value;
}

 async function ensureFetch() {
  if (typeof fetch === "function") return;
   try {
    const mod = await import("node-fetch");
    global.fetch = mod.default ?? mod;
  } catch (err) {
    throw new Error(
      "No global fetch available. Install node-fetch (npm i node-fetch) or run Node 18+."
    );
  }
}

async function performRequest(item, opts = {}) {
  const method = (item.method || item.action || "GET").toUpperCase();
  const url = (item.endpoint || "") + (item.url_ext || "");
  if (!url) return { _fetchError: "No endpoint provided" };

  const timeoutMs = opts.timeoutMs ?? 10000;
  const retries = opts.retries ?? 1;
  let backoff = opts.backoffMs ?? 300;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = { Accept: "application/json" };
      let body = undefined;
      if (["POST", "PUT", "PATCH"].includes(method)) {
        if (item.body !== undefined) {
          if (typeof item.body === "object") {
            body = JSON.stringify(item.body);
            headers["Content-Type"] = "application/json";
          } else if (typeof item.body === "string") {
            body = item.body;
          }
        }
      }
       if (item.headers && typeof item.headers === "object") {
        for (const k of Object.keys(item.headers)) headers[k] = item.headers[k];
      }

      const res = await fetch(url, { method, headers, body, signal: controller.signal });
      clearTimeout(id);
      const ct = res.headers.get ? res.headers.get("content-type") || "" : "";

      if (!res.ok) {
         if (ct.includes("application/json")) {
          const json = await res.json().catch(() => null);
          return { _fetchError: `HTTP ${res.status} ${res.statusText}`, _httpBody: json };
        } else {
          const txt = await res.text().catch(() => null);
          return { _fetchError: `HTTP ${res.status} ${res.statusText}`, _httpText: txt };
        }
      }

      if (ct.includes("application/json")) {
        return await res.json();
      } else {
        return { _text: await res.text() };
      }
    } catch (err) {
      clearTimeout(id);
      const isAbort = err && err.name === "AbortError";
      const willRetry = attempt < retries;
      if (!willRetry) {
        return { _fetchError: String(err) };
      }
       await delay(backoff);
      backoff *= 2;
    }
  }
  return { _fetchError: "Retries exhausted" };
}

// ----------------------------- Execution engine -----------------------------
 
async function processGroups(allSteps, options = {}) {
  const concurrency = options.concurrency || 4;
  const fetchFlag = options.fetch || false;

   const groups = [];
  for (const step of allSteps) {
    const g = step.group ?? null;
    const last = groups[groups.length - 1];
     let groupObj = groups.find((x) => x.name === g);
    if (!groupObj) {
      groupObj = { name: g, steps: [] };
      groups.push(groupObj);
    }
    groupObj.steps.push(step);
  }

   const context = { steps: {} };  
  async function runGroup(group) {
    const groupOut = []; 
    for (const step of group.steps) {
       const templated = {
        ...step,
        url_ext: applyTemplate(step.url_ext ?? "", context),
        headers: applyTemplate(step.headers ?? {}, context),
        body: applyTemplate(step.body ?? null, context),
      };

      let response = null;
      if (fetchFlag) {
        
        response = await performRequest(templated, {
          timeoutMs: step.timeoutMs ?? options.timeoutMs ?? 10000,
          retries: step.retries ?? options.retries ?? 1,
          backoffMs: options.backoffMs ?? 300,
        });
      } else {
         response = templated.body ?? null;
      }

       if (step.collect === "first" && Array.isArray(response)) response = response[0] ?? null;

       context.steps[step.id ?? step._key ?? `step_${Math.random().toString(36).slice(2,7)}`] = response;

       if (step.extract && typeof step.extract === "object") {
        const extracted = {};
        for (const [k, p] of Object.entries(step.extract)) {
           extracted[k] = getDot(response, p);
           const stepKey = step.id ?? step._key;
          if (!context.steps[stepKey]) context.steps[stepKey] = {};
          context.steps[stepKey][k] = extracted[k];
        }
      }

      groupOut.push({ step, response });
    }
    return groupOut;
  }

   const resultsByGroup = [];
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= groups.length) return;
      const g = groups[i];
      const res = await runGroup(g);
      resultsByGroup[i] = { groupName: g.name, steps: res };
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, groups.length) }, () => worker());
  await Promise.all(workers);

  return { resultsByGroup, context };
}

// ----------------------------- Build final output -----------------------------

function buildFinalOutputs(resultsByGroup) {
   const orderedSteps = [];
  for (const g of resultsByGroup) {
    for (const item of g.steps) {
      orderedSteps.push(item);
    }
  }

   const roots = new Map();
  const rootOrder = [];

  function ensureRoot(rootName) {
    if (!roots.has(rootName)) {
      roots.set(rootName, {});
      rootOrder.push(rootName);
    }
  }

  for (const { step, response } of orderedSteps) {
    const outputAs = step.outputAs ?? null;
    if (!outputAs) {
       const rid = `step_${step.id ?? step._key ?? Math.random().toString(36).slice(2,6)}`;
      ensureRoot(rid);
      const rootObj = roots.get(rid);
      rootObj[step.outputAs ?? "output"] = response;
       roots.set(rid, rootObj);
      continue;
    }

     const parts = String(outputAs).split(".");
    const rootName = parts[0];
    ensureRoot(rootName);
    let rootObj = roots.get(rootName);
    if (!rootObj || typeof rootObj !== "object") rootObj = {};
     if (parts.length === 1) {
      if (Object.keys(rootObj).length === 0) {
        rootObj["value"] = response;
      } else {
         const nextChain = `chain${Object.keys(rootObj).length + 1}`;
        rootObj[nextChain] = response;
      }
    } else {
       let cur = rootObj;
      for (let i = 1; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!(p in cur) || typeof cur[p] !== "object") cur[p] = {};
        cur = cur[p];
      }
      const last = parts[parts.length - 1];
       cur[last] = response;
    }
    roots.set(rootName, rootObj);
  }

   const out = rootOrder.map((r) => {
    const val = roots.get(r);
    return { [r]: val };
  });

  return out;
}

// ----------------------------- Input reading -----------------------------
async function readInputFromFile(path) {
  const txt = await fsPromises.readFile(path, "utf8");
  return JSON.parse(txt);
}

async function readInputFromStdin() {
  const stdin = process.stdin;
  let data = "";
  for await (const chunk of stdin) data += chunk;
  return JSON.parse(data);
}

// ----------------------------- Main CLI -----------------------------
(async function main() {
  const flags = parseArgs();
  const fetchFlag = Boolean(flags.fetch);
  const concurrency = flags.concurrency ?? 4;
  const timeoutMs = flags.timeout ?? 10000;
  const retries = flags.retries ?? 1;
  const savePath = flags.save ?? null;

   let rawInput;
  try {
    if (flags.input) {
      rawInput = await readInputFromFile(flags.input);
    } else {
       if (!process.stdin.isTTY) {
        rawInput = await readInputFromStdin();
      } else {
        console.error("No --input provided and no stdin data. Provide --input <file.json> or pipe JSON via stdin.");
        process.exit(2);
      }
    }
  } catch (err) {
    console.error("Failed to read input:", String(err));
    process.exit(1);
  }

  const items = normalizeInput(rawInput);

   items.forEach((it, idx) => {
    if (!it.id && !it._key) it.id = `s${idx + 1}`;
    if (!it.id && it._key) it.id = it._key;
  });

   if (fetchFlag) {
    try {
      await ensureFetch();
    } catch (err) {
      console.error("Fetch not available:", String(err));
      process.exit(1);
    }
  }

   try {
    const { resultsByGroup, context } = await processGroups(items, {
      fetch: fetchFlag,
      concurrency,
      timeoutMs,
      retries,
    });

     const finalOut = buildFinalOutputs(resultsByGroup);

     const outText = JSON.stringify(finalOut, null, 2);
    console.log(outText);

     if (savePath) {
      await fsPromises.writeFile(savePath, outText, "utf8");
      console.error(`Saved output to ${savePath}`);
    }
  } catch (err) {
    console.error("Processing error:", String(err));
    process.exit(1);
  }
})();
