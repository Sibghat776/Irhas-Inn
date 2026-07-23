"use client";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { showToast } from "../utils/commonFunctions"; // adjust path if needed

type ChatMessage = {
  role: "user" | "ai";
  content: string;
  product?: any;
  viewAll?: boolean; // flag for multiple results
  query?: string; // original user query
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/";

export default function AIProductChat() {
  const pathname = usePathname();
  if (pathname?.startsWith("/Admin")) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: queryText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${baseUrl}product/ai/search-products`, // Fixed endpoint path
        { query: userMsg.content },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const json = res.data;

      if (json?.data?.intent?.isProductQuery === false) {
        const aiMsg: ChatMessage = { role: "ai", content: json.data.message || json.message };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (json?.data?.products?.length === 1) {
        const product = json.data.products[0];
        const aiMsg: ChatMessage = { role: "ai", content: `Found a match for you:`, product };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (json?.data?.products?.length > 1) {
        const count = json.data.count || json.data.products.length;
        const aiMsg: ChatMessage = {
          role: "ai",
          content: `Found ${count} products matching "${userMsg.content}".`,
          viewAll: true,
          query: userMsg.content,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const aiMsg: ChatMessage = { role: "ai", content: "No products found." };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const aiMsg: ChatMessage = { role: "ai", content: "Sorry, something went wrong. Please try again later." };
      setMessages((prev) => [...prev, aiMsg]);
      showToast(
        err?.response?.data?.message || "Error connecting to AI search",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendQuery(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = ["Show me jackets", "New arrivals", "Best sellers"];

  return (
    <>
      {/* Floating Trigger Button — clean, no pulse/funky animation */}
      <button
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A84E] text-white shadow-md hover:shadow-lg hover:bg-[#C8A84E] transition-all duration-200"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open AI chat"
      >
        <MessageSquare size={22} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex justify-end">
          <div
            className="w-[calc(100vw-3rem)] max-w-sm sm:max-w-md origin-bottom-right transition-all duration-200 ease-out"
            style={{ animation: "chatPopIn 200ms ease-out" }}
          >
            <div className="flex flex-col w-full h-[70vh] max-h-[560px] bg-white rounded-2xl border border-[#EEEEEE] shadow-xl overflow-hidden">
              {/* Header — clean, single brand color, no gradient */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#C8A84E] text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Bot size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm leading-tight">Shop Assistant</h3>
                  <p className="text-[11px] text-white/60 leading-tight">Online</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFFFF]">
                {messages.length === 0 && (
                  <div className="text-center text-[#222831] mt-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A84E]/10">
                      <Bot size={22} className="text-[#222831]" />
                    </div>
                    <p className="text-sm font-medium text-[#222831]">
                      Hi! How can I help you find something today?
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {quickReplies.map((txt, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuery(txt)}
                          className="px-3 py-1.5 bg-white border border-[#EEEEEE] text-[#222831] rounded-full text-xs font-medium hover:border-[#C8A84E] hover:text-[#C8A84E] transition-colors"
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                          ? "bg-[#C8A84E] text-white rounded-br-sm"
                          : "bg-white text-[#222831] border border-[#EEEEEE] rounded-bl-sm"
                        }`}
                    >
                      {msg.content}
                      {/* Button for viewing all results when multiple products */}
                      {msg.viewAll && msg.query && (
                        <a
                          href={`/ai-search?q=${encodeURIComponent(msg.query)}`}
                          className="block mt-2 text-sm font-medium text-[#222831] hover:underline"
                        >
                          View all results →
                        </a>
                      )}
                      {msg.product && (
                        <div className="mt-2 p-2 border border-[#EEEEEE] rounded-lg bg-[#FFFFFF]">
                          <img
                            src={msg.product.images?.[0]?.url}
                            alt={msg.product.name}
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <p className="font-medium mt-1.5 text-[#222831] text-sm">{msg.product.name}</p>
                          <p className="text-sm text-[#222831]">${msg.product.price}</p>
                          <a
                            href={`/product/${msg.product._id}`}
                            className="mt-1 inline-block text-xs font-medium text-[#222831] hover:underline"
                          >
                            View Product →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#EEEEEE] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#FFFFFF] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FFFFFF] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FFFFFF] rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[#EEEEEE] p-3 flex items-center gap-2 bg-white">
                <input
                  className="flex-1 rounded-full border border-[#EEEEEE] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A84E]/40 focus:border-[#C8A84E]"
                  placeholder="Ask about products..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center bg-[#C8A84E] hover:bg-[#C8A84E] text-white rounded-full disabled:opacity-40 transition-colors"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes chatPopIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}