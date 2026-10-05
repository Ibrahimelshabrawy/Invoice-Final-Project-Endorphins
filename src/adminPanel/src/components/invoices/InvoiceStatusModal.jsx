import React, { useState } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { invoiceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader2, ArrowRight, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function InvoiceStatusModal({
  isOpen,
  onClose,
  invoice,
  onUpdated,
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  if (!invoice) return null;

  // Compute allowed next statuses according to the backend business rules
  const currentStatus = invoice.status;
  const allowedNextStatuses = [];

  if (currentStatus === 'DRAFT') {
    allowedNextStatuses.push('OVERDUE');
  } else if (currentStatus === 'OVERDUE') {
    allowedNextStatuses.push('PAID');
  }

  const handleUpdate = async () => {
    if (!selectedStatus) {
      toast.warning('Please select a target status.');
      return;
    }

    setSubmitting(true);
    try {
      await invoiceApi.updateStatus(invoice.id, selectedStatus);
      toast.success(`Invoice status successfully transitioned to ${selectedStatus}.`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update invoice status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      title="Update Invoice Status"
      subtitle={`Invoice #${invoice.invoiceNumber || invoice.id}`}
      size="sm"
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
            onClick={handleUpdate}
            disabled={submitting || !selectedStatus || allowedNextStatuses.length === 0}
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            <span>Apply Status Change</span>
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Status:</span>
          <StatusBadge status={currentStatus} />
        </div>

        {allowedNextStatuses.length > 0 ? (
          <div>
            <label className="form-label" style={{ marginBottom: '8px' }}>
              Select Next Permitted State:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allowedNextStatuses.map((st) => (
                <label
                  key={st}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: selectedStatus === st ? 'var(--color-gray-800)' : 'var(--color-gray-950)',
                    border: `1px solid ${selectedStatus === st ? 'var(--color-gray-400)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="targetStatus"
                    value={st}
                    checked={selectedStatus === st}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <span style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text-primary)' }}>
                    Transition to {st}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--color-gray-850)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '12.5px', color: 'var(--color-gray-300)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: '600' }}>
              <AlertTriangle size={15} />
              <span>Status Transition Locked</span>
            </div>
            {currentStatus === 'SENT' && (
              <p>Sent invoices are locked. Changes require cancellation and reissue.</p>
            )}
            {currentStatus === 'PAID' && (
              <p>Paid invoices are in a final, terminal state and cannot be modified.</p>
            )}
            {currentStatus === 'CANCELLED' && (
              <p>Cancelled invoices cannot change status.</p>
            )}
          </div>
        )}

        {/* Business Rules Explanation Card */}
        <div style={{ background: 'var(--color-gray-950)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px' }}>
            <Info size={13} color="var(--color-gray-300)" />
            <span>Backend State Rules</span>
          </div>
          <ul style={{ paddingLeft: '16px', lineHeight: '1.6' }}>
            <li><strong>SENT</strong>: Automatically updated when invoice email is dispatched.</li>
            <li><strong>DRAFT → OVERDUE</strong>: Permitted if payment deadline has elapsed.</li>
            <li><strong>OVERDUE → PAID</strong>: Permitted once client payment is received.</li>
            <li><strong>CANCELLED</strong>: Must be performed via the dedicated "Cancel Invoice" action.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
