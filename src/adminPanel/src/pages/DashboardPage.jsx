import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Users,
  Plus,
  ArrowUpRight,
  Send,
  Loader2,
  Briefcase,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import { invoiceApi, clientApi, serviceApi, bundleApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function DashboardPage({
  onNavigate,
  onOpenCreateInvoice,
  onPreviewInvoice,
  refreshKey = 0,
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [bundlesCount, setBundlesCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [invRes, clientsData, servicesData, bundlesData] = await Promise.all([
        invoiceApi.getAll({ limit: 100 }),
        clientApi.getAll(),
        serviceApi.getAll(),
        bundleApi.getAll(),
      ]);

      setInvoices(invRes.items || []);
      setClientsCount((clientsData || []).length);
      setServicesCount((servicesData || []).length);
      setBundlesCount((bundlesData || []).length);
    } catch (err) {
      toast.error('Failed to load dashboard metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const recentInvoices = invoices.slice(0, 8);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <Loader2 size={36} className="animate-spin" color="var(--brand-primary)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading Endorphins financial dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Quick Actions Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--text-muted)' }}>
            Endorphins Art Labs
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            Invoicing & Revenue Overview
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Monitor real-time cash flow, draft proposals, overdue receivables, and client accounts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('clients')}
          >
            <Users size={14} />
            <span>Manage Clients</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('services')}
          >
            <Briefcase size={14} />
            <span>Services</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenCreateInvoice}
          >
            <Plus size={15} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Invoices</h3>
            <p className="card-subtitle">Latest invoicing activity and execution states</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate('invoices')}
          >
            <span>View All Invoices</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice to start billing your clients."
            actionLabel="Create Invoice"
            onAction={onOpenCreateInvoice}
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {inv.client?.name || `Client #${inv.clientId}`}
                        </span>
                        {inv.client?.company && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {inv.client.company}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{inv.issueDate}</td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {Number(inv.total).toFixed(2)} {inv.currency || 'EGP'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onPreviewInvoice(inv)}
                          title="Preview PDF and email to client"
                        >
                          <Send size={13} />
                          <span>PDF & Send</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
