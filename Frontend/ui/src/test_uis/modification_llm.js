import { useState, useEffect, useRef } from "react";

export default function TestWebSocket() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket("ws://localhost:1001/ws/chat");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received:", data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(input);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Test WebSocket</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your prompt..."
        style={{ width: "100%", height: 50 }}
      />
      <button onClick={sendMessage} style={{ marginTop: 10 }}>
        Send
      </button>

      <div style={{ marginTop: 20 }}>
        <h3>Responses:</h3>
        {messages.map((msg, idx) => (
          <pre key={idx} style={{ background: "#f0f0f0", padding: 10 }}>
            {JSON.stringify(msg, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}
