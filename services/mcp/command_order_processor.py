import json
import requests
import copy
import re
import time


# -------------------------------------------------------
# Helpers: normalize input + dot navigation + templating
# -------------------------------------------------------

def normalize_input(input_data):
    if isinstance(input_data, list):
        return [copy.deepcopy(x) for x in input_data]

    if isinstance(input_data, dict):
        out = []
        for k, v in input_data.items():
            item = {"_key": k}
            item.update(copy.deepcopy(v))
            out.append(item)
        return out

    raise ValueError("Input must be an array or an object (map).")


def get_dot(obj, path):
    if not path:
        return None

    parts = str(path).split(".")
    cur = obj

    for p in parts:
        if cur is None:
            return None

        if isinstance(cur, list) and p.isdigit():
            idx = int(p)
            if idx < len(cur):
                cur = cur[idx]
                continue
            return None

        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
            continue

        return None

    return cur


def apply_template(value, context):
    if value is None:
        return None

    if isinstance(value, str):
        pattern = r"{{\s*steps\.([a-zA-Z0-9_\-]+)\.([^}]+)\s*}}"

        def repl(m):
            step_id = m.group(1)
            path = m.group(2).strip()

            step_obj = context["steps"].get(step_id)
            if step_obj is None:
                return ""

            v = get_dot(step_obj, path)
            if v is None:
                return ""

            return str(v)

        return re.sub(pattern, repl, value)

    if isinstance(value, list):
        return [apply_template(v, context) for v in value]

    if isinstance(value, dict):
        return {k: apply_template(v, context) for k, v in value.items()}

    return value


# -------------------------------------------------------
# HTTP request execution, aligned to JS semantics
# -------------------------------------------------------

def perform_request(item, timeout_ms=10000, retries=1, backoff_ms=300):
    method = (item.get("method") or item.get("action") or "GET").upper()
    url = (item.get("endpoint") or "") + (item.get("url_ext") or "")

    if not url:
        return {"_fetchError": "No endpoint provided"}

    timeout_sec = timeout_ms / 1000.0

    attempt = 0
    backoff = backoff_ms

    while attempt <= retries:
        try:
            headers = {"Accept": "application/json"}
            body = None

            if method in ["POST", "PUT", "PATCH"] and "body" in item:
                if isinstance(item["body"], dict):
                    body = json.dumps(item["body"])
                    headers["Content-Type"] = "application/json"
                else:
                    body = item["body"]

            if isinstance(item.get("headers"), dict):
                for k, v in item["headers"].items():
                    headers[k] = v

            res = requests.request(
                method,
                url,
                headers=headers,
                data=body,
                timeout=timeout_sec
            )

            # Non-OK
            if not res.ok:
                ct = res.headers.get("content-type", "")
                if "application/json" in ct:
                    try:
                        return {
                            "_fetchError": f"HTTP {res.status_code} {res.reason}",
                            "_httpBody": res.json()
                        }
                    except:
                        return {
                            "_fetchError": f"HTTP {res.status_code} {res.reason}",
                            "_httpText": res.text
                        }
                else:
                    return {
                        "_fetchError": f"HTTP {res.status_code} {res.reason}",
                        "_httpText": res.text
                    }

            # OK
            ct = res.headers.get("content-type", "")
            if "application/json" in ct:
                return res.json()

            return {"_text": res.text}

        except Exception as err:
            if attempt >= retries:
                return {"_fetchError": str(err)}

            time.sleep(backoff / 1000.0)
            backoff *= 2
            attempt += 1

    return {"_fetchError": "Retries exhausted"}


# -------------------------------------------------------
# Grouping + execution engine (synchronous, JS-aligned)
# -------------------------------------------------------

def process_groups(all_steps, fetch=False, timeout_ms=10000, retries=1):
    groups = []
    group_map = {}

    # Build groups exactly like JS
    for step in all_steps:
        gname = step.get("group")
        if gname not in group_map:
            group_obj = {"name": gname, "steps": []}
            group_map[gname] = group_obj
            groups.append(group_obj)
        group_map[gname]["steps"].append(step)

    context = {"steps": {}}
    results_by_group = []

    # Execute sequentially per group
    for g in groups:
        group_out = []

        for step in g["steps"]:
            templated = copy.deepcopy(step)
            templated["url_ext"] = apply_template(step.get("url_ext", ""), context)
            templated["headers"] = apply_template(step.get("headers", {}), context)
            templated["body"] = apply_template(step.get("body", None), context)

            if fetch:
                response = perform_request(
                    templated,
                    timeout_ms=step.get("timeoutMs", timeout_ms),
                    retries=step.get("retries", retries)
                )
            else:
                response = templated.get("body")

            if step.get("collect") == "first" and isinstance(response, list):
                response = response[0] if response else None

            step_id = (
                step.get("id")
                or step.get("_key")
                or f"step_{hex(id(step))[2:8]}"
            )

            context["steps"][step_id] = response

            # extraction (same key merging semantics as JS)
            if isinstance(step.get("extract"), dict):
                for k, p in step["extract"].items():
                    val = get_dot(response, p)
                    if not isinstance(context["steps"].get(step_id), dict):
                        context["steps"][step_id] = {}
                    context["steps"][step_id][k] = val

            group_out.append({"step": step, "response": response})

        results_by_group.append({
            "groupName": g["name"],
            "steps": group_out
        })

    return results_by_group, context


# -------------------------------------------------------
# Build final outputs (exact JS semantics)
# -------------------------------------------------------

def build_final_outputs(results_by_group):
    ordered_steps = []
    for g in results_by_group:
        ordered_steps.extend(g["steps"])

    roots = {}
    root_order = []

    def ensure_root(name):
        if name not in roots:
            roots[name] = {}
            root_order.append(name)

    for item in ordered_steps:
        step = item["step"]
        response = item["response"]
        output_as = step.get("outputAs")

        if not output_as:
            rid = f"step_{step.get('id') or step.get('_key') or hex(id(step))[2:6]}"
            ensure_root(rid)
            if "output" not in roots[rid]:
                roots[rid]["output"] = response
            else:
                chain = f"chain{len(roots[rid]) + 1}"
                roots[rid][chain] = response
            continue

        parts = str(output_as).split(".")
        root_name = parts[0]
        ensure_root(root_name)

        cur = roots[root_name]

        if len(parts) == 1:
            if len(cur) == 0:
                cur["value"] = response
            else:
                chain = f"chain{len(cur) + 1}"
                cur[chain] = response
            continue

        for p in parts[1:-1]:
            if p not in cur or not isinstance(cur[p], dict):
                cur[p] = {}
            cur = cur[p]

        cur[parts[-1]] = response

    return [{r: roots[r]} for r in root_order]


# -------------------------------------------------------
# PUBLIC ENTRY POINT
# -------------------------------------------------------

def get_val(input_data, fetch=False, timeout_ms=10000, retries=1):
    items = normalize_input(input_data)

    for i, it in enumerate(items):
        if "id" not in it:
            if "_key" in it:
                it["id"] = it["_key"]
            else:
                it["id"] = f"s{i+1}"

    results_by_group, context = process_groups(
        items,
        fetch=fetch,
        timeout_ms=timeout_ms,
        retries=retries
    )

    return build_final_outputs(results_by_group)
