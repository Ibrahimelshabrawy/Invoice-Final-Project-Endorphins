import * as invoiceEmailService from '../services/invoiceEmail.service.js';

/**
 * Retries sending a failed invoice email.
 * Accepts tempPdfId and language, processes in background via EventEmitter.
 * Returns 202 Accepted.
 */
export const retryEmail = async (req, res) => {
  const result = await invoiceEmailService.retryInvoiceEmail({
    emailLogId: req.params.id,
    tempPdfId: req.body?.tempPdfId,
    language: req.body?.language,
  });

  return res.status(202).json({
    message: 'Invoice email retry request accepted',
    data: result,
  });
};

/**
 * Retrieves all email logs for a specific invoice.
 */
export const getInvoiceEmailLogs = async (req, res) => {
  const logs = await invoiceEmailService.getInvoiceEmailLogs(req.params.id);

  return res.status(200).json({
    message: 'Invoice email logs retrieved successfully',
    data: logs,
  });
};

export default {
  retryEmail,
  getInvoiceEmailLogs,
};
