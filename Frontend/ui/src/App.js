import { useState } from "react";
import ChatBox from "./Chatbot.js";
import TestWebSocket from "./test_uis/modification_llm.js"; // keep this if it's separate
import ModificationLLM from "./test_uis/modification_llm.js"; // this is your dynamic component

// complexJsonString.js
const testJson = `
{
  "type": "div",
  "props": {
    "style": {
      "fontFamily": "Inter, Arial, sans-serif",
      "backgroundColor": "#f6f9fc",
      "padding": "20px",
      "borderRadius": "10px"
    }
  },
  "children": [
    {
      "type": "header",
      "props": {
        "style": {
          "background": "linear-gradient(90deg, #2b6ef6, #185ed9)",
          "color": "white",
          "padding": "20px",
          "borderRadius": "10px",
          "marginBottom": "20px",
          "display": "flex",
          "alignItems": "center",
          "justifyContent": "space-between",
          "boxShadow": "0 10px 30px rgba(15,32,63,0.07)"
        }
      },
      "children": [
        {
          "type": "h1",
          "props": { "style": { "margin": 0, "fontSize": "1.6rem" } },
          "children": ["JSON INLINE STYLE DEMO"]
        },
        {
          "type": "nav",
          "children": [
            {
              "type": "ul",
              "props": {
                "style": {
                  "listStyle": "none",
                  "display": "flex",
                  "gap": "14px",
                  "margin": 0,
                  "padding": 0
                }
              },
              "children": [
                {
                  "type": "li",
                  "children": [
                    {
                      "type": "a",
                      "props": {
                        "href": "#home",
                        "style": {
                          "color": "white",
                          "textDecoration": "none",
                          "padding": "6px 10px",
                          "borderRadius": "6px",
                          "fontWeight": "600"
                        }
                      },
                      "children": ["Home"]
                    }
                  ]
                },
                {
                  "type": "li",
                  "children": [
                    {
                      "type": "a",
                      "props": {
                        "href": "#about",
                        "style": {
                          "color": "white",
                          "textDecoration": "none",
                          "padding": "6px 10px",
                          "borderRadius": "6px",
                          "fontWeight": "600"
                        }
                      },
                      "children": ["About"]
                    }
                  ]
                },
                {
                  "type": "li",
                  "children": [
                    {
                      "type": "a",
                      "props": {
                        "href": "#contact",
                        "style": {
                          "color": "white",
                          "textDecoration": "none",
                          "padding": "6px 10px",
                          "borderRadius": "6px",
                          "fontWeight": "600"
                        }
                      },
                      "children": ["Contact"]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    {
      "type": "section",
      "props": {
        "style": {
          "backgroundColor": "white",
          "padding": "20px",
          "borderRadius": "10px",
          "marginBottom": "20px",
          "boxShadow": "0px 8px 20px rgba(20,20,40,0.05)"
        }
      },
      "children": [
        { "type": "h2", "children": ["Hero Section"] },
        {
          "type": "p",
          "props": {
            "style": { "color": "#444", "marginBottom": "10px", "lineHeight": "1.6" }
          },
          "children": [
            "This is a fully inline-styled JSON-based UI. No CSS files are used — everything is inside props.style!"
          ]
        },
        {
          "type": "div",
          "props": {
            "style": { "display": "flex", "gap": "10px", "marginTop": "12px" }
          },
          "children": [
            {
              "type": "button",
              "props": {
                "style": {
                  "background": "linear-gradient(180deg,#2b6ef6,#185ed9)",
                  "color": "white",
                  "border": "none",
                  "padding": "10px 14px",
                  "borderRadius": "10px",
                  "fontWeight": "700",
                  "cursor": "pointer"
                }
              },
              "children": ["Get Started"]
            },
            {
              "type": "button",
              "props": {
                "style": {
                  "background": "white",
                  "border": "1px solid #d0d7ea",
                  "padding": "10px 14px",
                  "borderRadius": "10px",
                  "fontWeight": "600",
                  "cursor": "pointer"
                }
              },
              "children": ["Learn More"]
            }
          ]
        }
      ]
    },

    {
      "type": "section",
      "props": {
        "style": {
          "backgroundColor": "white",
          "padding": "20px",
          "borderRadius": "10px",
          "marginBottom": "20px",
          "boxShadow": "0px 8px 20px rgba(20,20,40,0.05)"
        }
      },
      "children": [
        { "type": "h2", "children": ["Feature List"] },
        {
          "type": "ul",
          "props": {
            "style": {
              "marginTop": "10px",
              "paddingLeft": "20px",
              "color": "#333",
              "lineHeight": "1.7"
            }
          },
          "children": [
            { "type": "li", "children": ["Deep JSON nesting support"] },
            { "type": "li", "children": ["Inline CSS inside props.style"] },
            { "type": "li", "children": ["Auto-sanitization of tag names"] },
            { "type": "li", "children": ["Complex forms, tables, layouts"] }
          ]
        }
      ]
    },

    {
      "type": "section",
      "props": {
        "style": {
          "backgroundColor": "white",
          "padding": "20px",
          "borderRadius": "10px",
          "marginBottom": "20px",
          "boxShadow": "0px 8px 20px rgba(20,20,40,0.05)"
        }
      },
      "children": [
        { "type": "h2", "children": ["Deep Nested Example (Level 10)"] },

        {
          "type": "div",
          "props": { "style": { "padding": "12px", "border": "1px solid #eee", "borderRadius": "8px" } },
          "children": [
            {
              "type": "div",
              "props": { "style": { "marginLeft": "15px", "borderLeft": "3px solid #9bb3ff", "padding": "10px" } },
              "children": [
                {
                  "type": "div",
                  "props": { "style": { "marginLeft": "15px", "borderLeft": "3px solid #b7ccff", "padding": "10px" } },
                  "children": [
                    {
                      "type": "div",
                      "props": { "style": { "marginLeft": "15px", "borderLeft": "3px solid #d1ddff", "padding": "10px" } },
                      "children": [
                        {
                          "type": "div",
                          "props": { "style": { "marginLeft": "15px", "borderLeft": "3px solid #e3eaff", "padding": "10px" } },
                          "children": [
                            {
                              "type": "p",
                              "props": {
                                "style": {
                                  "fontWeight": "700",
                                  "color": "#2447a8",
                                  "marginTop": "5px"
                                }
                              },
                              "children": ["Reached Level 10! 🌟"]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    {
      "type": "footer",
      "props": {
        "style": {
          "textAlign": "center",
          "padding": "12px",
          "color": "#6b7280",
          "fontSize": "0.9rem",
          "marginTop": "20px"
        }
      },
      "children": ["© 2025 Inline JSON Styled Demo"]
    }
  ]
}
`;





export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="UpperLayer" id="UpperMostDiv">

      <div className="App">
        <h1>WebSocket Test App</h1>
        <TestWebSocket />
      </div>

      <h1>WELCOME TO AI CHAT</h1>

      {/* DYNAMIC JSON RENDER */}
      <ModificationLLM inputString={testJson} />

      {open && <ChatBox onClose={() => setOpen(false)} />}

      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "12px 18px",
          borderRadius: "50%",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          fontSize: "16px",
        }}
      >
        Chat
      </button>
    </div>
  );
}
