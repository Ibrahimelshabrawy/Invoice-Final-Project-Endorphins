import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { Mail, RefreshCw, AlertCircle, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { invoiceApi, emailLogApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function InvoiceEmailLogsModal({
  isOpen,
  onClose,
  invoice,
}) {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryingLogId, setRetryingLogId] = useState(null);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [isOpen, invoice]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.getEmailLogs(invoice.id);
      setLogs(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch email logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (log) => {
    setRetryingLogId(log.id);
    try {
      // 1. Must generate temporary PDF first for retry
      toast.info('Generating fresh PDF snapshot for retry...');
      const previewRes = await invoiceApi.preview(invoice.id);

      // 2. Call POST /api/invoicing/email-logs/:id/retry
      await emailLogApi.retry(log.id, {
        tempPdfId: previewRes.tempPdfId,
        language: invoice.language || 'EN',
      });

      toast.success('Invoice email retry request accepted!');
      // Re-fetch logs to show progress
      setTimeout(fetchLogs, 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to retry sending email');
    } finally {
      setRetryingLogId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Email Delivery History"
      subtitle={`Logs for Invoice #${invoice?.invoiceNumber || invoice?.id}`}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <span>Retrieving email activity...</span>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Mail size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>No email dispatch logs found for this invoice.</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Emails sent via the "Preview & Send" action will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map((log) => {
            const isFailed = log.status === 'FAILED';
            const isSent = log.status === 'SENT';

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={log.status} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {log.recipient}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                    </span>

                    {isFailed && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRetry(log)}
                        disabled={retryingLogId === log.id}
                      >
                        {retryingLogId === log.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        <span>Retry Send</span>
                      </button>
                    )}
                  </div>
                </div>

                {log.cc && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>CC: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {Array.isArray(log.cc) ? log.cc.join(', ') : String(log.cc)}
                    </span>
                  </div>
                )}

                {log.error && (
                  <div
                    style={{
                      background: 'var(--color-gray-850)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--color-gray-300)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Error Diagnostic: </strong>
                      <span>{log.error}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
