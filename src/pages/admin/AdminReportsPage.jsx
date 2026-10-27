import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Calendar,
  RefreshCw,
  ExternalLink,
  Eye,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { feedbackApi } from '../../api';

const AdminReportsPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.getAllMessages();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setMessages(list);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading">Client Inquiries & Support</h1>
          <p className="text-secondary text-sm">
            Read medical equipment RFQs, technical support requests, and hospital partnership queries.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadMessages} title="Refresh Inquiries">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search messages by sender, subject, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-sm text-secondary">
          <strong>{filteredMessages.length}</strong> inquiries logged
        </div>
      </div>

      {/* Messages Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Loading inquiries...</div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <Inbox size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h4>No customer inquiries found</h4>
            <p className="text-sm">Inquiries submitted via the Contact & Help page will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message Excerpt</th>
                  <th>Received</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => {
                  const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleString() : 'N/A';
                  return (
                    <tr key={msg.id}>
                      <td>
                        <div className="fw-semibold text-slate-900">{msg.name || 'Anonymous Visitor'}</div>
                        <div className="text-xs text-secondary d-flex align-items-center gap-1">
                          <Mail size={12} /> {msg.email || 'No email provided'}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-primary-700">{msg.subject || '(No subject)'}</div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div className="text-sm text-slate-600 text-truncate">
                          {msg.message}
                        </div>
                      </td>
                      <td className="text-xs text-secondary">
                        {dateStr}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            onClick={() => setSelectedMessage(msg)}
                            title="View Full Message"
                          >
                            <Eye size={14} />
                          </button>
                          {msg.email && (
                            <a
                              href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'MEDQ Equipment Inquiry')}`}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.35rem 0.6rem' }}
                              title="Direct Email Reply"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Inspection Modal */}
      {selectedMessage && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '580px' }}>
            <div className="admin-modal-header">
              <h3 className="h4 font-heading mb-0">Inquiry Details</h3>
              <button className="modal-close-x" onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="mb-3" style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-secondary text-uppercase fw-bold mb-1">From</div>
                <div className="fw-semibold text-slate-900">{selectedMessage.name || 'Anonymous'}</div>
                <div className="text-sm text-secondary">{selectedMessage.email || 'No email'}</div>
                <div className="text-xs text-muted mt-1">
                  Received: {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : 'N/A'}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-secondary text-uppercase fw-bold mb-1">Subject</div>
                <h5 className="font-heading text-slate-900">{selectedMessage.subject}</h5>
              </div>

              <div>
                <div className="text-xs text-secondary text-uppercase fw-bold mb-1">Full Message Content</div>
                <div className="p-3 bg-white border rounded text-slate-800" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMessage(null)}>
                Close
              </button>
              {selectedMessage.email && (
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'MEDQ Inquiry')}`}
                  className="btn btn-primary"
                >
                  <Mail size={16} className="me-1" /> Reply via Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
