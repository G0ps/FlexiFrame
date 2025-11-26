import React, { useEffect, useState } from "react";

const uiString = `{
  "type": "p",
  "props": { "style": { "padding": "20px", "backgroundColor": "#eee" } },
  "children": [
    { "type": "h1", "children": ["Hello World"] },
    {
      "type": "ul",
      "children": [
        { "type": "li", "children": ["Item 1"] },
        { "type": "li", "children": ["Item 2"] },
        { "type": "li", "children": ["Item 3"] }
      ]
    }
  ]
}`;

function stringToReact(node) {
  if (typeof node === "string") {
    try {
      node = JSON.parse(node);
    } catch {
      return node; // Plain text fallback
    }
  }

  if (node === null || node === undefined) return null;
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) return node.map((child, idx) => <React.Fragment key={idx}>{stringToReact(child)}</React.Fragment>);

  const { type = "div", props = {}, children = [] } = node;

  const resolvedProps = { ...props };

  // Convert string event handlers safely
  Object.keys(resolvedProps).forEach((key) => {
    if (key.startsWith("on") && typeof resolvedProps[key] === "string") {
      try {
        resolvedProps[key] = new Function("event", resolvedProps[key]);
      } catch {
        console.warn("Failed to parse event handler");
      }
    }
  });

  return React.createElement(type, resolvedProps, stringToReact(children));
}

export default function ModificationLLM({ dynamicJson }) {
  const [outlet, setOutlet] = useState(null);

  useEffect(() => {
    // If dynamicJson is passed, use it; otherwise use static uiString
    setOutlet(stringToReact(dynamicJson || uiString));
  }, [dynamicJson]);

  return <div>{outlet}</div>;
}
