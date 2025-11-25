import { useState, useRef } from "react";

export default function ChatBox({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await resp.json();
      const assistantReply = data.reply || "No reply";
      setMessages((m) => [...m, { role: "assistant", content: assistantReply }]);
     
      setTimeout(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
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
        <strong>AI Chat</strong>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
          X
        </button>
      </div>

       <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "8px", background: "#f8f8f8", borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{m.role}</div>
            <div style={{ whiteSpace: "pre-wrap", background: m.role === "assistant" ? "#fff" : "#e6f0ff", padding: 8, borderRadius: 6 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontStyle: "italic", fontSize: 13 }}>Assistant is typing...</div>}
      </div>

       <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type message..."
          style={{ flex: 1, padding: 8, borderRadius: 6, resize: "none", height: 50 }}
        />
        <button onClick={sendMessage} style={{ padding: "8px 12px", borderRadius: 6, background: "#007bff", color: "white", border: "none" }}>
          Send
        </button>
      </div>
    </div>
  );
}
