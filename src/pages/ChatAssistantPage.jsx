import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Clock,
  Sparkles,
  PhoneCall,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { feedbackApi } from '../api';
import './ChatAssistantPage.css';

const ChatAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your MedQ Clinical Equipment Specialist. How can I assist you with clinical equipment specifications, warranties, or delivery schedules today?',
      options: ['Warranty Info', 'Shipping & Delivery', 'Diagnostic Products', 'Order Status'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await feedbackApi.queryChat(query);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: res.reply,
            options: res.options || [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setTyping(false);
      }, 700);
    } catch (err) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'I am temporarily unable to reach the knowledge base. Please contact our 24/7 hotline at +1 (800) 555-MEDQ for immediate assistance.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setTyping(false);
      }, 500);
    }
  };

  return (
    <div className="chat-page py-4">
      <div className="med-container max-w-850">
        <div className="chat-card med-card">
          {/* Header */}
          <div className="chat-card-header">
            <div className="bot-status-wrap">
              <div className="bot-avatar">
                <Bot size={24} />
              </div>
              <div>
                <h2>MedQ Clinical Support Assistant</h2>
                <div className="status-indicator-row">
                  <span className="online-green-dot" />
                  <span className="status-text">Biomedical Engineer Online • Ready to help</span>
                </div>
              </div>
            </div>

            <div className="hotline-badge">
              <PhoneCall size={14} /> 24/7 Hotline: <strong>+1 (800) 555-MEDQ</strong>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble-row ${msg.sender}`}>
                <div className="sender-avatar-circle">
                  {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className="message-content-wrapper">
                  <div className="bubble-text">{msg.text}</div>

                  {/* Suggestion Chips */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="suggestion-chips-grid mt-2">
                      {msg.options.map((opt, i) => (
                        <button key={i} className="chip-option-btn" onClick={() => handleSend(opt)}>
                          <Sparkles size={13} /> {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="message-timestamp">
                    <Clock size={11} /> {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {typing && (
              <div className="message-bubble-row bot">
                <div className="sender-avatar-circle">
                  <Bot size={16} />
                </div>
                <div className="typing-indicator-bubble">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="chat-card-footer">
            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                placeholder="Ask about medical specifications, warranty coverage, delivery..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="chat-field"
              />
              <button type="submit" className="btn btn-primary send-chat-btn" disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </form>
            <p className="chat-disclaimer">
              <ShieldAlert size={13} /> MedQ Virtual Specialist provides guidance on certified equipment.
              For clinical emergencies, contact local emergency healthcare authorities immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistantPage;
