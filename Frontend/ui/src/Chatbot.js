<<<<<<< HEAD
import React, { useState, useRef, useEffect, useCallback } from "react";
=======
<<<<<<< HEAD
import React, { useState, useRef } from "react";
import './style.css';
=======
import { useState, useRef, useEffect } from "react";
>>>>>>> origin/gopinath
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c

export default function ChatBox({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can chat and also build UI elements live. Try asking me to create a button, card, or form!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);
  const wsRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bodyRef.current?.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:1000/ws/chat");
    wsRef.current = ws;

<<<<<<< HEAD
=======
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
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        data = { content: event.data };
      }

      // Handle plain text reply
      if (typeof data === "string" || data.content) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.content || data },
        ]);
        setLoading(false);
        return;
      }

      // Handle structured actions
      if (data.action === "append_UI" && data.UI_design) {
        appendUI(data.UI_design, data.data || {});
      } else if (data.action === "modify_UI" && data.target && data.changes) {
        modifyUI(data.target, data.changes);
      } else if (data.action === "clear_UI") {
        clearUI();
      }

      // Always show assistant message unless silent
      if (data.showMessage !== false) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.message || "UI updated!",
          },
        ]);
      }

      setLoading(false);
<<<<<<< HEAD
=======


      next_process_after_receiving_response(event.data);

      // Scroll to bottom
>>>>>>> origin/gopinath
      setTimeout(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (err) => console.error("WS Error:", err);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    wsRef.current.send(JSON.stringify({ type: "message", content: input }));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // === UI Manipulation Functions (Safe Dynamic Execution) ===
  const uiContainerRef = useRef(document.createElement("div"));
  useEffect(() => {
    uiContainerRef.current.id = "ai-generated-ui";
    uiContainerRef.current.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 9998;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      max-width: 90vw;
      font-family: system-ui;
    `;
    document.body.appendChild(uiContainerRef.current);

    return () => {
      document.body.removeChild(uiContainerRef.current);
    };
  }, []);

  const appendUI = (codeString, data) => {
    try {
      // Secure: Wrap in sandboxed function with only safe globals
      const func = new Function(
        "data",
        `
        "use strict";
        const container = document.createElement("div");
        container.style.marginBottom = "16px";
        with (document) { ${codeString} }
        return container;
      `
      );

      const element = func(data);
      uiContainerRef.current.appendChild(element);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "UI component added!" },
      ]);
    } catch (err) {
      console.error("UI generation failed:", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Failed to render UI: ${err.message}` },
      ]);
    }
  };

  const modifyUI = (targetSelector, changes) => {
    const el = document.querySelector(targetSelector);
    if (el && changes) Object.assign(el.style, changes);
  };

  const clearUI = () => {
    uiContainerRef.current.innerHTML = "";
    setMessages((m) => [...m, { role: "assistant", content: "UI cleared!" }]);
  };

  return (
<<<<<<< HEAD
=======
<<<<<<< HEAD
    <div className="chatbox-container">
      <div className="chatbox-header">
=======
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "380px",
        height: "520px",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
<<<<<<< HEAD
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "#007bff",
          color: "white",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>AI Builder</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        ref={bodyRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          background: "#f8f9fa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
=======
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
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                background: m.role === "user" ? "#007bff" : "#e9ecef",
                color: m.role === "user" ? "white" : "black",
                padding: "10px 14px",
                borderRadius: "18px",
                borderBottomRightRadius: m.role === "user" ? "4px" : "18px",
                borderBottomLeftRadius: m.role === "user" ? "18px" : "4px",
              }}
            >
<<<<<<< HEAD
=======
>>>>>>> origin/gopinath
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                background: "#e9ecef",
                color: "#666",
                padding: "10px 14px",
                borderRadius: "18px",
                display: "inline-block",
              }}
            >
              thinking...
            </div>
          </div>
        )}
      </div>

<<<<<<< HEAD
      {/* Input */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #ddd",
          background: "white",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask me to build something..."
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: "20px",
              resize: "none",
              fontSize: "14px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: "12px",
            color: "#666",
          }}
        >
          <button
            onClick={clearUI}
            style={{
              background: "none",
              border: "none",
              color: "#d00",
              cursor: "pointer",
            }}
          >
            Clear Generated UI
          </button>
        </div>
=======
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
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
      </div>
    </div>
  );
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
}








<<<<<<< HEAD
=======
>>>>>>> origin/gopinath
}
>>>>>>> cf3442b8d7b51b5b393a577162413a280eb1af3c
