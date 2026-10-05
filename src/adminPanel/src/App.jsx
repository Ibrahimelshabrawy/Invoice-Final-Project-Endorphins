import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import ClientsPage from './pages/ClientsPage';
import ServicesPage from './pages/ServicesPage';
import BundlesPage from './pages/BundlesPage';
import CategoriesPage from './pages/CategoriesPage';
import TaxesPage from './pages/TaxesPage';

import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

import InvoiceFormModal from './components/invoices/InvoiceFormModal';
import InvoicePreviewAndSendModal from './components/invoices/InvoicePreviewAndSendModal';
import InvoiceEmailLogsModal from './components/invoices/InvoiceEmailLogsModal';
import InvoiceStatusModal from './components/invoices/InvoiceStatusModal';

import { invoiceApi, clientApi, serviceApi, bundleApi, categoryApi, taxApi } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Counts for sidebar badges
  const [counts, setCounts] = useState({
    invoices: null,
    clients: null,
    services: null,
    bundles: null,
    categories: null,
    taxes: null,
  });

  // Global Invoice Modals State
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  const [previewModalInvoice, setPreviewModalInvoice] = useState(null);
  const [emailLogsModalInvoice, setEmailLogsModalInvoice] = useState(null);
  const [statusModalInvoice, setStatusModalInvoice] = useState(null);

  // Auto-refresh key to sync child views immediately on mutation
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh counts when tabs change or actions finish
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [invRes, clients, services, bundles, categories, taxes] = await Promise.all([
        invoiceApi.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
        clientApi.getAll().catch(() => []),
        serviceApi.getAll().catch(() => []),
        bundleApi.getAll().catch(() => []),
        categoryApi.getAll().catch(() => []),
        taxApi.getAll().catch(() => []),
      ]);

      setCounts({
        invoices: invRes?.pagination?.total ?? 0,
        clients: (clients || []).length,
        services: (services || []).length,
        bundles: (bundles || []).length,
        categories: (categories || []).length,
        taxes: (taxes || []).length,
      });
    } catch (e) {
      // Ignore background counts error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
    }
  }, [isAuthenticated, fetchCounts, activeTab]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    fetchCounts();
  }, [fetchCounts]);

  // Invoice Action Handlers
  const handleOpenCreateInvoice = () => {
    setInvoiceToEdit(null);
    setIsInvoiceFormOpen(true);
  };

  const handleOpenEditInvoice = (inv) => {
    setInvoiceToEdit(inv);
    setIsInvoiceFormOpen(true);
  };

  const handleOpenPreviewAndSend = (inv) => {
    setPreviewModalInvoice(inv);
  };

  const handleOpenEmailLogs = (inv) => {
    setEmailLogsModalInvoice(inv);
  };

  const handleOpenStatusUpdate = (inv) => {
    setStatusModalInvoice(inv);
  };

  // Loading Screen while verifying JWT session
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)',
          gap: '16px',
        }}
      >
        <Loader2 size={36} className="animate-spin" color="var(--text-secondary)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Connecting to Endorphins Admin Services...
        </span>
      </div>
    );
  }

  // Not logged in -> Render login screen
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        counts={counts}
      />

      {/* Main Viewport */}
      <div className="main-layout">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobile={() => setMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onOpenCreateInvoice={handleOpenCreateInvoice}
              onPreviewInvoice={handleOpenPreviewAndSend}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesPage
              onOpenCreate={handleOpenCreateInvoice}
              onOpenEdit={handleOpenEditInvoice}
              onOpenPreviewAndSend={handleOpenPreviewAndSend}
              onOpenEmailLogs={handleOpenEmailLogs}
              onOpenStatusUpdate={handleOpenStatusUpdate}
              refreshKey={refreshKey}
              onActionSuccess={triggerRefresh}
            />
          )}

          {activeTab === 'clients' && <ClientsPage onCountsChanged={fetchCounts} />}

          {activeTab === 'services' && <ServicesPage onCountsChanged={fetchCounts} />}

          {activeTab === 'bundles' && <BundlesPage onCountsChanged={fetchCounts} />}

          {activeTab === 'categories' && <CategoriesPage onCountsChanged={fetchCounts} />}

          {activeTab === 'taxes' && <TaxesPage onCountsChanged={fetchCounts} />}
        </main>
      </div>

      {/* Invoice Create / Edit Modal */}
      <InvoiceFormModal
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        invoiceToEdit={invoiceToEdit}
        onSaved={triggerRefresh}
      />

      {/* Invoice Preview & Send PDF Modal */}
      <InvoicePreviewAndSendModal
        isOpen={Boolean(previewModalInvoice)}
        onClose={() => setPreviewModalInvoice(null)}
        invoice={previewModalInvoice}
        onSentSuccess={triggerRefresh}
      />

      {/* Invoice Email Logs Modal */}
      <InvoiceEmailLogsModal
        isOpen={Boolean(emailLogsModalInvoice)}
        onClose={() => setEmailLogsModalInvoice(null)}
        invoice={emailLogsModalInvoice}
      />

      {/* Invoice Status Update Modal */}
      <InvoiceStatusModal
        isOpen={Boolean(statusModalInvoice)}
        onClose={() => setStatusModalInvoice(null)}
        invoice={statusModalInvoice}
        onUpdated={triggerRefresh}
      />
    </div>
  );
}
