import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import "./App.css";

// ✅ CORRECT BASE URL (matches your backend)
const API_BASE_URL = "https://gpt-clone-8nak.onrender.com/api/chat";

function App() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  // GET conversations
  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/conversations`);

      setConversations(res.data?.data?.conversations || []);
    } catch (error) {
      console.error("Fetch error:", error);
      setConversations([]);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // SEND message
  const handleSendMessage = async (question) => {
    if (!question.trim()) return;

    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    // safe update
    setConversations((prev) =>
      Array.isArray(prev) ? [...prev, tempUserMessage] : [tempUserMessage],
    );

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/conversations`, {
        question,
      });

      const { userConversation, assistantConversation } = res.data.data;

      setConversations((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];

        const filtered = safePrev.filter(
          (msg) => msg.id !== tempUserMessage.id,
        );

        return [...filtered, userConversation, assistantConversation];
      });
    } catch (error) {
      console.error("Send error:", error);

      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: error.response?.data?.message || "Error generating response",
      };

      setConversations((prev) =>
        Array.isArray(prev) ? [...prev, errorMsg] : [errorMsg],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="chat">
        <ChatHeader />

        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
