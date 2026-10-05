import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../common/Modal';
import { Plus, Trash2, Calculator, AlertCircle, Loader2, Sparkles, Building, Briefcase, Layers } from 'lucide-react';
import { invoiceApi, clientApi, serviceApi, bundleApi, taxApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function InvoiceFormModal({
  isOpen,
  onClose,
  invoiceToEdit = null,
  onSaved,
}) {
  const { toast } = useToast();
  const isEditing = Boolean(invoiceToEdit);

  // Reference catalog data
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('EGP');
  const [language, setLanguage] = useState('EN');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Discount
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE'); // 'PERCENTAGE' | 'FIXED'

  // Selected Taxes
  const [selectedTaxIds, setSelectedTaxIds] = useState([]);

  // Quick Inline Tax Creation
  const [showCreateTax, setShowCreateTax] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [creatingTax, setCreatingTax] = useState(false);

  // Items: array of { id, itemType: 'SERVICE'|'BUNDLE', refId, quantity, unitPrice, description }
  const [items, setItems] = useState([
    { id: 1, itemType: 'SERVICE', refId: '', quantity: 1, unitPrice: 0, description: '' },
  ]);

  const loadCatalogs = useCallback(async () => {
    setLoadingCatalogs(true);
    try {
      const [clientsData, servicesData, bundlesData, taxesData] = await Promise.all([
        clientApi.getAll(),
        serviceApi.getAll({ isActive: true }),
        bundleApi.getAll({ isActive: true }),
        taxApi.getAll({ isActive: true }),
      ]);
      setClients(clientsData || []);
      setServices(servicesData || []);
      setBundles(bundlesData || []);
      setTaxes(taxesData || []);
    } catch (err) {
      toast.error('Failed to load catalog data for invoice form: ' + err.message);
    } finally {
      setLoadingCatalogs(false);
    }
  }, [toast]);

  // Load reference data
  useEffect(() => {
    if (isOpen) {
      loadCatalogs();
    }
  }, [isOpen, loadCatalogs]);

  // Populate data when editing an invoice
  useEffect(() => {
    if (isOpen && invoiceToEdit) {
      setClientId(String(invoiceToEdit.clientId || ''));
      setIssueDate(invoiceToEdit.issueDate || new Date().toISOString().split('T')[0]);
      setDueDate(invoiceToEdit.dueDate || '');
      setCurrency(invoiceToEdit.currency || 'EGP');
      setLanguage(invoiceToEdit.language || 'EN');
      setNotes(invoiceToEdit.notes || '');
      setPaymentTerms(invoiceToEdit.paymentTerms || '');

      const dVal = invoiceToEdit.discountValue ? Number(invoiceToEdit.discountValue) : '';
      setDiscountValue(dVal > 0 ? String(dVal) : '');
      setDiscountType(invoiceToEdit.discountType || 'PERCENTAGE');

      if (Array.isArray(invoiceToEdit.taxes)) {
        setSelectedTaxIds(invoiceToEdit.taxes.map((t) => t.taxId));
      } else {
        setSelectedTaxIds([]);
      }

      if (Array.isArray(invoiceToEdit.items) && invoiceToEdit.items.length > 0) {
        setItems(
          invoiceToEdit.items.map((it, idx) => ({
            id: idx + 1,
            itemType: it.itemType,
            refId: String(it.refId),
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            description: it.description || '',
          }))
        );
      }
    } else if (isOpen && !invoiceToEdit) {
      // Reset form for fresh create
      setClientId('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setDueDate(d.toISOString().split('T')[0]);
      setCurrency('EGP');
      setLanguage('EN');
      setNotes('');
      setPaymentTerms('');
      setDiscountValue('');
      setDiscountType('PERCENTAGE');
      setSelectedTaxIds([]);
      setItems([{ id: 1, itemType: 'SERVICE', refId: '', quantity: 1, unitPrice: 0, description: '' }]);
    }
  }, [isOpen, invoiceToEdit]);



  // Item helpers
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        itemType: 'SERVICE',
        refId: '',
        quantity: 1,
        unitPrice: 0,
        description: '',
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      toast.warning('An invoice requires at least one item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemField = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'itemType') {
        item.refId = '';
        item.unitPrice = 0;
        item.description = '';
      }

      if (field === 'refId') {
        if (item.itemType === 'SERVICE') {
          const s = services.find((srv) => String(srv.id) === String(value));
          if (s) {
            item.unitPrice = Number(s.unitPrice) || 0;
            item.description = s.description || s.name;
          }
        } else if (item.itemType === 'BUNDLE') {
          const b = bundles.find((bnd) => String(bnd.id) === String(value));
          if (b) {
            item.unitPrice = Number(b.price) || 0;
            item.description = b.description || b.name;
          }
        }
      }

      next[index] = item;
      return next;
    });
  };

  // Toggle tax
  const toggleTax = (taxId) => {
    setSelectedTaxIds((prev) =>
      prev.includes(taxId) ? prev.filter((id) => id !== taxId) : [...prev, taxId]
    );
  };

  const handleQuickCreateTax = async (e) => {
    if (e) e.preventDefault();
    if (!newTaxName.trim()) {
      toast.error('Tax name is required.');
      return;
    }
    const rateNum = Number(newTaxRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error('Tax rate must be a valid percentage between 0 and 100.');
      return;
    }

    setCreatingTax(true);
    try {
      const created = await taxApi.create({
        name: newTaxName.trim(),
        rate: rateNum,
        isActive: true,
      });

      // Append to available taxes and automatically check it
      setTaxes((prev) => [...prev, created]);
      setSelectedTaxIds((prev) => [...prev, created.id]);
      toast.success(`Tax "${created.name}" created and applied.`);

      setNewTaxName('');
      setNewTaxRate('');
      setShowCreateTax(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create tax rule');
    } finally {
      setCreatingTax(false);
    }
  };

  // Live Financial Calculation (mirrors src/utils/invoice.util.js)
  const calculation = useMemo(() => {
    const subtotal = items.reduce((acc, it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unitPrice) || 0;
      return acc + qty * price;
    }, 0);

    const activeSelectedTaxes = taxes.filter((t) => selectedTaxIds.includes(t.id));
    const taxDetails = activeSelectedTaxes.map((t) => {
      const rate = Number(t.rate) || 0;
      const amount = Number(((subtotal * rate) / 100).toFixed(2));
      return { id: t.id, name: t.name, rate, amount };
    });

    const taxTotal = taxDetails.reduce((acc, t) => acc + t.amount, 0);
    const amountWithTax = subtotal + taxTotal;

    const dVal = Number(discountValue) || 0;
    let calculatedDiscount = 0;

    if (dVal > 0) {
      if (discountType === 'PERCENTAGE') {
        calculatedDiscount = Number(((amountWithTax * Math.min(100, dVal)) / 100).toFixed(2));
      } else {
        calculatedDiscount = Number(Math.min(amountWithTax, dVal).toFixed(2));
      }
    }

    const total = Math.max(0, amountWithTax - calculatedDiscount);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxDetails,
      taxTotal: Number(taxTotal.toFixed(2)),
      amountWithTax: Number(amountWithTax.toFixed(2)),
      discountAmount: Number(calculatedDiscount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [items, taxes, selectedTaxIds, discountValue, discountType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('Please select a client for this invoice.');
      return;
    }

    if (!issueDate || !dueDate) {
      toast.error('Issue date and due date are required.');
      return;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      toast.error('Due date cannot be earlier than issue date.');
      return;
    }

    const validItems = items.filter((it) => it.refId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('Please configure at least one valid item with a selected service/bundle and positive quantity.');
      return;
    }

    const payload = {
      clientId: Number(clientId),
      issueDate,
      dueDate,
      currency,
      language,
      notes: notes.trim() || null,
      paymentTerms: paymentTerms.trim() || null,
      taxIds: selectedTaxIds.map(Number),
      items: validItems.map((it) => ({
        itemType: it.itemType,
        refId: Number(it.refId),
        quantity: Number(it.quantity),
      })),
    };

    const dVal = Number(discountValue);
    if (dVal > 0) {
      payload.discountValue = dVal;
      payload.discountType = discountType;
    } else {
      payload.discountValue = null;
      payload.discountType = null;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await invoiceApi.update(invoiceToEdit.id, payload);
        toast.success(`Draft Invoice #${invoiceToEdit.invoiceNumber || invoiceToEdit.id} updated successfully.`);
      } else {
        const created = await invoiceApi.create(payload);
        toast.success(`Invoice #${created.invoiceNumber} created successfully.`);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      title={isEditing ? `Edit Draft Invoice #${invoiceToEdit?.invoiceNumber}` : 'Create New Invoice'}
      subtitle="Complete client billing, line items, applied taxes, and discounts"
      size="xl"
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting || loadingCatalogs}
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Generate Invoice'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Row 1: Client & Dates */}
        <div className="card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} color="var(--color-gray-300)" />
            <span>Client & Terms</span>
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required">Client</label>
              <select
                className="form-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} {c.email ? `• ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Issue Date</label>
              <input
                type="date"
                className="form-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="EN">English (EN)</option>
                <option value="AR">Arabic (AR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Line Items */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="var(--color-gray-300)" />
              <span>Invoice Items ({items.length})</span>
            </h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItem}
            >
              <Plus size={14} />
              <span>Add Line Item</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 100px 110px 110px 38px',
                  gap: '10px',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Item Type */}
                <select
                  className="form-select"
                  value={item.itemType}
                  onChange={(e) => updateItemField(idx, 'itemType', e.target.value)}
                  style={{ padding: '7px 8px', fontSize: '12px' }}
                >
                  <option value="SERVICE">Service</option>
                  <option value="BUNDLE">Bundle</option>
                </select>

                {/* Reference Entity */}
                <select
                  className="form-select"
                  value={item.refId}
                  onChange={(e) => updateItemField(idx, 'refId', e.target.value)}
                  style={{ padding: '7px 8px', fontSize: '12px' }}
                  required
                >
                  <option value="">
                    -- Select {item.itemType === 'SERVICE' ? 'Service' : 'Bundle'} --
                  </option>
                  {item.itemType === 'SERVICE'
                    ? services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.unitPrice} EGP / {s.unitType})
                        </option>
                      ))
                    : bundles.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.price} EGP)
                        </option>
                      ))}
                </select>

                {/* Quantity */}
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  className="form-input"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                  style={{ padding: '7px 8px', fontSize: '12px' }}
                  required
                />

                {/* Unit Price (Snapshot display) */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {Number(item.unitPrice || 0).toFixed(2)} EGP
                </div>

                {/* Line Total */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right' }}>
                  {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)} EGP
                </div>

                {/* Remove */}
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => removeItem(idx)}
                  title="Remove item"
                  style={{ color: 'var(--status-cancelled-text)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Taxes & Discounts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          {/* Taxes */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Calculator size={16} color="var(--color-gray-300)" />
                <span>Applicable Taxes</span>
              </h4>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowCreateTax((prev) => !prev)}
                style={{ fontSize: '11.5px', padding: '3px 8px' }}
                title="Create a new tax rule immediately"
              >
                <Plus size={13} />
                <span>{showCreateTax ? 'Cancel' : 'Create Tax'}</span>
              </button>
            </div>

            {/* Quick Inline Tax Creator */}
            {showCreateTax && (
              <div
                style={{
                  background: 'var(--color-gray-950)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  New Tax Rule
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tax name (e.g. VAT)"
                    value={newTaxName}
                    onChange={(e) => setNewTaxName(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Rate %"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowCreateTax(false);
                      setNewTaxName('');
                      setNewTaxRate('');
                    }}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleQuickCreateTax}
                    disabled={creatingTax}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    {creatingTax && <Loader2 size={12} className="animate-spin" />}
                    <span>Save & Apply</span>
                  </button>
                </div>
              </div>
            )}

            {taxes.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active taxes configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {taxes.map((tax) => {
                  const isChecked = selectedTaxIds.includes(tax.id);
                  return (
                    <label
                      key={tax.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'var(--color-gray-800)' : 'var(--color-gray-950)',
                        border: `1px solid ${isChecked ? 'var(--color-gray-400)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTax(tax.id)}
                        />
                        <span>{tax.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-primary)' }}>
                        +{tax.rate}%
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discounts */}
          <div className="card" style={{ padding: '18px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Invoice-Level Discount
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (EGP)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discount Value</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  placeholder="0 (No discount)"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Note: Discount is applied after taxes as per standard business rules.
            </p>
          </div>
        </div>

        {/* Row 4: Financial Summary Box */}
        <div
          style={{
            backgroundColor: 'var(--color-gray-950)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Items Subtotal:</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{calculation.subtotal.toFixed(2)} EGP</span>
          </div>

          {calculation.taxDetails.map((td) => (
            <div key={td.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <span>{td.name} ({td.rate}%):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>+{td.amount.toFixed(2)} EGP</span>
            </div>
          ))}

          {calculation.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <span>Discount ({discountType === 'PERCENTAGE' ? `${discountValue}%` : 'Fixed'}):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>-{calculation.discountAmount.toFixed(2)} EGP</span>
            </div>
          )}

          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-white)' }}>Grand Total:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: '700', color: 'var(--color-white)' }}>
              {calculation.total.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Row 5: Notes & Payment Terms */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Payment due within 14 days by bank transfer..."
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal / Public Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Project deliverable milestone #1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
