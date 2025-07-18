import React, { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaMicrophone,
  FaPaperPlane,
  FaTimes,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import aiService from "../../api/aiService";
import styles from "./AIAssistant.module.css";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const recognition = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("ai-assistant-messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        "ai-assistant-messages",
        JSON.stringify(messages.slice(-20))
      ); // Keep last 20 messages
    }
  }, [messages]);

  // Khởi tạo Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "vi-VN"; // Tiếng Việt

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Theo dõi trạng thái online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSpeechToggle = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      if (recognition.current) {
        recognition.current.start();
        setIsListening(true);
      } else {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Thử gọi API backend trước, nếu fail thì dùng offline processing
      const result = await aiService.processMessage(userMessage);

      setMessages((prev) => [
        ...prev,
        { type: "assistant", content: result.response },
      ]);

      // Phát âm thanh thông báo
      playNotificationSound();

      // Xử lý các action
      if (result.action) {
        await handleAction(result.action, result.data);
      }
    } catch (error) {
      console.error("AI Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content:
            "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action, data) => {
    switch (action) {
      case "NAVIGATE":
        if (data?.path) {
          setTimeout(() => {
            navigate(data.path);
            setIsOpen(false);
          }, 1500);
        }
        break;

      case "CONFIRM_ADD_TRANSACTION":
        // Hiển thị confirmation với quick action buttons
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: `Xác nhận tạo giao dịch:\n• Loại: ${
              data.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
            }\n• Số tiền: ${data.amount?.toLocaleString()}đ\n• Mô tả: ${
              data.name
            }\n• Danh mục: ${data.categoryGuess || "Chưa xác định"}`,
            showConfirmButtons: true,
            transactionData: data,
          },
        ]);
        break;

      case "ADD_TRANSACTION":
        // Có thể mở modal thêm giao dịch hoặc navigate với pre-filled data
        setTimeout(() => {
          navigate("/transactions", { state: { prefilledData: data } });
          setIsOpen(false);
        }, 1500);
        break;

      case "ADD_GOAL":
        setTimeout(() => {
          navigate("/goals", { state: { prefilledData: data } });
          setIsOpen(false);
        }, 1500);
        break;

      default:
        break;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem("ai-assistant-messages");
  };

  const handleConfirmTransaction = async (transactionData) => {
    try {
      setIsLoading(true);
      const result = await aiService.createTransactionFromAI(transactionData);

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: "✅ Giao dịch đã được tạo thành công!",
          },
        ]);
        playNotificationSound();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: "❌ Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "❌ Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTransaction = () => {
    setMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: "Đã hủy tạo giao dịch. Bạn có cần hỗ trợ gì khác không?",
      },
    ]);
  };

  const quickActions = [
    { label: "Xem thống kê", command: "Xem thống kê tháng này" },
    { label: "Thêm chi tiêu", command: "Thêm chi tiêu 50k" },
    { label: "Tạo mục tiêu", command: "Tạo mục tiêu tiết kiệm 5 triệu" },
    { label: "Xem số dư", command: "Xem tổng số dư" },
  ];

  const handleQuickAction = (command) => {
    setMessage(command);
  };

  const getSampleCommands = () => [
    "Thêm giao dịch chi tiêu 50k cho ăn uống",
    "Xem tổng chi tiêu tháng này",
    "Tạo mục tiêu tiết kiệm 5 triệu",
    "Xem thống kê thu chi",
    "Thêm tài khoản mới",
    "Tạo danh mục mới",
  ];

  // Phát âm thanh thông báo
  const playNotificationSound = () => {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LozmYdBySM0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Io"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      });
    } catch {
      // Ignore audio errors
    }
  };

  // Ẩn AI Assistant trên các trang không cần thiết
  const hiddenPaths = ["/", "/login", "/register"];
  const shouldHide = hiddenPaths.includes(location.pathname);

  // Không render nếu cần ẩn
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        className={styles.floatingButton}
        onClick={handleToggle}
        title="AI Assistant"
      >
        <FaRobot />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <FaRobot className={styles.headerIcon} />
                <h3>AI Assistant</h3>
                <span
                  className={`${styles.statusDot} ${
                    isOnline ? styles.online : styles.offline
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                ></span>
              </div>
              <div className={styles.headerActions}>
                {messages.length > 0 && (
                  <button
                    className={styles.clearButton}
                    onClick={clearChatHistory}
                    title="Xóa lịch sử"
                  >
                    🗑️
                  </button>
                )}
                <button className={styles.closeButton} onClick={handleClose}>
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.length === 0 ? (
                <div className={styles.welcomeMessage}>
                  <h4>Xin chào! Tôi có thể giúp bạn:</h4>
                  <div className={styles.quickActionsGrid}>
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className={styles.quickActionButton}
                        onClick={() => handleQuickAction(action.command)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                  <ul className={styles.sampleCommands}>
                    {getSampleCommands().map((command, index) => (
                      <li key={index} onClick={() => setMessage(command)}>
                        {command}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${styles[msg.type]}`}
                  >
                    <div className={styles.messageContent}>
                      {msg.content}
                      {msg.showConfirmButtons && (
                        <div className={styles.confirmButtons}>
                          <button
                            className={styles.confirmButton}
                            onClick={() =>
                              handleConfirmTransaction(msg.transactionData)
                            }
                          >
                            ✅ Xác nhận
                          </button>
                          <button
                            className={styles.cancelButton}
                            onClick={handleCancelTransaction}
                          >
                            ❌ Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typing}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form className={styles.inputForm} onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập yêu cầu của bạn..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`${styles.speechButton} ${
                    isListening ? styles.listening : ""
                  }`}
                  onClick={handleSpeechToggle}
                  disabled={isLoading}
                  title={isListening ? "Dừng ghi âm" : "Ghi âm"}
                >
                  {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={!message.trim() || isLoading}
                  title="Gửi"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
