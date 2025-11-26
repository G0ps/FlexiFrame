import React, { useMemo } from "react";

/* ===========================
   VOID HTML ELEMENTS
   (Cannot have children)
=========================== */
const VOID_HTML_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img",
  "input", "link", "meta", "param", "source", "track", "wbr"
]);

/* ===========================
   KNOWN VALID HTML TAGS
   (Used for fallback detection)
=========================== */
const KNOWN_HTML_TAGS = new Set([
  "a","abbr","address","article","aside","audio","b","bdi","bdo","blockquote",
  "button","canvas","caption","cite","code","colgroup","data","datalist","dd",
  "del","details","dfn","dialog","div","dl","dt","em","fieldset","figcaption",
  "figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hr",
  "i","iframe","img","input","ins","kbd","label","legend","li","main","map",
  "mark","menu","meter","nav","ol","option","output","p","picture","pre",
  "progress","q","rp","rt","ruby","s","samp","section","select","small","source",
  "span","strong","sub","summary","sup","table","tbody","td","template",
  "textarea","tfoot","th","thead","time","title","tr","u","ul","var","video"
]);

/* ===========================
   SANITIZE TAG NAMES
=========================== */
function sanitizeType(rawType) {
  if (typeof rawType !== "string") return "div";

  let t = rawType.trim();

  // Custom React components must be uppercase
  if (/^[A-Z]/.test(t)) return t;

  // Remove trailing numbers: main7 → main
  let stripped = t.replace(/[0-9_]+$/g, "");
  if (KNOWN_HTML_TAGS.has(stripped)) return stripped;

  // Remove all numbers: article20 → article
  let noDigits = t.replace(/[0-9]/g, "");
  if (KNOWN_HTML_TAGS.has(noDigits)) return noDigits;

  // If still unknown → fallback to div
  console.warn(`[Renderer] Unknown tag "${rawType}" → Using <div> instead`);
  return "div";
}

/* ===========================
   PARSE MULTIPLE JSON OBJECTS
=========================== */
function parseConcatenatedJson(input) {
  if (!input || typeof input !== "string") return [];

  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {}

  const results = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    while (i < n && /\s/.test(input[i])) i++;
    if (i >= n) break;

    const startChar = input[i];

    if (startChar === "{" || startChar === "[") {
      const open = startChar;
      const close = open === "{" ? "}" : "]";
      let depth = 0, inString = false, escape = false, j = i;

      for (; j < n; j++) {
        const ch = input[j];

        if (inString) {
          escape = ch === "\\" ? true : false;
          if (ch === "\"" && !escape) inString = false;
        } else {
          if (ch === "\"") inString = true;
          if (ch === open) depth++;
          if (ch === close) depth--;

          if (depth === 0) {
            const block = input.slice(i, j + 1);
            try {
              results.push(JSON.parse(block));
            } catch {}
            i = j + 1;
            break;
          }
        }
      }
      i = j + 1;
    } else {
      break;
    }
  }

  return results;
}

/* ===========================
   NORMALIZE PROPS
=========================== */
function normalizeProps(rawProps = {}) {
  const props = {};
  for (let [key, value] of Object.entries(rawProps)) {
    if (key === "class") props.className = value;
    else props[key] = value;
  }
  return props;
}

/* ===========================
   MAIN RENDER FUNCTION
=========================== */
function renderNode(node, depth = 0, maxDepth = 300) {
  if (depth > maxDepth) {
    return <div style={{ color: "red" }}>[MAX DEPTH REACHED]</div>;
  }

  if (node === null || node === undefined) return null;
  if (typeof node === "string" || typeof node === "number") return node;

  // Array children
  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={idx}>
        {renderNode(child, depth + 1, maxDepth)}
      </React.Fragment>
    ));
  }

  // OBJECT NODE
  let { type = "div", props = {}, children = [] } = node;

  // sanitize tag
  let tagName = sanitizeType(type);

  // convert props
  let reactProps = normalizeProps(props);

  // VOID ELEMENTS cannot have children
  if (VOID_HTML_ELEMENTS.has(tagName)) {
    if (children && (Array.isArray(children) ? children.length > 0 : children)) {
      console.warn(`[Renderer] Removed children for void element <${tagName}>`);
    }
    return React.createElement(tagName, reactProps);
  }

  // normal elements → recursive children render
  let reactChildren = Array.isArray(children)
    ? children.map((c, i) => (
        <React.Fragment key={i}>{renderNode(c, depth + 1, maxDepth)}</React.Fragment>
      ))
    : renderNode(children, depth + 1, maxDepth);

  return React.createElement(tagName, reactProps, reactChildren);
}

/* ===========================
   EXPORTED COMPONENT
=========================== */
export default function ModificationLLM({ inputString, maxDepth = 300 }) {
  const parsed = useMemo(() => parseConcatenatedJson(inputString), [inputString]);

  return (
    <div style={{ padding: "10px" }}>
      {parsed.map((node, idx) => (
        <React.Fragment key={idx}>
          {renderNode(node, 0, maxDepth)}
        </React.Fragment>
      ))}
    </div>
  );
}
