import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, MessageCircle } from "lucide-react";
import {
  INITIAL_MESSAGE,
  QUICK_ACTIONS,
  TOPIC_RESPONSES,
  getBotResponse,
} from "./chatBotKnowledge";
import "./ChatBot.css";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: INITIAL_MESSAGE,
      time: getCurrentTime(),
      showQuickActions: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Scroll automático hacia el final al haber nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now() + "-user",
      sender: "user",
      text,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");

    // Respuesta del asistente con ligera pausa para naturalidad
    setTimeout(() => {
      const responseText = getBotResponse(text);
      const botMsg = {
        id: Date.now() + "-bot",
        sender: "bot",
        text: responseText,
        time: getCurrentTime(),
        showQuickActions: true,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  const handleQuickAction = (actionId) => {
    const selectedAction = QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!selectedAction) return;

    const userMsg = {
      id: Date.now() + "-user",
      sender: "user",
      text: selectedAction.label,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const responseText =
        TOPIC_RESPONSES[actionId] || TOPIC_RESPONSES.fallback;
      const botMsg = {
        id: Date.now() + "-bot",
        sender: "bot",
        text: responseText,
        time: getCurrentTime(),
        showQuickActions: true,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="aromabot-container">
      {/* Botón flotante para abrir o cerrar */}
      {!isOpen && (
        <button
          type="button"
          className="aromabot-floating-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asesor AromaBot"
        >
          <div className="aromabot-btn-icon-wrapper">
            <Sparkles size={18} />
            <span className="aromabot-badge-pulse" />
          </div>
          <span className="aromabot-btn-label">AromaBot</span>
        </button>
      )}

      {/* Ventana de chat interactiva */}
      {isOpen && (
        <div className="aromabot-window" role="dialog" aria-label="Chat con AromaBot">
          {/* Cabecera */}
          <div className="aromabot-header">
            <div className="aromabot-header-left">
              <div className="aromabot-avatar" aria-hidden="true">
                <Sparkles size={20} />
              </div>
              <div className="aromabot-header-meta">
                <h3>AromaBot</h3>
                <div className="aromabot-status-row">
                  <span className="aromabot-status-dot" />
                  <span>Asesor disponible</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="aromabot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="aromabot-messages">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`aromabot-message-wrapper ${msg.sender}`}
              >
                <div className="aromabot-message-bubble">
                  {msg.text.split("\n\n").map((paragraph, pIdx) => (
                    <p key={pIdx} style={{ margin: pIdx > 0 ? "8px 0 0 0" : 0 }}>
                      {paragraph.split("\n").map((line, lIdx) => (
                        <span key={lIdx}>
                          {line.startsWith("• ") || line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") ? (
                            <span style={{ display: "block", marginTop: "3px" }}>
                              {renderFormattedText(line)}
                            </span>
                          ) : (
                            renderFormattedText(line)
                          )}
                          {lIdx < line.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
                <span className="aromabot-message-time">{msg.time}</span>

                {/* Accesos rápidos sólo bajo el último mensaje del bot */}
                {msg.sender === "bot" &&
                  index === messages.length - 1 && (
                    <div className="aromabot-quick-actions">
                      <span className="aromabot-quick-title">
                        Consultas frecuentes
                      </span>
                      <div className="aromabot-quick-buttons-grid">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            className="aromabot-quick-btn"
                            onClick={() => handleQuickAction(action.id)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <div className="aromabot-input-area">
            <form onSubmit={handleSubmit} className="aromabot-form">
              <input
                ref={inputRef}
                type="text"
                className="aromabot-input"
                placeholder="Escribe tu consulta olfativa..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                aria-label="Mensaje para AromaBot"
              />
              <button
                type="submit"
                className="aromabot-send-btn"
                disabled={!inputMessage.trim()}
                aria-label="Enviar mensaje"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Pequeño formateador para textos con **negritas**
function renderFormattedText(text) {
  if (!text.includes("**")) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

