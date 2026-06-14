import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Search, Database, ShoppingBag, Calendar, MapPin, X, User } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await api.customers.getAll();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    try {
      setSeeding(true);
      const res = await api.customers.seed();
      alert(res.message);
      await loadCustomers();
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  async function handleViewDetails(customer) {
    setSelectedCustomer(customer);
    try {
      setLoadingOrders(true);
      setOrders([]);
      const data = await api.customers.getDetail(customer._id);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err.message);
    } finally {
      setLoadingOrders(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Shoppers Directory</h1>
          <p className="page-subtitle">Manage customer profiles and transaction histories</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSeed}
          disabled={seeding || loading}
        >
          <Database size={16} />
          {seeding ? 'Generating Data...' : 'Seed Database'}
        </button>
      </header>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search shoppers by name, email, or city..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem'
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">Loading shoppers list...</div>
      ) : error ? (
        <div className="empty-state">Error: {error}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-card empty-state">
          <User className="empty-state-icon" size={48} />
          <h3>No Shoppers Found</h3>
          <p style={{ marginTop: '0.5rem' }}>Try seeding the database or clearing your search query.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0.5rem 0' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Total Spend</th>
                  <th>Orders Count</th>
                  <th>Last Purchase</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.phone}</div>
                    </td>
                    <td>{c.city}</td>
                    <td style={{ color: 'var(--color-converted)', fontWeight: 600 }}>${(c.totalSpend || 0).toLocaleString()}</td>
                    <td>{c.orderCount || 0}</td>
                    <td>
                      {c.lastPurchaseDate 
                        ? new Date(c.lastPurchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : <span style={{ color: 'var(--text-muted)' }}>Never</span>
                      }
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleViewDetails(c)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Profile Side Drawer */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '450px',
          height: '100vh',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 100,
          padding: '2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{selectedCustomer.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <MapPin size={14} />
                <span>{selectedCustomer.city}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCustomer(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1rem', background: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Spend</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-converted)', marginTop: '0.25rem' }}>
                ${(selectedCustomer.totalSpend || 0).toLocaleString()}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1rem', background: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Orders</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {selectedCustomer.orderCount || 0}
              </div>
            </div>
          </div>

          {/* Details */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Contact Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', width: '60px', display: 'inline-block' }}>Email:</span>
                <span>{selectedCustomer.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', width: '60px', display: 'inline-block' }}>Phone:</span>
                <span>{selectedCustomer.phone}</span>
              </div>
            </div>
          </div>

          {/* Orders list */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Order History</h4>
            {loadingOrders ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading transactions...</div>
            ) : orders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                <ShoppingBag size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <span>No order records found</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((o) => (
                  <div key={o._id} className="glass-card" style={{ padding: '1rem', background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-converted)', fontWeight: 600 }}>${o.amount}</span>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {new Date(o.orderDate).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {o.items.map((it, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
