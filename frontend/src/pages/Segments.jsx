import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Bot, HelpCircle, Code, Users, Search, ChevronRight } from 'lucide-react';

export default function Segments() {
  const [prompt, setPrompt] = useState('customers in Pune who spent over 4000 but haven\'t ordered in 60 days');
  const [filterStr, setFilterStr] = useState('{\n  "city": "Pune",\n  "totalSpend": { "$gt": 4000 }\n}');
  const [loadingAI, setLoadingAI] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewCustomers, setPreviewCustomers] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [aiNote, setAiNote] = useState('');

  // Run preview whenever filterStr is modified
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      runPreview();
    }, 600); // Debounce to avoid querying too rapidly

    return () => clearTimeout(delayDebounce);
  }, [filterStr]);

  async function runPreview() {
    try {
      setLoadingPreview(true);
      setPreviewError(null);
      
      let parsedFilter = {};
      try {
        parsedFilter = JSON.parse(filterStr);
      } catch (err) {
        throw new Error('Invalid query syntax. Check your MongoDB JSON format.');
      }

      const res = await api.segments.preview(parsedFilter);
      setPreviewCount(res.count);
      setPreviewCustomers(res.customers || []);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleAISuggest() {
    if (!prompt.trim()) return;
    try {
      setLoadingAI(true);
      setAiNote('');
      const res = await api.segments.aiSuggest(prompt);
      setFilterStr(JSON.stringify(res.filter, null, 2));
      if (res.isFallback) {
        setAiNote(res.message || 'Utilizing local parser fallback (No Gemini key found).');
      } else {
        setAiNote('Query translated by Gemini AI successfully!');
      }
    } catch (err) {
      alert(`AI call failed: ${err.message}`);
    } finally {
      setLoadingAI(false);
    }
  }

  function loadTemplateRule(type) {
    let rule = {};
    const now = new Date();
    switch (type) {
      case 'high-spenders':
        rule = { totalSpend: { $gte: 2000 } };
        break;
      case 'inactive':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        rule = { lastPurchaseDate: { $lt: ninetyDaysAgo, $ne: null } };
        break;
      case 'mumbai-shoppers':
        rule = { city: 'Mumbai' };
        break;
      default:
        rule = {};
    }
    setFilterStr(JSON.stringify(rule, null, 2));
    setAiNote(`Loaded template segment rules.`);
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Segments Workspace</h1>
          <p className="page-subtitle">Carve out target audiences using AI natural language or custom rules</p>
        </div>
      </header>

      <div className="query-workspace">
        {/* Left Side: Builder and Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* AI Segmenter */}
          <div className="glass-card ai-copilot-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Bot className="brand-icon" size={22} />
              AI Audience Copilot
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Describe who you want to target in natural language, and Gemini will map it to a DB query filter.
            </p>
            <textarea
              className="ai-textarea"
              placeholder="e.g. High spending customers in Pune who have placed at least 3 orders..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={handleAISuggest}
                disabled={loadingAI}
              >
                {loadingAI ? 'Analyzing...' : 'Generate Segment Rules'}
              </button>
              {aiNote && (
                <span style={{ fontSize: '0.8rem', color: aiNote.includes('fallback') ? 'var(--color-clicked)' : 'var(--color-converted)' }}>
                  {aiNote}
                </span>
              )}
            </div>
          </div>

          {/* Code Editor Rules */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={20} className="brand-icon" />
                MongoDB JSON Rules
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => loadTemplateRule('high-spenders')}>High Spenders</button>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => loadTemplateRule('inactive')}>Inactive</button>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => loadTemplateRule('mumbai-shoppers')}>Mumbai</button>
              </div>
            </div>
            <textarea
              style={{
                width: '100%',
                height: '140px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#6ee7b7', // coding green
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.85rem',
                resize: 'vertical',
                outline: 'none'
              }}
              value={filterStr}
              onChange={(e) => setFilterStr(e.target.value)}
            />
            {previewError && (
              <div style={{ color: 'var(--color-failed)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {previewError}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live preview count and lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Target Audience Size */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="metric-icon-wrapper" style={{ width: 56, height: 56, borderRadius: '50%', color: 'var(--primary)', borderStyle: 'dashed' }}>
              <Users size={28} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {loadingPreview ? '...' : previewCount}
              </div>
              <div className="metric-label">Matching Contacts Found</div>
            </div>
          </div>

          {/* List Preview */}
          <div className="glass-card" style={{ maxHeight: '430px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Matched Shoppers Preview</h3>
            {loadingPreview && previewCustomers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading matched shoppers...</div>
            ) : previewCustomers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                No customers match this segment filter rules.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {previewCustomers.map((cust) => (
                  <div 
                    key={cust._id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{cust.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cust.city}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-converted)', fontWeight: 600 }}>${cust.totalSpend}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cust.orderCount} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
