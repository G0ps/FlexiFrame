import React, { useState, useRef } from "react";
import './style.css';

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
      setMessages((m) => [...m, { role: "assistant", content: assistantReply }] );

      // scroll to bottom after new message
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
    <div className="chatbox-container">
      <div className="chatbox-header">
        <strong>AI Chat</strong>
        <button className="chatbox-close" onClick={onClose}>X</button>
      </div>

      <div className="chatbox-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className="message-wrap">
            <div className="message-role">{m.role}</div>
            <div className={`message ${m.role === 'assistant' ? 'assistant' : 'user'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="typing">Assistant is typing...</div>}
      </div>

      <div className="chatbox-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type message..."
          className="chat-input"
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}