import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Send,
  Download,
  Trash2,
  XCircle,
  FileEdit,
  History,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { invoiceApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function InvoicesPage({
  onOpenCreate,
  onOpenEdit,
  onOpenPreviewAndSend,
  onOpenEmailLogs,
  onOpenStatusUpdate,
  refreshKey = 0,
  onActionSuccess,
}) {
  const { toast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog states for cancel & delete
  const [cancelModalInvoice, setCancelModalInvoice] = useState(null);
  const [deleteModalInvoice, setDeleteModalInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await invoiceApi.getAll(params);
      setInvoices(res.items || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchInvoices(1);
  }, [statusFilter, startDate, endDate, refreshKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  const handleDownloadPdf = async (inv) => {
    try {
      toast.info(`Preparing PDF download for Invoice #${inv.invoiceNumber}...`);
      const { blob } = await invoiceApi.downloadPdf(inv.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${inv.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Invoice PDF downloaded.');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalInvoice) return;
    setActionLoading(true);
    try {
      await invoiceApi.cancel(cancelModalInvoice.id);
      toast.success(`Invoice #${cancelModalInvoice.invoiceNumber} has been cancelled.`);
      setCancelModalInvoice(null);
      fetchInvoices(pagination.page);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalInvoice) return;
    setActionLoading(true);
    try {
      await invoiceApi.delete(deleteModalInvoice.id);
      toast.success(`Invoice #${deleteModalInvoice.invoiceNumber} has been deleted.`);
      setDeleteModalInvoice(null);
      fetchInvoices(pagination.page);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ margin: 0 }}>
          <div className="filter-group">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search invoice #, client, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
                onFocus={(e) => { try { e.target.showPicker(); } catch (err) { } }}
                title="Start Issue Date"
                style={{ padding: '8px 10px', fontSize: '12px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
                onFocus={(e) => { try { e.target.showPicker(); } catch (err) { } }}
                title="End Issue Date"
                style={{ padding: '8px 10px', fontSize: '12px' }}
              />
            </div>

            <button type="submit" className="btn btn-secondary btn-sm">
              <span>Filter</span>
            </button>

            {(search || statusFilter || startDate || endDate) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fetchInvoices(pagination.page)}
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreate}
            >
              <Plus size={15} />
              <span>Create Invoice</span>
            </button>
          </div>
        </form>
      </div>

      {/* Invoices Data Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading invoice records from backend...</span>
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              search || statusFilter || startDate || endDate
                ? 'No invoices match your active search or filter criteria.'
                : 'There are currently no invoices in the system.'
            }
            actionLabel="Create Invoice"
            onAction={onOpenCreate}
          />
        ) : (
          <>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Dates</th>
                    <th>Items</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                    <th style={{ textAlign: 'right' }}>Tax</th>
                    <th style={{ textAlign: 'right' }}>Discount</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isDraft = inv.status === 'DRAFT';
                    const isOverdue = inv.status === 'OVERDUE';
                    const isCancelled = inv.status === 'CANCELLED';
                    const isSent = inv.status === 'SENT';
                    const isPaid = inv.status === 'PAID';

                    const canEdit = isDraft;
                    const canCancel = isDraft || isOverdue;
                    const canDelete = isDraft || isCancelled;
                    const canUpdateStatus = isDraft || isOverdue;

                    return (
                      <tr key={inv.id}>
                        {/* Invoice Number */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                              {inv.invoiceNumber}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ID: #{inv.id} • {inv.language || 'EN'}
                            </span>
                          </div>
                        </td>

                        {/* Client */}
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
                            {inv.client?.email && (
                              <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>
                                {inv.client.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dates */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                            <span>Issue: <strong>{inv.issueDate}</strong></span>
                            <span style={{ color: isOverdue ? 'var(--status-overdue-text)' : 'var(--text-muted)' }}>
                              Due: <strong>{inv.dueDate}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Items */}
                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {inv.items?.length || 0} item{inv.items?.length === 1 ? '' : 's'}
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {Number(inv.subtotal || 0).toFixed(2)}
                        </td>

                        {/* Tax */}
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          +{Number(inv.taxTotal || 0).toFixed(2)}
                        </td>

                        {/* Discount */}
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: Number(inv.discount || 0) > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {Number(inv.discount || 0) > 0 ? `-${Number(inv.discount).toFixed(2)}` : '0.00'}
                        </td>

                        {/* Total */}
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {Number(inv.total).toFixed(2)} {inv.currency || 'EGP'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="row-actions">
                            {/* PDF Preview & Send Email Flow */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenPreviewAndSend(inv)}
                              title="Preview PDF & Email Client"
                            >
                              <Send size={13} />
                              <span>Preview & Send</span>
                            </button>

                            {/* Download PDF */}
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDownloadPdf(inv)}
                              title="Download PDF directly"
                            >
                              <Download size={13} />
                              <span>PDF</span>
                            </button>

                            {/* Email Logs */}
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => onOpenEmailLogs(inv)}
                              title="View Email Logs"
                            >
                              <History size={13} />
                              <span>Logs</span>
                            </button>

                            {/* Update Status (Draft->Overdue, Overdue->Paid) */}
                            {canUpdateStatus && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => onOpenStatusUpdate(inv)}
                                title="Update invoice status"
                              >
                                <span>Status</span>
                              </button>
                            )}

                            {/* Edit (Draft only) */}
                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => onOpenEdit(inv)}
                                title="Edit draft invoice"
                              >
                                <FileEdit size={13} />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Cancel (Draft or Overdue only) */}
                            {canCancel && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setCancelModalInvoice(inv)}
                                title="Cancel invoice"
                              >
                                <XCircle size={13} />
                                <span>Cancel</span>
                              </button>
                            )}

                            {/* Delete (Draft or Cancelled only) */}
                            {canDelete && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setDeleteModalInvoice(inv)}
                                title="Delete invoice"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <div>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total invoices)
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchInvoices(pagination.page - 1)}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchInvoices(pagination.page + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(cancelModalInvoice)}
        onClose={() => setCancelModalInvoice(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice #${cancelModalInvoice?.invoiceNumber}? Once cancelled, this invoice cannot be reopened or sent.`}
        confirmText="Cancel Invoice"
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteModalInvoice)}
        onClose={() => setDeleteModalInvoice(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to permanently delete invoice #${deleteModalInvoice?.invoiceNumber}? This action cannot be reversed.`}
        confirmText="Delete Permanently"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
