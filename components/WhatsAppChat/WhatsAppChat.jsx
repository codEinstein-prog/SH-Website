import React, { useCallback, useEffect, useRef, useState } from "react";
import "./whatsapp.css";

const INITIAL_MESSAGE = {
  id: 1,
  sender: "bot",
  text: "Hi! 👋 Welcome. How can we help you today?",
};

const QUICK_OPTIONS = [
  {
    id: "quote",
    label: "Request a Quote",
    message: "Hi, I would like to request a quote.",
  },
  {
    id: "services",
    label: "Ask About Services",
    message: "Hi, I would like to learn more about your services.",
  },
  {
    id: "consultation",
    label: "Book a Consultation",
    message: "Hi, I would like to book a consultation.",
  },
  {
    id: "agent",
    label: "Talk to an Agent",
    message: "Hi, I would like to speak with someone.",
  },
];

// ============================================================
// WhatsApp Icon
// ============================================================
function WhatsAppIcon({ size = 28 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.511-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.002 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.946L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.479-8.413" />
    </svg>
  );
}

// ============================================================
// Chat Header
// ============================================================
function ChatHeader({ onClose }) {
  return (
    <div className="whatsapp-chat-header">
      <div className="whatsapp-agent">
        <div className="whatsapp-agent-icon">
          <WhatsAppIcon size={23} />
        </div>

        <div className="whatsapp-agent-info">
          <strong>Chat with us</strong>
          <span>
            <i className="whatsapp-online-dot" />
            Usually replies quickly
          </span>
        </div>
      </div>

      <button
        type="button"
        className="whatsapp-close-button"
        onClick={onClose}
        aria-label="Close WhatsApp chat"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// Chat Message
// ============================================================
function ChatMessage({ message }) {
  return (
    <div
      className={`whatsapp-message-row ${
        message.sender === "user"
          ? "whatsapp-message-user"
          : "whatsapp-message-bot"
      }`}
    >
      <div className="whatsapp-message">
        {message.text}
      </div>
    </div>
  );
}

// ============================================================
// Main Chat Component
// ============================================================
function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const pollingRef = useRef(false);
  const sendingRef = useRef(false);
  const messagesRef = useRef([]);

  const loadMessages = useCallback(async () => {
    if (pollingRef.current || sendingRef.current) return;
    pollingRef.current = true;
    try {
      const response = await fetch("/api/chat", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load messages");

      const history = (result.messages || []).map((item) => ({
        id: `chatwoot-${item.id}`,
        sender: item.messageType === 0 || item.messageType === "incoming" ? "user" : "bot",
        text: item.content,
      }));
      // Display the same existing welcome greeting and retain server message IDs.
      messagesRef.current = history;
      setMessages([INITIAL_MESSAGE, ...history]);
    } catch (error) {
      console.error("Chat history error:", error);
      // Do not clear existing messages when a poll fails.
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    void loadMessages();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isOpen, loadMessages]);

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) setMessages([INITIAL_MESSAGE]);
  };

  const closeChat = () => setIsOpen(false);

  const sendMessage = async ({ type, message, displayText, optionId }) => {
    if (sendingRef.current) return false;
    sendingRef.current = true;
    setIsSending(true);
    setSendError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type, message, optionId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");

      // Chatwoot confirms message creation; a human reply arrives separately.
      if (result.message?.id) {
        const newMessage = {
          id: `chatwoot-${result.message.id}`,
          sender: "user",
          text: message,
        };
        setMessages((previous) => previous.some((m) => m.id === newMessage.id)
          ? previous : [...previous, newMessage]);
      }
      return true;
    } catch (error) {
      setSendError(`${error instanceof Error ? error.message : "Message failed."} Check the conversation before retrying.`);
      return false;
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      void loadMessages();
    }
  };

  const handleQuickOption = (option) => {
    void sendMessage({
      type: "quick_question",
      message: option.message,
      displayText: option.label,
      optionId: option.id,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const sent = await sendMessage({
      type: "message",
      message: trimmedMessage,
      displayText: trimmedMessage,
    });

    if (sent) {
      setInput("");
    }
  };

  return (
    <>
      {/* ======================================================
          Chat Window
          ====================================================== */}
      {isOpen && (
        <div
          className="whatsapp-chat-window"
          role="dialog"
          aria-label="WhatsApp chat"
        >
          <ChatHeader onClose={closeChat} />

          {/* Messages */}
          <div className="whatsapp-chat-body">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Quick Options */}
            <div className="whatsapp-quick-options">
              {QUICK_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="whatsapp-quick-button"
                  onClick={() => handleQuickOption(option)}
                    disabled={isSending}
                  >
                    {option.label}
                  </button>
              ))}
          </div>

              {isSending && (
                <p className="px-5 pb-3 text-sm text-gray-500" role="status">
                  Sending...
                </p>
              )}
              {sendError && (
                <p
                  className="mx-5 mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {sendError}
                </p>
              )}
            </div>

            <div className="whatsapp-handoff">
              Messages and quick questions go to our support team.
            </div>

          {/* Message Input */}
          <form
            className="whatsapp-input-area"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              aria-label="Type a message"
              disabled={isSending}
            />

            <button
              type="submit"
              className="whatsapp-send-button"
              aria-label="Send message"
              disabled={!input.trim() || isSending}
            >
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>

          <div className="whatsapp-powered">
            Live chat
          </div>
        </div>
      )}

      {/* ======================================================
          Floating Button
          ====================================================== */}
      <button
        type="button"
        className={`whatsapp-floating-button ${
          isOpen ? "whatsapp-floating-button-open" : ""
        }`}
        onClick={isOpen ? closeChat : openChat}
        aria-label={isOpen ? "Close WhatsApp chat" : "Open WhatsApp chat"}
        aria-expanded={isOpen}
      >
        <span className="whatsapp-icon-wrapper">
          {isOpen ? (
            <span className="whatsapp-x-icon">×</span>
          ) : (
            <WhatsAppIcon size={30} />
          )}
        </span>

        {!isOpen && (
          <span className="whatsapp-floating-label">
            Chat with us
          </span>
        )}
      </button>
    </>
  );
}

export default WhatsAppChat;