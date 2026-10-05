import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
  Loader2,
  RefreshCw,
  Folder,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { serviceApi, categoryApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ServicesPage({ onCountsChanged }) {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitTypeFilter, setUnitTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: '',
    unitType: 'FIXED',
    categoryId: '',
    subcategoryId: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);



  const fetchServicesAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.categoryId = categoryFilter;
      if (unitTypeFilter) params.unitType = unitTypeFilter;
      if (activeFilter !== '') params.isActive = activeFilter;

      const [servicesData, categoriesData] = await Promise.all([
        serviceApi.getAll(params),
        categoryApi.getAll(),
      ]);

      setServices(servicesData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      toast.error('Failed to load services: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, unitTypeFilter, activeFilter]);

  useEffect(() => {
    fetchServicesAndCategories();
  }, [fetchServicesAndCategories]);

  // Derived subcategories for the currently selected category in form
  const availableSubcategories = React.useMemo(() => {
    if (!formData.categoryId) return [];
    const cat = categories.find((c) => String(c.id) === String(formData.categoryId));
    return cat?.subcategories || [];
  }, [formData.categoryId, categories]);

  const handleOpenCreate = () => {
    setServiceToEdit(null);
    setFormData({
      name: '',
      description: '',
      unitPrice: '',
      unitType: 'FIXED',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      subcategoryId: '',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (service) => {
    setServiceToEdit(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      unitPrice: String(service.unitPrice || ''),
      unitType: service.unitType || 'FIXED',
      categoryId: String(service.categoryId || ''),
      subcategoryId: service.subcategoryId ? String(service.subcategoryId) : '',
      isActive: Boolean(service.isActive),
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Service name is required.');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please assign a primary category.');
      return;
    }
    if (formData.unitPrice === '' || Number(formData.unitPrice) < 0) {
      toast.error('Please provide a valid non-negative unit price.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      unitPrice: Number(formData.unitPrice),
      unitType: formData.unitType,
      categoryId: Number(formData.categoryId),
      subcategoryId: formData.subcategoryId ? Number(formData.subcategoryId) : null,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (serviceToEdit) {
        await serviceApi.update(serviceToEdit.id, payload);
        toast.success(`Service "${formData.name}" updated successfully.`);
      } else {
        await serviceApi.create(payload);
        toast.success(`Service "${formData.name}" created successfully.`);
      }
      setIsFormOpen(false);
      fetchServicesAndCategories();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };



  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setDeleting(true);
    try {
      await serviceApi.delete(serviceToDelete.id);
      toast.success(`Service "${serviceToDelete.name}" deleted.`);
      setServiceToDelete(null);
      fetchServicesAndCategories();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to delete service');
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
                placeholder="Search services by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={unitTypeFilter}
              onChange={(e) => setUnitTypeFilter(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="">All Units</option>
              <option value="FIXED">Fixed</option>
              <option value="HOURLY">Hourly</option>
              <option value="MONTHLY">Monthly</option>
            </select>

            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ width: '120px' }}
            >
              <option value="">All States</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {(search || categoryFilter || unitTypeFilter || activeFilter !== '') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setUnitTypeFilter('');
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
              onClick={fetchServicesAndCategories}
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
              <span>Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading service offerings...</span>
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="Start building your service catalog by adding individual billable services."
            actionLabel="Add Service"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Unit Type</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{service.name}</strong>
                        {service.description && (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {service.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Folder size={13} color="var(--brand-primary)" />
                        <span>{service.category?.name || 'Uncategorized'}</span>
                      </div>
                    </td>

                    <td>
                      {service.subcategory?.name ? (
                        <span style={{ color: 'var(--text-secondary)' }}>{service.subcategory.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-service">
                        {service.unitType}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {Number(service.unitPrice).toFixed(2)} EGP
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={service.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(service)}
                          title="Edit Service"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setServiceToDelete(service)}
                          title="Delete Service"
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

      {/* Service Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={submitting ? undefined : () => setIsFormOpen(false)}
        title={serviceToEdit ? `Edit Service: ${serviceToEdit.name}` : 'New Service Offering'}
        subtitle="Configure billing rates, taxonomy classification, and charging unit"
        size="md"
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
              <span>{serviceToEdit ? 'Save Changes' : 'Create Service'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Service Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Brand Identity Design, UI/UX Prototyping"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Category</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                required
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subcategory (Optional)</label>
              <select
                className="form-select"
                value={formData.subcategoryId}
                onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                disabled={!formData.categoryId || availableSubcategories.length === 0}
              >
                <option value="">-- None / Root Category --</option>
                {availableSubcategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Unit Price (EGP)</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="e.g. 1500"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Unit Type</label>
              <select
                className="form-select"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                required
              >
                <option value="FIXED">FIXED (One-off)</option>
                <option value="HOURLY">HOURLY (Per hour)</option>
                <option value="MONTHLY">MONTHLY (Per month)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detailed scope or deliverables..."
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
                  Service Status
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
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to delete service "${serviceToDelete?.name}"? If this service is used in any invoice or bundle, deletion will be blocked by the server.`}
        confirmText="Delete Service"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
