import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { clientApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ClientsPage({ onCountsChanged }) {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete State
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientApi.getAll({ search });
      setClients(data || []);
    } catch (err) {
      toast.error('Failed to load clients: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client) => {
    setClientToEdit(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      taxNumber: client.taxNumber || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Client name is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (clientToEdit) {
        await clientApi.update(clientToEdit.id, formData);
        toast.success(`Client "${formData.name}" updated successfully.`);
      } else {
        await clientApi.create(formData);
        toast.success(`Client "${formData.name}" created successfully.`);
      }
      setIsFormOpen(false);
      fetchClients();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to save client');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await clientApi.delete(clientToDelete.id);
      toast.success(`Client "${clientToDelete.name}" deleted.`);
      setClientToDelete(null);
      fetchClients();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to delete client');
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
                placeholder="Search clients by name, company, tax #..."
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
              onClick={fetchClients}
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
              <span>Add Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading clients database...</span>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="No clients found"
            description="Get started by creating your first client account."
            actionLabel="Add Client"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Company</th>
                  <th>Contact Email</th>
                  <th>Phone Number</th>
                  <th>Tax Number</th>
                  <th>Billing Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-gray-850)',
                            color: 'var(--color-white)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '12px',
                          }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{client.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {client.company ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={13} color="var(--text-muted)" />
                          <span>{client.company}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      {client.email ? (
                        <a
                          href={`mailto:${client.email}`}
                          style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Mail size={13} />
                          <span>{client.email}</span>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      {client.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>{client.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      {client.taxNumber ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {client.taxNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      {client.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '200px' }} title={client.address}>
                          <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(client)}
                          title="Edit Client"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setClientToDelete(client)}
                          title="Delete Client"
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

      {/* Client Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={formSubmitting ? undefined : () => setIsFormOpen(false)}
        title={clientToEdit ? `Edit Client: ${clientToEdit.name}` : 'New Client Registration'}
        subtitle="Manage client contact, billing identity, and commercial tax numbers"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsFormOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleFormSubmit}
              disabled={formSubmitting}
            >
              {formSubmitting && <Loader2 size={13} className="animate-spin" />}
              <span>{clientToEdit ? 'Save Changes' : 'Register Client'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Full Name / Primary Contact</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tax / Commercial Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. EG-123-456-789"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="client@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+20 100 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Billing Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Building, Street, District, City, Country"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete client "${clientToDelete?.name}"? Note that clients with associated invoices cannot be deleted.`}
        confirmText="Delete Client"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
