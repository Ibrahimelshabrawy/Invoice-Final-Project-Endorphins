import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { taxApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function TaxesPage({ onCountsChanged }) {
  const { toast } = useToast();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taxToEdit, setTaxToEdit] = useState(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [taxToDelete, setTaxToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);



  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taxApi.getAll({ search });
      setTaxes(data || []);
    } catch (err) {
      toast.error('Failed to load taxes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleOpenCreate = () => {
    setTaxToEdit(null);
    setName('');
    setRate('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setTaxToEdit(tax);
    setName(tax.name || '');
    setRate(String(tax.rate || ''));
    setIsActive(Boolean(tax.isActive));
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Tax name is required.');
      return;
    }
    const numRate = Number(rate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      toast.error('Tax rate must be a percentage between 0 and 100.');
      return;
    }

    const payload = {
      name: name.trim(),
      rate: numRate,
      isActive,
    };

    setSubmitting(true);
    try {
      if (taxToEdit) {
        await taxApi.update(taxToEdit.id, payload);
        toast.success(`Tax "${name}" updated successfully.`);
      } else {
        await taxApi.create(payload);
        toast.success(`Tax "${name}" created successfully.`);
      }
      setIsFormOpen(false);
      fetchTaxes();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to save tax rate');
    } finally {
      setSubmitting(false);
    }
  };



  const handleConfirmDelete = async () => {
    if (!taxToDelete) return;
    setDeleting(true);
    try {
      await taxApi.delete(taxToDelete.id);
      toast.success(`Tax rule "${taxToDelete.name}" deleted.`);
      setTaxToDelete(null);
      fetchTaxes();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to delete tax');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="filter-group">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search tax rules (e.g. VAT, WHT)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {search && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={fetchTaxes}
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreate}
            >
              <Plus size={15} />
              <span>Add Tax Rate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Taxes Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading tax definitions...</span>
          </div>
        ) : taxes.length === 0 ? (
          <EmptyState
            title="No tax rules found"
            description="Create tax rules such as VAT (Value Added Tax) to calculate tax totals on invoices."
            actionLabel="Add Tax Rate"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tax Rule Name</th>
                  <th style={{ textAlign: 'right' }}>Tax Percentage Rate</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax) => (
                  <tr key={tax.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-gray-850)',
                            color: 'var(--color-white)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Calculator size={15} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{tax.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{tax.id}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                        {Number(tax.rate).toFixed(2)}%
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={tax.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(tax)}
                          title="Edit Tax Rate"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setTaxToDelete(tax)}
                          title="Delete Tax Rate"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
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

      {/* Tax Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={submitting ? undefined : () => setIsFormOpen(false)}
        title={taxToEdit ? `Edit Tax: ${taxToEdit.name}` : 'New Tax Rate Configuration'}
        subtitle="Specify tax jurisdiction name and percentage rate"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleFormSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              <span>{taxToEdit ? 'Save Changes' : 'Create Tax Rule'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Tax Rule Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Value Added Tax (VAT), Withholding Tax"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Rate Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="form-input"
              placeholder="e.g. 14.00"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Value must be between 0 and 100 (applied onto the invoice items subtotal).
            </span>
          </div>

          <div
            onClick={() => setIsActive(!isActive)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginTop: '14px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Tax Rule Status
                </span>
                <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isActive
                  ? 'Active — selectable when creating or editing invoices'
                  : 'Inactive — hidden from new invoices while preserving past records'}
              </span>
            </div>

            <div
              style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: isActive ? 'var(--color-white)' : 'var(--color-gray-800)',
                border: '1px solid var(--border-color)',
                position: 'relative',
                flexShrink: 0,
                transition: 'background-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--color-black)' : 'var(--color-gray-400)',
                  position: 'absolute',
                  top: '2px',
                  left: isActive ? '20px' : '3px',
                  transition: 'left 0.2s ease, background-color 0.2s ease',
                }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taxToDelete)}
        onClose={() => setTaxToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Tax Rate"
        message={`Are you sure you want to delete tax rate "${taxToDelete?.name}"? If this tax has been used on existing invoices, the server will prevent deletion.`}
        confirmText="Delete Tax Rule"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
