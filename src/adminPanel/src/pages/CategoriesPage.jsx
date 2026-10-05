import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Folder,
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { categoryApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CategoriesPage({ onCountsChanged }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded tree states
  const [expandedCatIds, setExpandedCatIds] = useState(new Set());

  // Category Modal (Create/Edit Category or Subcategory)
  const [modalType, setModalType] = useState('category'); // 'category' | 'subcategory'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [parentCategoryForSub, setParentCategoryForSub] = useState(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data || []);
      // Expand all by default
      const allIds = new Set((data || []).map((c) => c.id));
      setExpandedCatIds(allIds);
    } catch (err) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = (id) => {
    setExpandedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenCreateCategory = () => {
    setModalType('category');
    setCategoryToEdit(null);
    setParentCategoryForSub(null);
    setName('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenCreateSubcategory = (parentCat) => {
    setModalType('subcategory');
    setCategoryToEdit(null);
    setParentCategoryForSub(parentCat);
    setName('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat, isSub = false) => {
    setModalType(isSub ? 'subcategory' : 'category');
    setCategoryToEdit(cat);
    setName(cat.name || '');
    setIsActive(Boolean(cat.isActive));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      if (categoryToEdit) {
        await categoryApi.update(categoryToEdit.id, { name: name.trim(), isActive });
        toast.success(`Updated successfully.`);
      } else if (modalType === 'subcategory' && parentCategoryForSub) {
        await categoryApi.createSubcategory(parentCategoryForSub.id, {
          name: name.trim(),
          isActive,
        });
        toast.success(`Subcategory created under "${parentCategoryForSub.name}".`);
      } else {
        await categoryApi.create({ name: name.trim(), isActive });
        toast.success(`Category "${name}" created.`);
      }
      setIsModalOpen(false);
      fetchCategories();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };



  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await categoryApi.delete(itemToDelete.id);
      toast.success(`"${itemToDelete.name}" deleted.`);
      setItemToDelete(null);
      fetchCategories();
      if (onCountsChanged) onCountsChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title">Taxonomy & Service Classification</h3>
            <p className="card-subtitle">Manage top-level service categories and subcategory hierarchies</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={fetchCategories}
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreateCategory}
            >
              <Plus size={15} />
              <span>New Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tree View */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <span>Loading category taxonomy...</span>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories defined"
            description="Create your first service category to organize your services catalog."
            actionLabel="Add Category"
            onAction={handleOpenCreateCategory}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((cat) => {
              const isExpanded = expandedCatIds.has(cat.id);
              const subcats = cat.subcategories || [];

              return (
                <div
                  key={cat.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Parent Category Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      background: 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.id)}
                        style={{
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                        }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <Folder size={18} color="var(--brand-primary)" />

                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({subcats.length} subcategories)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusBadge status={cat.isActive ? 'ACTIVE' : 'INACTIVE'} />

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenCreateSubcategory(cat)}
                      >
                        <FolderPlus size={13} />
                        <span>Add Subcategory</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenEdit(cat, false)}
                        title="Edit Category"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setItemToDelete(cat)}
                        title="Delete Category"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Container */}
                  {isExpanded && subcats.length > 0 && (
                    <div style={{ paddingLeft: '48px', backgroundColor: 'var(--bg-deep)' }}>
                      {subcats.map((sc) => (
                        <div
                          key={sc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 20px',
                            borderTop: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>↳</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{sc.name}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <StatusBadge status={sc.isActive ? 'ACTIVE' : 'INACTIVE'} />

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEdit(sc, true)}
                              title="Edit Subcategory"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setItemToDelete(sc)}
                              title="Delete Subcategory"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={submitting ? undefined : () => setIsModalOpen(false)}
        title={
          categoryToEdit
            ? `Edit ${modalType === 'subcategory' ? 'Subcategory' : 'Category'}: ${categoryToEdit.name}`
            : modalType === 'subcategory'
            ? `New Subcategory under "${parentCategoryForSub?.name}"`
            : 'New Top-Level Category'
        }
        subtitle="Organize billable items in your service catalogue"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              <span>{categoryToEdit ? 'Save Changes' : 'Create'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Design, Development, Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
                  Status
                </span>
                <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isActive
                  ? 'Active — services in this category are available for invoicing'
                  : 'Inactive — hidden from new selections'}
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
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? Note: If this category contains subcategories or associated services, the server will reject deletion.`}
        confirmText="Delete Category"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
