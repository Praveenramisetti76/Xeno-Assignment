import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Send, CheckCircle2, AlertCircle, ShoppingCart, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function CampaignDetail({ campaignId, onClose }) {
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [campaignId]);

  // Polling loop to simulate real-time stream when campaign is running
  useEffect(() => {
    if (!campaign || campaign.status !== 'sending') {
      // Also poll every 3 seconds for completed campaigns if they were recently launched, just to catch up on late conversions
      if (campaign && campaign.status === 'completed') {
        const interval = setInterval(() => {
          loadDetails(true); // silent update
        }, 3000);
        return () => clearInterval(interval);
      }
      return;
    }

    const interval = setInterval(() => {
      loadDetails(true); // silent update
    }, 1500);

    return () => clearInterval(interval);
  }, [campaign]);

  async function loadDetails(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await api.campaigns.getDetail(campaignId);
      setCampaign(res.campaign);
      setLogs(res.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleLaunch() {
    try {
      setLaunching(true);
      await api.campaigns.send(campaignId);
      loadDetails();
    } catch (err) {
      alert(`Launch failed: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  }

  if (loading) return <div className="empty-state">Loading campaign details...</div>;
  if (error) return <div className="empty-state">Error: {error}</div>;
  if (!campaign) return <div className="empty-state">Campaign not found</div>;

  const stats = campaign.stats || {};
  const cSent = stats.sent || 0;
  const cDelivered = stats.delivered || 0;
  const cOpened = stats.opened || 0;
  const cClicked = stats.clicked || 0;
  const cConverted = stats.converted || 0;
  const cRevenue = stats.revenue || 0;

  const openRate = cSent ? ((cOpened / cSent) * 100).toFixed(1) : '0.0';
  const clickRate = cOpened ? ((cClicked / cOpened) * 100).toFixed(1) : '0.0';
  const convRate = cSent ? ((cConverted / cSent) * 100).toFixed(1) : '0.0';

  // Format data for the funnel chart
  const funnelData = [
    { name: 'Sent', count: cSent, fill: 'var(--color-sent)' },
    { name: 'Delivered', count: cDelivered, fill: 'var(--color-delivered)' },
    { name: 'Opened', count: cOpened, fill: 'var(--color-opened)' },
    { name: 'Clicked', count: cClicked, fill: 'var(--color-clicked)' },
    { name: 'Converted', count: cConverted, fill: 'var(--color-converted)' },
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
            &larr; Back to Campaigns
          </button>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="page-subtitle">Channel: <span className="badge badge-email">{campaign.channel}</span> | Audience: {campaign.segmentName}</p>
        </div>

        <div>
          {campaign.status === 'draft' ? (
            <button 
              className="btn btn-primary" 
              onClick={handleLaunch}
              disabled={launching}
            >
              <Send size={16} />
              {launching ? 'Launching...' : 'Launch Campaign'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge badge-${campaign.status}`}>
                {campaign.status}
              </span>
              <button className="btn btn-secondary" onClick={() => loadDetails()} style={{ padding: '0.5rem' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="live-analytics-grid">
        {/* Left column: metrics + charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Metrics row */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revenue Generated</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-converted)', marginTop: '0.25rem' }}>
                ${cRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {cConverted} conversion orders
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Conversion Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-clicked)', marginTop: '0.25rem' }}>
                {convRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Overall funnel efficacy
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Delivery / Open</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {openRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {cDelivered} delivered / {cOpened} read
              </div>
            </div>
          </div>

          {/* Funnel chart */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={20} className="brand-icon" />
              Delivery & Conversion Funnel
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Audience Size" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Message template view */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Message Template Sent</h3>
            <div 
              style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {campaign.messageTemplate}
            </div>
          </div>
        </div>

        {/* Right column: live dispatch logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Live Delivery Logs</span>
              {campaign.status === 'sending' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', animation: 'pulse-glow 1.2s infinite', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                  Streaming...
                </span>
              )}
            </h3>

            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '4rem 0', flex: 1 }}>
                {campaign.status === 'draft' 
                  ? 'Launch the campaign to generate delivery receipts.' 
                  : 'Starting simulation logs...'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '430px' }}>
                {logs.map((log) => (
                  <div 
                    key={log._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {log.customerName}
                        {log.status === 'converted' && (
                          <ShoppingCart size={14} style={{ color: 'var(--color-converted)' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {log.customerPhone || log.customerEmail}
                      </div>
                    </div>
                    <div>
                      <span className={`badge badge-${log.status}`}>
                        {log.status}
                      </span>
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
