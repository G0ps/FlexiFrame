import { useState, useRef, useEffect } from "react";

function convertToJson(inputString) {
  try {
    const cleaned = inputString.trim();
    console.log("Cleaned ready to parse json : " , cleaned)
    const jsonObj = JSON.parse(cleaned);
    console.log("[convertToJson] Parsed JSON successfully:", jsonObj);
    return jsonObj;
  } catch (err) {
    console.error("[convertToJson] Failed to parse JSON:", err.message);
    return null;
  }
}

export default function ChatBox({ onClose, setView }) {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();

  const [clientId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    console.log("[ChatBox] REST mode ready (WebSocket removed)");
    console.log("[ChatBox] Generated clientId:", clientId);
  }, [clientId]);

  const sendMessage = async () => {
    if (!input.trim()) {
      console.log("[sendMessage] Input is empty, aborting.");
      return;
    }

    console.log("[sendMessage] Sending message:", input);
    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const toSend = input;
    setInput("");

    try {
      console.log("[sendMessage] Sending POST request to /chat");
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: toSend,
          client_id: clientId
        })
      });

      console.log("[sendMessage] Waiting for response...");
      const data = await response.json();
      console.log("[sendMessage] REST response received:", data);

      setMessages((m) => [
        ...m,
        { role: "assistant", content: JSON.stringify(data, null, 2) }
      ]);

      setLoading(false);

      if (data.input) {
        console.log("[sendMessage] Data contains input, parsing UI...");
        const parsedUI = convertToJson(data.input);
        if (parsedUI) {
          console.log("[sendMessage] Updating parent UI state with:", parsedUI.ui);
          setView(parsedUI.ui);
        } else {
          console.log("[sendMessage] Failed to parse data.input");
        }
      } else {
        console.log("[sendMessage] No input field in response");
      }

      // scroll to bottom
      setTimeout(() => {
        console.log("[sendMessage] Scrolling chat to bottom");
        bodyRef.current?.scrollTo({
          top: bodyRef.current.scrollHeight,
          behavior: "smooth"
        });
      }, 50);

    } catch (err) {
      console.error("[sendMessage] REST error:", err);
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("[onKeyDown] Enter pressed, sending message");
      sendMessage();
    }
  };

  console.log("[ChatBox] Rendering component, messages length:", messages.length);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8
        }}
      >
        <strong>AI Chat</strong>
        <button
          onClick={() => {
            console.log("[onClose] Closing chatbox");
            onClose();
          }}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          X
        </button>
      </div>

      <div
        ref={bodyRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          background: "#f8f8f8",
          borderRadius: 6
        }}
      >
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
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontStyle: "italic", fontSize: 13 }}>
            Assistant is typing...
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => {
            console.log("[onChange] Updating input:", e.target.value);
            setInput(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            resize: "none",
            height: 50
          }}
        />
        <button
          onClick={() => {
            console.log("[Send Button] Clicked");
            sendMessage();
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: "#007bff",
            color: "white",
            border: "none"
          }}
        >
          Send
        </button>
      </div>

      <button
        onClick={() => {
          console.log("[Clear UI] Resetting view");
          setView && setView(null);
        }}
        style={{
          marginTop: 8,
          padding: "6px 10px",
          borderRadius: 6,
          background: "#dc3545",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Clear UI
      </button>
    </div>
  );
}
