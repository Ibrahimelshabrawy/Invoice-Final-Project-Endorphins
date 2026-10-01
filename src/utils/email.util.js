import { EmailLog } from '../models/index.js';
import { renderPredefinedEmailTemplate } from '../services/templateRender.service.js';
import * as mailService from '../services/mail.service.js';
import * as tempPdfService from '../services/tempPdf.service.js';
import { EmailStatusEnum } from '../utils/enum/emailStatus.enum.js';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';

/**
 * Background worker task for sending invoice email:
 * 1. Validates recipient
 * 2. Validates tempPdfId
 * 3. Reads existing temporary PDF from server filesystem (ZERO PDF generation logic)
 * 4. If missing/expired -> logs FAILED and stops without regenerating
 * 5. Selects predefined template based on language ('EN' or 'AR')
 * 6. Replaces supported placeholders with invoice data
 * 7. Sends email with the existing temporary PDF attached
 * 8. Creates EmailLog (SENT or FAILED based on info.accepted?.length > 0)
 * 9. Updates invoice status to SENT upon success
 * 10. Deletes the temporary PDF in finally block
 * 
 * @param {Object} params
 * @param {Object} params.invoice
 * @param {string} [params.recipient]
 * @param {Array<string>|null} [params.cc]
 * @param {string} [params.language='EN']
 * @param {string} params.tempPdfId
 * @returns {Promise<{ emailLog: Object, success: boolean }>}
 */
export const executeBackgroundSendInvoice = async ({
    invoice,
    recipient,
    cc,
    language = 'EN',
    tempPdfId,
}) => {
    const normalizedLang = String(language || 'EN').toUpperCase();
    const cleanCc = Array.isArray(cc) && cc.length > 0 ? cc : (typeof cc === 'string' && cc.trim() ? [cc.trim()] : null);
    const toRecipient = recipient || invoice.client?.email?.trim() || '';

    try {
        // 1. Validate primary recipient email
        if (!toRecipient) {
            const errorMsg = 'Client does not have a valid email address';
            const emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: '',
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: errorMsg,
            });
            return { emailLog, success: false };
        }

        // 2. Validate tempPdfId presence
        if (!tempPdfId || typeof tempPdfId !== 'string' || !tempPdfId.trim()) {
            const errorMsg = 'Temporary PDF ID is required. Please generate and preview the PDF first.';
            const emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: errorMsg,
            });
            return { emailLog, success: false };
        }

        // 3. Read existing temporary PDF from storage (NEVER regenerate or create fallback)
        const pdfBuffer = await tempPdfService.readTempPdf(tempPdfId);

        // 4. If missing or expired: fail immediately with clear error
        if (!pdfBuffer) {
            const errorMsg = 'Temporary PDF not found or expired. Please generate a new PDF.';
            const emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: errorMsg,
            });
            return { emailLog, success: false };
        }

        // 5 & 6. Select predefined template based on language and replace placeholders
        let renderedHtml;
        try {
            renderedHtml = renderPredefinedEmailTemplate(invoice, normalizedLang);
        } catch (templateErr) {
            const emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: templateErr.message,
            });
            return { emailLog, success: false };
        }

        // 7. Send email with the existing temporary PDF as attachment
        const subject = normalizedLang === 'AR'
            ? `${invoice.invoiceNumber} :فاتورة رقم `
            : `Invoice ${invoice.invoiceNumber}`;
        const filename = `invoice-${invoice.invoiceNumber}.pdf`;

        let info = null;
        let sendError = null;

        try {
            info = await mailService.sendEmail({
                to: toRecipient,
                cc: cleanCc,
                subject,
                html: renderedHtml,
                attachments: [
                    {
                        filename,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            });
        } catch (smtpErr) {
            sendError = smtpErr;
        }

        // 8. Determine success based on info.accepted?.length > 0
        const isAccepted = Boolean(!sendError && info && info.accepted && info.accepted.length > 0);

        let emailLog;
        if (isAccepted) {
            emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.SENT,
                error: null,
            });

            // 9. Update invoice status to SENT upon success
            if (invoice.status !== InvoiceStatusEnum.PAID) {
                invoice.status = InvoiceStatusEnum.SENT;
                await invoice.save();
            }
        } else {
            const errorMsg = sendError
                ? (sendError.message || 'SMTP send failure')
                : 'SMTP server did not accept any recipients';

            emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: errorMsg,
            });
        }

        return { emailLog, success: isAccepted };
    } catch (error) {
        console.error('[BACKGROUND EMAIL ERROR]:', error.message || error);
        try {
            const emailLog = await EmailLog.create({
                invoiceId: invoice.id,
                recipient: toRecipient,
                cc: cleanCc,
                sentAt: new Date(),
                status: EmailStatusEnum.FAILED,
                error: error.message || 'Unknown background send error',
            });
            return { emailLog, success: false };
        } catch (logErr) {
            return { emailLog: null, success: false };
        }
    } finally {
        // 10. Delete the temporary PDF immediately after Send completes or fails
        if (tempPdfId) {
            await tempPdfService.deleteTempPdf(tempPdfId);
        }
    }
};

export default {
    executeBackgroundSendInvoice,
};