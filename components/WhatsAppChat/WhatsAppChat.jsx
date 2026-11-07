
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./whatsapp.css";
import { API_BASE_URL } from "/app/config/api";

/*
 * Solar Harbour — Website Chat
 *
 * Compatible with the rewritten Vercel /api/chat backend.
 *
 * Features:
 * - Chatwoot API inbox integration
 * - Persistent conversation within the browser tab
 * - Signed session-token authentication
 * - Cross-origin cookie support
 * - Message history synchronization
 * - Agent reply polling
 * - Quick questions
 * - Duplicate message protection
 * - Safe error handling
 * - Existing WhatsApp widget styling
 */

// ============================================================
// CONFIGURATION
// ============================================================

const FALLBACK_API_BASE =
  "https://sh-website-ten.vercel.app";

const API_BASE = String(
  API_BASE_URL || FALLBACK_API_BASE
).replace(/\/+$/, "");

const CHAT_API = `${API_BASE}/api/chat`;

const SESSION_KEY = "solar_harbour_chat_session_v3";

const POLL_INTERVAL = 5000;

const INITIAL_MESSAGE = {
  id: "welcome-message",
  sender: "bot",
  text: "Hi! 👋 Welcome. How can we help you today?",
  createdAt: 0,
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
// SESSION MANAGEMENT
// ============================================================

function getSessionToken() {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveSessionToken(token) {
  if (typeof token !== "string" || !token) {
    return;
  }

  try {
    sessionStorage.setItem(SESSION_KEY, token);
  } catch {
    console.warn(
      "Browser session storage is unavailable."
    );
  }
}

function clearSessionToken() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable.
  }
}

function createHeaders() {
  const token = getSessionToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

// ============================================================
// API REQUEST HELPER
// ============================================================

async function chatRequest(method = "GET", payload) {
  let response;

  try {
    response = await fetch(CHAT_API, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: createHeaders(),
      ...(payload === undefined
        ? {}
        : { body: JSON.stringify(payload) }),
    });
  } catch {
    throw new Error(
      "Unable to connect to chat. Please check your connection."
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The chat server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
      `Chat request failed (HTTP ${response.status}).`
    );
  }

  if (result.sessionToken) {
    saveSessionToken(result.sessionToken);
  }

  return result;
}

// ============================================================
// MESSAGE NORMALIZATION
// ============================================================

function getTimestamp(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const parsed = Date.parse(value);

    if (Number.isFinite(parsed)) {
      return parsed / 1000;
    }
  }

  return 0;
}

function normalizeMessage(item) {
  if (!item || item.id == null) {
    return null;
  }

  const type =
    item.messageType ??
    item.message_type;

  const incoming =
    type === 0 ||
    type === "0" ||
    type === "incoming";

  const outgoing =
    type === 1 ||
    type === "1" ||
    type === "outgoing";

  if (!incoming && !outgoing) {
    return null;
  }

  if (item.private === true) {
    return null;
  }

  const text =
    typeof item.content === "string"
      ? item.content.trim()
      : "";

  if (!text) {
    return null;
  }

  return {
    id: `chatwoot-${item.id}`,
    sender: incoming ? "user" : "bot",
    text,
    createdAt: getTimestamp(
      item.createdAt ?? item.created_at
    ),
  };
}

function mergeMessages(previous, incoming) {
  const existing = new Map();

  for (const message of previous) {
    if (message.id !== INITIAL_MESSAGE.id) {
      existing.set(message.id, message);
    }
  }

  for (const message of incoming) {
    if (message?.id) {
      existing.set(message.id, message);
    }
  }

  const ordered = [...existing.values()].sort(
    (a, b) =>
      (a.createdAt || 0) -
      (b.createdAt || 0)
  );

  return [INITIAL_MESSAGE, ...ordered];
}

// ============================================================
// WHATSAPP ICON
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
// CHAT HEADER
// ============================================================

