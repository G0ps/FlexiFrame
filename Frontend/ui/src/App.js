import { useState } from "react";
import ChatBox from "./Chatbot.js";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h1>WELCOME TO AI CHAT</h1>

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
