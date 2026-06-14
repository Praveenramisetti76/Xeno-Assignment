import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Toggle theme mode and update body class list
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  function handleSelectCampaign(id) {
    setSelectedCampaignId(id);
    setActiveTab('campaign-detail');
  }

  function handleCloseCampaignDetail() {
    setSelectedCampaignId(null);
    setActiveTab('campaigns');
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'segments' && <Segments />}
        {activeTab === 'campaigns' && (
          <Campaigns onSelectCampaign={handleSelectCampaign} />
        )}
        {activeTab === 'campaign-detail' && (
          <CampaignDetail 
            campaignId={selectedCampaignId} 
            onClose={handleCloseCampaignDetail} 
          />
        )}
      </main>
    </div>
  );
}
