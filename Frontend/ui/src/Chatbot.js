<<<<<<< HEAD
import React, { useState, useRef } from "react";
import './style.css';
=======
import { useState, useRef, useEffect } from "react";
>>>>>>> origin/gopinath

export default function ChatBox({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();
  const wsRef = useRef(null);

  // Initialize WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:1000/ws/chat");
    wsRef.current = ws;

<<<<<<< HEAD
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await resp.json();
      const assistantReply = data.reply || "No reply";
      setMessages((m) => [...m, { role: "assistant", content: assistantReply }] );

      // scroll to bottom after new message
=======
    ws.onopen = () => {
      console.log("Connected to server");
      ws.send("Hello server!");
    };

    ws.onmessage = (event) => {
      console.log("Received:", event.data);
      setMessages((m) => [...m, { role: "assistant", content: event.data }]);
      setLoading(false);


      next_process_after_receiving_response(event.data);

      // Scroll to bottom
>>>>>>> origin/gopinath
      setTimeout(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      ws.close();
    };

  }, []);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Send via WebSocket
    wsRef.current.send(input);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
<<<<<<< HEAD
    <div className="chatbox-container">
      <div className="chatbox-header">
=======
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        right: "20px",
        width: "320px",
        height: "420px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8 }}>
>>>>>>> origin/gopinath
        <strong>AI Chat</strong>
        <button className="chatbox-close" onClick={onClose}>X</button>
      </div>

<<<<<<< HEAD
      <div className="chatbox-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className="message-wrap">
            <div className="message-role">{m.role}</div>
            <div className={`message ${m.role === 'assistant' ? 'assistant' : 'user'}`}>
=======
      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "8px", background: "#f8f8f8", borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{m.role}</div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                background: m.role === "assistant" ? "#fff" : "#e6f0ff",
                padding: 8,
                borderRadius: 6,
              }}
            >
>>>>>>> origin/gopinath
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="typing">Assistant is typing...</div>}
      </div>

<<<<<<< HEAD
      <div className="chatbox-input">
=======
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
>>>>>>> origin/gopinath
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type message..."
          className="chat-input"
        />
<<<<<<< HEAD
        <button className="send-btn" onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
=======
        <button
          onClick={sendMessage}
          style={{ padding: "8px 12px", borderRadius: 6, background: "#007bff", color: "white", border: "none" }}
        >
          Send
>>>>>>> origin/gopinath
        </button>
      </div>
      <button onClick={() => {clear_UI()}}> clear_UI </button>
    </div>
  );
<<<<<<< HEAD
=======
}


function next_process_after_receiving_response(data_k)
{
  const {action} = data_k;

  if(action === "append_UI")
  {
    append_UI(data_k);
  }
  else if(action === "modify_UI")
  {
    modify_UI(data_k);
  }
}

function append_UI(data_k){
  const newFunction = new Function(data_k.UI_design)
  const data = data_k.data
  console.log("Data look : " , data);
  newFunction(data_k);
}

function modify_UI(data_k){

}

function clear_UI()
{

>>>>>>> origin/gopinath
}