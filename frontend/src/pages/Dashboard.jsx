import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DollarSign, MessageSquare, Compass, Award, TrendingUp, BarChart3, PieChart as PieIcon, MapPin, Calendar, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('performance'); // 'performance' or 'demographics'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cData, custData] = await Promise.all([
          api.campaigns.getAll(),
          api.customers.getAll()
        ]);
        setCampaigns(cData);
        setCustomers(custData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="empty-state">Loading advanced insights...</div>;
  if (error) return <div className="empty-state">Error loading dashboard: {error}</div>;

  // Aggregate stats
  const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.stats?.delivered || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
  const totalConverted = campaigns.reduce((sum, c) => sum + (c.stats?.converted || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.stats?.revenue || 0), 0);

  const avgOpenRate = totalSent ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
  const avgConversionRate = totalSent ? ((totalConverted / totalSent) * 100).toFixed(1) : '0.0';

  // 1. Funnel data
  const funnelData = [
    { name: 'Sent', count: totalSent },
    { name: 'Delivered', count: totalDelivered },
    { name: 'Opened', count: totalOpened },
    { name: 'Clicked', count: totalClicked },
    { name: 'Converted', count: totalConverted },
  ];

  // 2. Channel Revenue Attribution data
  const channelRevenue = campaigns.reduce((acc, c) => {
    const ch = c.channel.toUpperCase();
    acc[ch] = (acc[ch] || 0) + (c.stats?.revenue || 0);
    return acc;
  }, { WHATSAPP: 0, EMAIL: 0, SMS: 0, RCS: 0 });

  const channelColors = {
    WHATSAPP: '#22c55e',
    EMAIL: '#3b82f6',
    SMS: '#ec4899',
    RCS: '#8b5cf6'
  };

  const channelPieData = Object.keys(channelRevenue).map(ch => ({
    name: ch,
    value: channelRevenue[ch],
    color: channelColors[ch]
  })).filter(item => item.value > 0);

  // 3. Campaign growth line trend
  const sortedCampaigns = [...campaigns].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let runningRevenue = 0;
  const growthTrendData = sortedCampaigns.map(c => {
    runningRevenue += (c.stats?.revenue || 0);
    return {
      date: new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      revenue: runningRevenue,
      campaign: c.name
    };
  });

  // 4. Geographic spend data (Customers database stats)
  const citySpend = customers.reduce((acc, c) => {
    acc[c.city] = (acc[c.city] || 0) + (c.totalSpend || 0);
    return acc;
  }, {});

  const cityChartData = Object.keys(citySpend).map(city => ({
    name: city,
    value: citySpend[city]
  })).sort((a, b) => b.value - a.value).slice(0, 6);

  // 5. Customer Churn Segment metrics
  const activeShoppers = customers.filter(c => c.orderCount > 0).length;
  const inactiveShoppers = customers.filter(c => c.orderCount === 0).length;
  const churnPieData = [
    { name: 'Active Shoppers', value: activeShoppers, color: '#10b981' },
    { name: 'Inactive/Leads', value: inactiveShoppers, color: '#64748b' }
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Insights Hub</h1>
          <p className="page-subtitle">Real-time performance analytics and shopper segment distribution</p>
        </div>

        {/* Dashboards Navigation Tab Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.35rem' }}>
          <button 
            className={`btn ${activeSubTab === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
            onClick={() => setActiveSubTab('performance')}
          >
            <TrendingUp size={14} />
            Campaign Performance
          </button>
          <button 
            className={`btn ${activeSubTab === 'demographics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
            onClick={() => setActiveSubTab('demographics')}
          >
            <Layers size={14} />
            Shopper Analytics
          </button>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <div className="glass-card empty-state">
          <TrendingUp className="empty-state-icon" size={48} />
          <h3>No Campaign Data Yet</h3>
          <p style={{ marginTop: '0.5rem' }}>Create and launch a campaign to begin gathering performance insights.</p>
        </div>
      ) : (
        <>
          {/* Metrics Overview Grid */}
          <div className="metrics-grid">
            <div className="glass-card metric-card">
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-converted)' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div className="metric-value">${totalRevenue.toLocaleString()}</div>
                <div className="metric-label">Total Revenue Attributed</div>
              </div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-delivered)' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <div className="metric-value">{totalSent.toLocaleString()}</div>
                <div className="metric-label">Total Outbound Sends</div>
              </div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-opened)' }}>
                <Compass size={24} />
              </div>
              <div>
                <div className="metric-value">{avgOpenRate}%</div>
                <div className="metric-label">Average Open Rate</div>
              </div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-clicked)' }}>
                <Award size={24} />
              </div>
              <div>
                <div className="metric-value">{avgConversionRate}%</div>
                <div className="metric-label">Avg Conversion Rate</div>
              </div>
            </div>
          </div>

          {activeSubTab === 'performance' ? (
            /* Sub Dashboard: Performance Analytics */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* 1. Aggregate Funnel */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} className="brand-icon" />
                    Aggregate Conversion Funnel
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={funnelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name="Contacts" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Channel Attribution Pie */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PieIcon size={18} className="brand-icon" />
                    Attribution by Channel
                  </h3>
                  {channelPieData.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', paddingTop: '4rem' }}>
                      No attributed channel revenue recorded yet.
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelPieData}
                            cx="50%"
                            cy="48%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {channelPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                          <Legend verticalAlign="bottom" height={36} formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{val}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Campaign Growth Line Chart */}
              <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} className="brand-icon" />
                  Attributed Revenue Growth Curve
                </h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <LineChart data={growthTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cumulative Revenue ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            /* Sub Dashboard: Shopper Analytics & Demographics */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* 1. Geographic Spending */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} className="brand-icon" />
                    Shopper Spend by City
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={cityChartData}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                        <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                        <Bar dataKey="value" fill="var(--color-opened)" radius={[4, 4, 0, 0]} name="Aggregate Spends ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Customer Inactivity/Leads Breakdown */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} className="brand-icon" />
                    Database Lead Breakdown
                  </h3>
                  <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={churnPieData}
                          cx="50%"
                          cy="48%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {churnPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => `${val} shoppers`} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                        <Legend verticalAlign="bottom" height={36} formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{val}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Active Campaigns Table */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Active Campaign Performance</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Channel</th>
                    <th>Sent</th>
                    <th>Open Rate</th>
                    <th>Click Rate</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((c) => {
                    const cSent = c.stats?.sent || 0;
                    const cOpened = c.stats?.opened || 0;
                    const cClicked = c.stats?.clicked || 0;
                    const cConverted = c.stats?.converted || 0;

                    const openRate = cSent ? ((cOpened / cSent) * 100).toFixed(1) : '0.0';
                    const clickRate = cOpened ? ((cClicked / cOpened) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          <span className={`badge badge-${c.channel}`}>
                            {c.channel}
                          </span>
                        </td>
                        <td>{cSent}</td>
                        <td>{openRate}%</td>
                        <td>{clickRate}%</td>
                        <td>{cConverted}</td>
                        <td style={{ color: 'var(--color-converted)', fontWeight: 600 }}>${(c.stats?.revenue || 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
