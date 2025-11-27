import React, { useState, useEffect } from "react";
import ChatBox from "./Chatbot.js";
import TestWebSocket from "./UiBuilder/Ui_Builder.js";
import ModificationLLM from "./UiBuilder/Ui_Builder.js";

function convertToJson(inputString) {
  try {
    const cleaned = inputString.trim();
    const jsonObj = JSON.parse(cleaned);
    return jsonObj;
  } catch (err) {
    console.error("Failed to parse JSON:", err.message);
    return null;
  }
}

export default function App() {
  const [open, setOpen] = useState(false);

  const [initialJson, setInitialJson] = useState(
  {
    "type": "div",
    "props": { "style": { "padding": "20px", "backgroundColor": "#eee" } },
    "children": [
      { "type": "h1", "children": ["Waiting for socket data..."] }
    ]
  }
  );

  const [testJson, setTestJson] = useState(initialJson);

  // Instead of socket instance
  const [clientId] = useState(() => crypto.randomUUID());

  // -------------------------------
  // REST POLLING (replaces WebSocket)
  // -------------------------------
  useEffect(() => {
    console.log("REST mode initialized ✔ (WebSocket removed)");
  }, []);

  // Send message (replacing WebSocket send)
  const sendHello = async () => {
    try {
      const response = await fetch("http://localhost:2000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "give me data of the 10 todos with a minimal",
          client_id: clientId
        })
      });

      const data = await response.json();
      console.log("REST Response:", data);

      if (data.status === "success" && data.input) {
        console.log("Updating UI with REST data");
        setTestJson(data.input);
      }
    } catch (err) {
      console.error("REST Error:", err);
    }
  };

  return (
    <div className="UpperLayer" id="UpperMostDiv">

      <div className="App">
        <h1>REST Test App (WebSocket removed)</h1>

        <button
          onClick={sendHello}
          style={{
            padding: "10px 14px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          Send Hello (REST)
        </button>

        <TestWebSocket />
      </div>

      <h1>WELCOME TO AI CHAT</h1>

      {/* 🔥 Pass dynamic JSON to your renderer */}
      <ModificationLLM inputString={JSON.stringify(testJson)} />

      {/* 🔹 Pass setTestJson as setView */}
      {open && <ChatBox onClose={() => setOpen(false)} setView={setTestJson} />}

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
