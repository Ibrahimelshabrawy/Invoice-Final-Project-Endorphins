import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import {
  FileText,
  Send,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Download,
  Loader2,
  CheckCircle2,
  Globe,
  Mail,
} from 'lucide-react';
import { invoiceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function InvoicePreviewAndSendModal({
  isOpen,
  onClose,
  invoice,
  onSentSuccess,
}) {
  const { toast } = useToast();
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // PDF info returned from POST /api/invoicing/invoices/:id/preview
  const [pdfData, setPdfData] = useState(null);
  // pdfBlobUrl for iframe / view
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Remaining seconds for temporary PDF
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef(null);

  // Email parameters
  const [language, setLanguage] = useState('EN'); // strictly 'EN' | 'AR'
  const [ccInput, setCcInput] = useState('');

  // 1. When modal opens, generate initial temporary PDF preview
  useEffect(() => {
    if (isOpen && invoice) {
      setLanguage(invoice.language || 'EN');
      generatePreview();
    } else {
      // Reset state on close
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, invoice]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfData(null);
    setSecondsRemaining(0);
    setCcInput('');
  };

  const generatePreview = async () => {
    if (!invoice?.id) return;
    setLoadingPreview(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      // Call real backend endpoint: POST /api/invoicing/invoices/:id/preview
      const previewRes = await invoiceApi.preview(invoice.id);
      setPdfData(previewRes);

      // Calculate initial expiration
      const initialSeconds = previewRes.expiresInSeconds || 1800;
      setSecondsRemaining(initialSeconds);

      // Start live countdown timer
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Download buffer for local preview
      try {
        const { blob } = await invoiceApi.downloadPdf(invoice.id);
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.warn('Could not stream blob preview for iframe:', err.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice PDF preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendEmail = async () => {
    if (!pdfData?.tempPdfId) {
      toast.error('Temporary PDF not found. Please regenerate preview.');
      return;
    }

    if (secondsRemaining <= 0) {
      toast.error('The temporary PDF has expired. Please regenerate the preview before sending.');
      return;
    }

    const recipient = invoice.client?.email?.trim();
    if (!recipient) {
      toast.error(`Client "${invoice.client?.name}" does not have an email address.`);
      return;
    }

    // Process CC emails
    const cleanCc = ccInput
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    setSendingEmail(true);
    try {
      // Call real backend endpoint: POST /api/invoicing/invoices/:id/send
      // Sends the SAME temporary PDF!
      await invoiceApi.send(invoice.id, {
        tempPdfId: pdfData.tempPdfId,
        language,
        cc: cleanCc,
      });

      toast.success(
        `Invoice email accepted for background delivery to ${recipient}.`
      );
      if (onSentSuccess) onSentSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDiscard = async () => {
    if (!pdfData?.tempPdfId) {
      onClose();
      return;
    }

    setDiscarding(true);
    try {
      await invoiceApi.discardPdf(invoice.id, pdfData.tempPdfId);
      toast.info('Temporary invoice PDF discarded successfully.');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to discard temporary PDF');
    } finally {
      setDiscarding(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00 (EXPIRED)';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isExpired = secondsRemaining <= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loadingPreview || sendingEmail ? undefined : onClose}
      title={`Invoice Preview & Email Delivery`}
      subtitle={`Invoice #${invoice?.invoiceNumber || invoice?.id} • Client: ${invoice?.client?.name || 'N/A'}`}
      size="xl"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {pdfData?.tempPdfId && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleDiscard}
                disabled={sendingEmail || discarding || loadingPreview}
                title="Discard this temporary PDF from server storage"
              >
                {discarding ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Discard PDF</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={sendingEmail}
            >
              Close
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSendEmail}
              disabled={loadingPreview || sendingEmail || isExpired || !pdfData?.tempPdfId}
            >
              {sendingEmail ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending via SMTP...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Invoice Email ({language})</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: PDF Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Expiration Banner */}
          <div className={`pdf-countdown-box ${isExpired ? 'expired' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="var(--color-gray-400)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {isExpired ? 'Temporary PDF Has Expired' : 'Temporary PDF Expiration Window'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isExpired
                    ? 'This PDF was pruned from server memory. Regenerate to send.'
                    : 'The backend will send this exact snapshot file.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`pdf-timer-text ${isExpired ? 'expired' : ''}`}>
                {formatTimer(secondsRemaining)}
              </span>

              {isExpired && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={generatePreview}
                  disabled={loadingPreview}
                >
                  <RefreshCw size={13} className={loadingPreview ? 'animate-spin' : ''} />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          </div>

          {/* PDF Viewer Frame */}
          <div
            style={{
              height: '520px',
              backgroundColor: 'var(--color-gray-950)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loadingPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={28} className="animate-spin" color="var(--color-white)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Rendering invoice PDF via Puppeteer...
                </span>
              </div>
            ) : pdfBlobUrl && !isExpired ? (
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                title="Invoice PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
                <AlertTriangle size={32} color="var(--color-gray-500)" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {isExpired
                    ? 'This temporary PDF is no longer valid. Click "Regenerate" above to create a fresh copy.'
                    : 'PDF preview could not be rendered directly in browser iframe.'}
                </p>
                {pdfBlobUrl && !isExpired && (
                  <a
                    href={pdfBlobUrl}
                    download={`invoice-${invoice.invoiceNumber}.pdf`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={14} />
                    <span>Download PDF File</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Email Delivery Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={15} color="var(--color-gray-300)" />
              <span>Recipient Details</span>
            </h4>

            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>To: </span>
                <strong style={{ color: 'var(--color-white)' }}>
                  {invoice?.client?.email || 'Missing Client Email'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Client: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{invoice?.client?.name}</span>
              </div>
              {invoice?.client?.company && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Company: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{invoice.client.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Language Selection (Strictly EN / AR) */}
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={15} color="var(--color-gray-300)" />
              <span>Email Language</span>
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Select language template for the email notification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${language === 'EN' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setLanguage('EN')}
              >
                <span>English (EN)</span>
              </button>
              <button
                type="button"
                className={`btn ${language === 'AR' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setLanguage('AR')}
              >
                <span>العربية (AR)</span>
              </button>
            </div>
          </div>

          {/* CC Optional Field */}
          <div className="card" style={{ padding: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>CC Recipients (Optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="finance@client.com, accountant@client.com"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Separate multiple email addresses with commas.
              </span>
            </div>
          </div>

          {/* Snapshot Summary Info */}
          <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Temporary ID:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {pdfData?.tempPdfId ? `${pdfData.tempPdfId.slice(0, 13)}...` : 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Total Payable:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {invoice?.total} {language === 'AR' && (invoice?.currency === 'EGP' || !invoice?.currency) ? 'ج.م' : (invoice?.currency || 'EGP')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Status:</span>
              <span style={{ textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-primary)' }}>
                {invoice?.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