function ChatHeader({ onClose, status }) {
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
            {status === "connecting"
              ? "Connecting..."
              : "Usually replies quickly"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="whatsapp-close-button"
        onClick={onClose}
        aria-label="Close chat"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// CHAT MESSAGE
// ============================================================

function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`whatsapp-message-row ${
        isUser
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
// MAIN CHAT COMPONENT
// ============================================================

function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);

  const [input, setInput] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [sendError, setSendError] = useState("");

  const [status, setStatus] = useState("idle");

  const messagesEndRef = useRef(null);

  const pollingRef = useRef(false);

  const sendingRef = useRef(false);

  const mountedRef = useRef(true);

  // ----------------------------------------------------------
  // COMPONENT LIFECYCLE
  // ----------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ----------------------------------------------------------
  // LOAD CHAT HISTORY
  // ----------------------------------------------------------

  const loadMessages = useCallback(async () => {
    if (
      pollingRef.current ||
      sendingRef.current
    ) {
      return;
    }

    pollingRef.current = true;

    try {
      const result = await chatRequest("GET");

      if (!mountedRef.current) {
        return;
      }

      // Do not apply potentially stale history
      // while a send operation is underway.
      if (sendingRef.current) {
        return;
      }

      if (!result.connected) {
        // Do not delete displayed messages just
        // because the session is unavailable.
        if (getSessionToken()) {
          clearSessionToken();
        }

        setStatus("idle");
        return;
      }

      if (!Array.isArray(result.messages)) {
        throw new Error(
          "The server returned an invalid message history."
        );
      }

      const history = result.messages
        .map(normalizeMessage)
        .filter(Boolean);

      setMessages((previous) =>
        mergeMessages(previous, history)
      );

      setStatus("connected");
      setSendError("");
    } catch (error) {
      console.error(
        "Chat history synchronization failed:",
        error
      );

      if (mountedRef.current) {
        setStatus("error");
      }

      // Keep existing messages visible.
    } finally {
      pollingRef.current = false;
    }
  }, []);

  // ----------------------------------------------------------
  // MESSAGE POLLING
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    void loadMessages();

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible"
      ) {
        void loadMessages();
      }
    }, POLL_INTERVAL);

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible"
      ) {
        void loadMessages();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isOpen, loadMessages]);

  // ----------------------------------------------------------
  // AUTO SCROLL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, isOpen]);

  // ----------------------------------------------------------
  // OPEN AND CLOSE CHAT
  // ----------------------------------------------------------

  const openChat = () => {
    setIsOpen(true);
    setSendError("");
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  // ----------------------------------------------------------
  // SEND CHAT MESSAGE
  // ----------------------------------------------------------

  const sendMessage = async ({
    type,
    message,
    optionId,
  }) => {
    if (sendingRef.current) {
      return false;
    }

    const content = message?.trim();

    if (!content) {
      return false;
    }

    sendingRef.current = true;

    setIsSending(true);
    setSendError("");

    try {
      const result = await chatRequest(
        "POST",
        {
          type,
          message: content,
          ...(optionId ? { optionId } : {}),
        }
      );

      if (
        !result.success ||
        !result.message?.id
      ) {
        throw new Error(
          "The server did not confirm the message."
        );
      }

      const newMessage = normalizeMessage(
        result.message
      ) || {
        id: `chatwoot-${result.message.id}`,
        sender: "user",
        text: content,
        createdAt: Date.now() / 1000,
      };

      // A visitor-submitted message must
      // render on the visitor's side.
      newMessage.sender = "user";

      if (mountedRef.current) {
        setMessages((previous) =>
          mergeMessages(previous, [newMessage])
        );

        setStatus("connected");
      }

      return true;
    } catch (error) {
      console.error(
        "Chat message submission failed:",
        error
      );

      if (mountedRef.current) {
        setSendError(
          `${
            error instanceof Error
              ? error.message
              : "Unable to send message."
          } Check the conversation before retrying.`
        );
      }

      return false;
    } finally {
      sendingRef.current = false;

      if (mountedRef.current) {
        setIsSending(false);

        // Retrieve the authoritative history
        // after completing the send.
        void loadMessages();
      }
    }
  };

  // ----------------------------------------------------------
  // QUICK QUESTION HANDLER
  // ----------------------------------------------------------

  const handleQuickOption = (option) => {
    if (sendingRef.current) return;

    void sendMessage({
      type: "quick_question",
      message: option.message,
      optionId: option.id,
    });
  };

  // ----------------------------------------------------------
  // TEXT MESSAGE HANDLER
  // ----------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (
      !trimmedMessage ||
      sendingRef.current
    ) {
      return;
    }

    const sent = await sendMessage({
      type: "message",
      message: trimmedMessage,
    });

    if (sent && mountedRef.current) {
      setInput("");
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* CHAT WINDOW */}

      {isOpen && (
        <div
          className="whatsapp-chat-window"
          role="dialog"
          aria-label="Website live chat"
        >
          <ChatHeader
            onClose={closeChat}
            status={status}
          />

          {/* MESSAGE HISTORY */}

          <div
            className="whatsapp-chat-body"
            aria-live="polite"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {/* QUICK QUESTIONS */}

            <div className="whatsapp-quick-options">
              {QUICK_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="whatsapp-quick-button"
                  onClick={() =>
                    handleQuickOption(option)
                  }
                  disabled={isSending}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* SENDING INDICATOR */}

            {isSending && (
              <p
                className="px-5 pb-3 text-sm text-gray-500"
                role="status"
              >
                Sending...
              </p>
            )}

            {/* ERROR MESSAGE */}

            {sendError && (
              <p
                className="mx-5 mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {sendError}
              </p>
            )}

            {/* SCROLL TARGET */}

            <div ref={messagesEndRef} />
          </div>

          {/* HANDOFF NOTICE */}

          <div className="whatsapp-handoff">
            Messages and quick questions go to
            our support team.
          </div>

          {/* MESSAGE INPUT */}

          <form
            className="whatsapp-input-area"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Type a message..."
              aria-label="Type a message"
              maxLength={4000}
              disabled={isSending}
            />

            <button
              type="submit"
              className="whatsapp-send-button"
              aria-label="Send message"
              disabled={
                !input.trim() ||
                isSending
              }
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

          {/* FOOTER */}

          <div className="whatsapp-powered">
            Live chat
          </div>
        </div>
      )}

      {/* FLOATING CHAT BUTTON */}

      <button
        type="button"
        className={`whatsapp-floating-button ${
          isOpen
            ? "whatsapp-floating-button-open"
            : ""
        }`}
        onClick={
          isOpen ? closeChat : openChat
        }
        aria-label={
          isOpen
            ? "Close WhatsApp chat"
            : "Open WhatsApp chat"
        }
        aria-expanded={isOpen}
      >
        <span className="whatsapp-icon-wrapper">
          {isOpen ? (
            <span className="whatsapp-x-icon">
              ×
            </span>
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
