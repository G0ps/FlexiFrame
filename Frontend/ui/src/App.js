import React, { useState, useEffect } from "react";
import ChatBox from "./Chatbot.js";
import TestWebSocket from "./test_uis/modification_llm.js";
import ModificationLLM from "./test_uis/modification_llm.js";

function convertToJson(inputString) {
  try {
    // If the string contains escaped quotes, first fix it
    const cleaned = inputString.trim();

    // Convert to JSON
    const jsonObj = JSON.parse(cleaned);
    return jsonObj;
  } catch (err) {
    console.error("Failed to parse JSON:", err.message);
    return null;
  }
}

export default function App() {

  const [open, setOpen] = useState(false);

  // ⭐ initialJson is now a STATE variable
  const [initialJson, setInitialJson] = useState(`
  {
    "type": "div",
    "props": { "style": { "padding": "20px", "backgroundColor": "#eee" } },
    "children": [
      { "type": "h1", "children": ["Waiting for socket data..."] }
    ]
  }
  `);

  // ⭐ testJson starts from initialJson
  const [testJson, setTestJson] = useState(initialJson);

  // SOCKET INSTANCE
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:2000/ws/chat");
    setSocket(ws);

    ws.onopen = () => console.log("WS Connected ✔");

    ws.onmessage = (event) => {
      try {
        console.log("Event , ", event)
        const data = JSON.parse(event.data);
        console.log("Data : " , data.input)
        console.log("TYpe of that : " , typeof convertToJson(data.input));
        if (data.status === "success" && data.input) {
          console.log("Updating testJson with socket data");

          // 🔥 update dynamic ui
          setTestJson(data.input);
        }

      } catch (err) {
        console.error("WS Parse Error:", err);
      }
    };

    ws.onerror = (err) => console.error("WS Error:", err);
    ws.onclose = () => console.log("WS Closed ❌");

    return () => ws.close();
  }, []);

  // Send message to socket
  const sendHello = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send("give me data of the 10 todos with a minimal");
      console.log("Sent → hello");
    }
  };

  return (
  <div className="UpperLayer" id="UpperMostDiv">

    <div className="App">
      <h1>WebSocket Test App</h1>

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
        Send Hello to Socket
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
