import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Briefcase,
  Layers,
  FolderTree,
  Percent,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  counts = {},
}) {
  const { admin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: Receipt, count: counts.invoices },
    { id: 'clients', label: 'Clients', icon: Users, count: counts.clients },
    { id: 'services', label: 'Services', icon: Briefcase, count: counts.services },
    { id: 'bundles', label: 'Bundles', icon: Layers, count: counts.bundles },
    { id: 'categories', label: 'Categories', icon: FolderTree, count: counts.categories },
    { id: 'taxes', label: 'Taxes', icon: Percent, count: counts.taxes },
  ];

  const handleItemClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          role="presentation"
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <img
              src="/logo.jpg"
              alt="Endorphins Logo"
              className="brand-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="brand-text">
              <span className="brand-name">endorphins</span>
              <span className="brand-tag">Art Labs</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Operations</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count !== null && (
                  <span className="nav-count">{item.count}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile-pill">
            <div className="admin-avatar">
              <Sparkles size={14} />
            </div>
            <div className="admin-info">
              <span className="admin-role">{admin?.role || 'Admin'}</span>
              <span className="admin-status">
                <span className="status-dot"></span>
                <span>Active Session</span>
              </span>
            </div>
            <button
              type="button"
              className="logout-btn"
              onClick={logout}
              title="Log out of Endorphins Admin"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
