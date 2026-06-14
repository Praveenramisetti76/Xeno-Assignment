import React from 'react';
import { LayoutDashboard, Users, Filter, Megaphone, Coffee, Sun, Moon } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, theme, toggleTheme }) {
  const links = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', name: 'Shoppers', icon: Users },
    { id: 'segments', name: 'Segments', icon: Filter },
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-container">
        <Coffee className="brand-icon" size={28} />
        <span className="brand-name">Aroma CRM</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="nav-links">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id || (link.id === 'campaigns' && activeTab === 'campaign-detail');
            return (
              <li key={link.id}>
                <a
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(link.id)}
                >
                  <Icon className="nav-icon" />
                  <span>{link.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle Switch Container */}
      <div className="theme-toggle-container">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch theme mode">
          {theme === 'dark' ? <Sun size={16} style={{ color: '#fbbf24' }} /> : <Moon size={16} style={{ color: '#3b82f6' }} />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
      </div>

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-converted)', boxShadow: '0 0 8px var(--color-converted)' }}></div>
          <span>Systems Connected</span>
        </div>
      </div>
    </aside>
  );
}
