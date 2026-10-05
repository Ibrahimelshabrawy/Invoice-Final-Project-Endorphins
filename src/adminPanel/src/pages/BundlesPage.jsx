import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Briefcase,
  Loader2,
  RefreshCw,
  Tag,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { bundleApi, serviceApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function BundlesPage({ onCountsChanged }) {
  const { toast } = useToast();
  const [bundles, setBundles] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bundleToEdit, setBundleToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    serviceIds: [],
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);



  const fetchBundlesAndServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeFilter !== '') params.isActive = activeFilter;

      const [bundlesData, servicesData] = await Promise.all([
        bundleApi.getAll(params),
        serviceApi.getAll(),
      ]);

      setBundles(bundlesData || []);
      setServices(servicesData || []);
    } catch (err) {
      toast.error('Failed to load bundles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  useEffect(() => {
    fetchBundlesAndServices();
  }, [fetchBundlesAndServices]);

  const handleOpenCreate = () => {
    setBundleToEdit(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      serviceIds: [],
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bundle) => {
    setBundleToEdit(bundle);
    setFormData({
      name: bundle.name || '',
      description: bundle.description || '',
      price: String(bundle.price || ''),
      serviceIds: Array.isArray(bundle.serviceIds) ? [...bundle.serviceIds] : [],
      isActive: Boolean(bundle.isActive),
    });
    setIsFormOpen(true);
  };

  const toggleServiceInBundle = (serviceId) => {
    setFormData((prev) => {
      const exists = prev.serviceIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
  };

  // Live calculate sum of individual constituent service prices
  const sumOfServices = useMemo(() => {
    return formData.serviceIds.reduce((acc, sid) => {
      const s = services.find((srv) => srv.id === sid);
      return acc + (Number(s?.unitPrice) || 0);
    }, 0);
  }, [formData.serviceIds, services]);

  const bundleSavings = useMemo(() => {
    const p = Number(formData.price) || 0;
    if (sumOfServices > p) {
      return sumOfServices - p;
    }
    return 0;
  }, [sumOfServices, formData.price]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Bundle name is required.');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      toast.error('Please specify a valid non-negative bundle price.');
      return;
    }
    if (formData.serviceIds.length === 0) {
      toast.error('A bundle must include at least one constituent service.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: Number(formData.price),
      serviceIds: formData.serviceIds,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (bundleToEdit) {
        await bundleApi.update(bundleToEdit.id, payload);
        toast.success(`Bundle "${formData.name}" updated successfully.`);
      } else {
        await bundleApi.create(payload);
        toast.success(`Bundle "${formData.name}" created successfully.`);
      }
      setIsFormOpen(false);
      fetchBundlesAndServices();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to save bundle');
    } finally {
      setSubmitting(false);
    }
  };



  const handleConfirmDelete = async () => {
    if (!bundleToDelete) return;
    setDeleting(true);
    try {
      await bundleApi.delete(bundleToDelete.id);
      toast.success(`Bundle "${bundleToDelete.name}" deleted.`);
      setBundleToDelete(null);
      fetchBundlesAndServices();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to delete bundle');
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
                placeholder="Search packages & bundles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="">All States</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {(search || activeFilter !== '') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setActiveFilter('');
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
              onClick={fetchBundlesAndServices}
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
              <span>Create Bundle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bundles Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading service bundles...</span>
          </div>
        ) : bundles.length === 0 ? (
          <EmptyState
            title="No bundles found"
            description="Package multiple services together into discounted offerings."
            actionLabel="Create Bundle"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bundle Name</th>
                  <th>Constituent Services</th>
                  <th>Package Description</th>
                  <th style={{ textAlign: 'right' }}>Package Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle) => {
                  const constituentServices = bundle.services || [];

                  return (
                    <tr key={bundle.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{bundle.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{bundle.id}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxWidth: '320px' }}>
                          {constituentServices.length > 0 ? (
                            constituentServices.map((s) => (
                              <span
                                key={s.id}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 7px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--color-gray-850)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {bundle.serviceIds?.length || 0} services
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bundle.description || '—'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                          {Number(bundle.price).toFixed(2)} EGP
                        </span>
                      </td>

                      <td>
                      <StatusBadge status={bundle.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEdit(bundle)}
                            title="Edit Bundle"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setBundleToDelete(bundle)}
                            title="Delete Bundle"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bundle Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={submitting ? undefined : () => setIsFormOpen(false)}
        title={bundleToEdit ? `Edit Bundle: ${bundleToEdit.name}` : 'Create Service Package / Bundle'}
        subtitle="Group multiple service offerings into a unified package with combined pricing"
        size="lg"
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
              <span>{bundleToEdit ? 'Save Changes' : 'Create Bundle'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label form-label-required">Bundle Package Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Complete Startup Launch Pack"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Package Price (EGP)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="form-input"
              placeholder="e.g. 5000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          {/* Constituent Services Multi-Select */}
          <div className="form-group">
            <label className="form-label form-label-required">
              <span>Select Constituent Services ({formData.serviceIds.length} selected)</span>
            </label>
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {services.map((srv) => {
                const isSelected = formData.serviceIds.includes(srv.id);

                return (
                  <label
                    key={srv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--color-gray-800)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--color-gray-600)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleServiceInBundle(srv.id)}
                      />
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? '600' : '400', color: isSelected ? 'var(--color-white)' : 'var(--text-secondary)' }}>
                        {srv.name}
                      </span>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {Number(srv.unitPrice).toFixed(2)} EGP
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Live Price Comparison Box */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Individual Services Total: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{sumOfServices.toFixed(2)} EGP</strong>
            </div>

            {bundleSavings > 0 && (
              <div style={{ color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={13} />
                <span>Client Saves: <strong>{bundleSavings.toFixed(2)} EGP</strong></span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Bundle Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Package description or scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
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
                  Bundle Status
                </span>
                <StatusBadge status={formData.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {formData.isActive
                  ? 'Active — available for selection when creating or editing invoices'
                  : 'Inactive — hidden from new invoices while preserving historical records'}
              </span>
            </div>

            <div
              style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: formData.isActive ? 'var(--color-white)' : 'var(--color-gray-800)',
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
                  background: formData.isActive ? 'var(--color-black)' : 'var(--color-gray-400)',
                  position: 'absolute',
                  top: '2px',
                  left: formData.isActive ? '20px' : '3px',
                  transition: 'left 0.2s ease, background-color 0.2s ease',
                }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bundleToDelete)}
        onClose={() => setBundleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bundle"
        message={`Are you sure you want to delete bundle "${bundleToDelete?.name}"? Bundles already referenced by invoices cannot be deleted.`}
        confirmText="Delete Bundle"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
