import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, Megaphone, Bot, ArrowRight, HelpCircle, RefreshCw } from 'lucide-react';

export default function Campaigns({ onSelectCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Wizard State
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [name, setName] = useState('');
  const [segmentName, setSegmentName] = useState('High Spenders (> $1000)');
  const [segmentFilter, setSegmentFilter] = useState('{\n  "totalSpend": { "$gt": 1000 }\n}');
  const [channel, setChannel] = useState('whatsapp');
  const [messageTemplate, setMessageTemplate] = useState('Hey {{name}}! ☕ Treat yourself to the finest dark roast beans today and get 15% off. Use code FRESH15!');
  
  // AI copywriting states
  const [aiPrompt, setAiPrompt] = useState('Offer a 15% discount code FRESH15 on dark roast coffee beans');
  const [loadingAI, setLoadingAI] = useState(false);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const data = await api.campaigns.getAll();
      setCampaigns(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e) {
    e.preventDefault();
    if (!name.trim()) return alert('Campaign name is required');
    
    let parsedFilter;
    try {
      parsedFilter = JSON.parse(segmentFilter);
    } catch (err) {
      return alert('Invalid MongoDB JSON segment rules. Check syntax.');
    }

    try {
      const payload = {
        name,
        segmentName,
        segmentFilter: parsedFilter,
        channel,
        messageTemplate
      };

      await api.campaigns.create(payload);
      setView('list');
      // Reset form fields
      setName('');
      setSegmentFilter('{\n  "totalSpend": { "$gt": 1000 }\n}');
      setDrafts([]);
      loadCampaigns();
    } catch (err) {
      alert(`Failed to create campaign: ${err.message}`);
    }
  }

  async function handleGenerateCopy() {
    if (!aiPrompt.trim()) return;
    try {
      setLoadingAI(true);
      setDrafts([]);
      const res = await api.campaigns.draftMessage(aiPrompt, channel);
      setDrafts(res.drafts || []);
    } catch (err) {
      alert(`AI copywriting failed: ${err.message}`);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div>
      {view === 'list' ? (
        <>
          <header className="page-header">
            <div>
              <h1 className="page-title">Marketing Campaigns</h1>
              <p className="page-subtitle">Draft, launch, and monitor customer engagement campaigns</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={loadCampaigns} disabled={loading}>
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-primary" onClick={() => setView('create')}>
                <Plus size={16} />
                Create Campaign
              </button>
            </div>
          </header>

          {loading ? (
            <div className="empty-state">Loading campaigns...</div>
          ) : error ? (
            <div className="empty-state">Error: {error}</div>
          ) : campaigns.length === 0 ? (
            <div className="glass-card empty-state">
              <Megaphone className="empty-state-icon" size={48} />
              <h3>No Campaigns Created</h3>
              <p style={{ marginTop: '0.5rem' }}>Get started by setting up your first customer message campaign.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setView('create')}>
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '0.5rem 0' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>Target Audience</th>
                      <th>Channel</th>
                      <th>Sent</th>
                      <th>Conversions</th>
                      <th>Revenue</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const conversions = c.stats?.converted || 0;
                      return (
                        <tr key={c._id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{c.segmentName}</td>
                          <td>
                            <span className={`badge badge-${c.channel}`}>
                              {c.channel}
                            </span>
                          </td>
                          <td>{c.stats?.sent || 0}</td>
                          <td>{conversions}</td>
                          <td style={{ color: 'var(--color-converted)', fontWeight: 600 }}>${(c.stats?.revenue || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge badge-${c.status}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => onSelectCampaign(c._id)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Create Wizard View */
        <>
          <header className="page-header">
            <div>
              <h1 className="page-title">New Campaign Copilot</h1>
              <p className="page-subtitle">Configure parameters and request AI marketing copy assistance</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setView('list')}>
              Cancel
            </button>
          </header>

          <form onSubmit={handleCreateCampaign} className="wizard-container">
            {/* Left Column: Settings */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Campaign Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pune Monsoon Roast Promo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Segment Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select 
                    className="form-select"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="rcs">RCS</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Segment Selection Filter (MongoDB JSON)</label>
                <textarea
                  className="form-input"
                  style={{ height: '90px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Personalized Message Template</label>
                <textarea
                  className="form-input"
                  style={{ height: '120px', fontSize: '0.9rem' }}
                  placeholder="e.g. Hello {{name}}!"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                  Available placeholder tokens: <strong>{`{{name}}`}</strong>, <strong>{`{{city}}`}</strong>, <strong>{`{{totalSpend}}`}</strong>
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
                Save Campaign Draft
              </button>
            </div>

            {/* Right Column: AI Copilot */}
            <div className="glass-card ai-copilot-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Bot className="brand-icon" size={22} />
                AI Copywriting Assistant
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Describe your promotion goals below and click to draft. Click on any AI generated option to load it directly into the template editor.
              </p>

              <div className="form-group">
                <label className="form-label">Promotion Details</label>
                <textarea
                  className="ai-textarea"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleGenerateCopy}
                disabled={loadingAI}
              >
                {loadingAI ? 'Drafting copy...' : 'Draft Message Options'}
              </button>

              {drafts.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Select a draft option to import:</h4>
                  <div className="copy-drafts-container">
                    {drafts.map((d, idx) => (
                      <div 
                        key={idx} 
                        className="copy-draft-card"
                        onClick={() => setMessageTemplate(d)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span>Option {idx + 1}</span>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Click to Use</span>
                        </div>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
