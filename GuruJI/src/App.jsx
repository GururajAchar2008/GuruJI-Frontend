import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import remarkGfm from "remark-gfm";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const typeText = (fullText) => {
    let i = -1;
    setIsTyping(true);

    const interval = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        
        // Ensure we don't go out of bounds
        if (i < fullText.length - 1) {
          i++;
          updated[lastIdx] = { ...updated[lastIdx], text: (updated[lastIdx].text || "") + fullText[i] };
          return updated;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          return prev;
        }
      });
    }, 15); // Slightly faster for better UX
  };

 const sendMessage = async () => {
  if (!input.trim() || isTyping) return;

  const userText = input;
  setInput("");

  // Add user message + empty AI bubble
  setMessages((prev) => [
    ...prev,
    { role: "user", text: userText },
    { role: "ai", text: "" }
  ]);

  setIsTyping(true);
    setTimeout(() => {
    setIsTyping(false);
  }, 30000); // 👈 stay true until backend responds

  try {
    const res = await fetch(
      "https://guru-ji-ai-backend-2.onrender.com/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
            messages: messages
             .filter(m => m.role === "user" || m.role === "assistant")
             .map(m => ({
              role: m.role === "ai" ? "assistant" : "user",
              content: m.text
    })) 
    .concat({ role: "user", content: userText })
})

      }
    );

    if (!res.ok) {
      throw new Error("SERVER_BUSY");
    }

    const data = await res.json();

    if (!data.reply) {
      throw new Error("INVALID_RESPONSE");
    }

    // Animate response only AFTER server wakes up
    typeText(data.reply);

  } catch (error) {
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].text =
        "⏳ Guru JI is waking up… please send again in a moment.";
      return updated;
    });
    setIsTyping(false);
  }
};



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <header className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">
          Guru<span className="text-orange-500">JI</span>
        </h1>
        <div className="text-xs text-gray-400">By Gururaj Achar</div>
      </header>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="w-full max-w-4xl flex-1 overflow-y-auto p-6 rounded-2xl bg-white mb-16 chat-area"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-xl">Namaste! How can I help you today?</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
              }`}
            >
              {msg.role === "ai" ? (
                <div className={`prose 
  prose-sm 
  sm:prose-base
  prose-headings:text-blue-700
  prose-strong:text-gray-900
  prose-code:bg-gray-900
  prose-code:text-green-400
  prose-code:px-2
  prose-code:py-1
  prose-code:rounded-md
  prose-pre:bg-gray-900
  prose-pre:text-gray-100
  prose-pre:rounded-xl
  prose-pre:p-4
  prose-li:marker:text-blue-500
  max-w-none ${isTyping && i === messages.length - 1 ? "typing" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text ||""}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-gray-400 animate-pulse">Guru JI is thinking...</div>}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-4 left-0 right-0 w-full flex items-center justify-center gap-2 px-3 sm:gap-3 sm:p-5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask GuruJI anything..."
          className="flex-1 max-w-xs sm:max-w-none sm:h-18 bg-blue-300 border border-gray-300 p-2 sm:p-4 rounded-full shadow-inner outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm sm:text-base app-input"
        />
        <button
          onClick={sendMessage}
          disabled={isTyping}
          className={`${
            isTyping ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } h-10 w-10 sm:h-18 sm:w-18 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0 app-send`}
        >
          <span className="text-lg sm:text-xl">➤</span>
        </button>
      </div>
    </div>
  );
}

export default App;