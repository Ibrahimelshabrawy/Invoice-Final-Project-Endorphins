import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({
  activeTab,
  onOpenMobile,
}) {
  const titles = {
    dashboard: { title: 'Dashboard', breadcrumb: 'Admin / Overview' },
    invoices: { title: 'Invoices', breadcrumb: 'Admin / Invoices' },
    clients: { title: 'Clients', breadcrumb: 'Admin / Clients' },
    services: { title: 'Services', breadcrumb: 'Admin / Services' },
    bundles: { title: 'Bundles', breadcrumb: 'Admin / Bundles' },
    categories: { title: 'Categories', breadcrumb: 'Admin / Categories' },
    taxes: { title: 'Taxes', breadcrumb: 'Admin / Taxes' },
  };

  const current = titles[activeTab] || { title: 'Admin Panel', breadcrumb: 'Admin' };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-toggle"
          onClick={onOpenMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="page-title-wrap">
          <span className="page-breadcrumb">{current.breadcrumb}</span>
          <h1 className="page-title">{current.title}</h1>
        </div>
      </div>
    </header>
  );
}
