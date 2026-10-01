import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const TEMP_PDF_LIFETIME_MINUTES = 30;
export const TEMP_PDF_LIFETIME_SECONDS = TEMP_PDF_LIFETIME_MINUTES * 60;

const TEMP_DIR = path.resolve(process.cwd(), 'temp', 'invoices');

/**
 * Ensures the temporary invoices directory exists.
 */
export const ensureTempDir = async () => {
  if (!fs.existsSync(TEMP_DIR)) {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
};

/**
 * Saves a generated PDF buffer to the temporary directory with expiration metadata.
 * 
 * @param {Buffer} pdfBuffer 
 * @param {number|string} [invoiceId] 
 * @returns {Promise<{ tempPdfId: string, filePath: string, expiresAt: string, expiresInSeconds: number }>}
 */
export const saveTempPdf = async (pdfBuffer, invoiceId) => {
  await ensureTempDir();

  const tempPdfId = crypto.randomUUID();
  const filePath = path.join(TEMP_DIR, `${tempPdfId}.pdf`);

  await fs.promises.writeFile(filePath, pdfBuffer);

  const expiresAt = new Date(Date.now() + TEMP_PDF_LIFETIME_MINUTES * 60 * 1000).toISOString();

  return {
    tempPdfId,
    filePath,
    expiresAt,
    expiresInSeconds: TEMP_PDF_LIFETIME_SECONDS,
  };
};

/**
 * Resolves the full path to a temporary PDF by identifier.
 * Returns null if identifier is invalid or file does not exist.
 * 
 * @param {string} tempPdfId 
 * @returns {string|null}
 */
export const getTempPdfPath = (tempPdfId) => {
  if (!tempPdfId || typeof tempPdfId !== 'string') {
    return null;
  }

  // Prevent directory traversal
  const sanitizedId = tempPdfId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedId) return null;

  const filePath = path.join(TEMP_DIR, `${sanitizedId}.pdf`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return filePath;
};

const inUseTempPdfs = new Set();

/**
 * Checks if a temporary PDF is currently locked in an active send operation.
 * 
 * @param {string} tempPdfId 
 * @returns {boolean}
 */
export const isTempPdfInUse = (tempPdfId) => inUseTempPdfs.has(tempPdfId);

/**
 * Marks a temporary PDF as currently being processed in an active send operation.
 * 
 * @param {string} tempPdfId 
 */
export const markTempPdfInUse = (tempPdfId) => {
  if (tempPdfId) inUseTempPdfs.add(tempPdfId);
};

/**
 * Releases a temporary PDF from the active in-use set.
 * 
 * @param {string} tempPdfId 
 */
export const releaseTempPdfInUse = (tempPdfId) => {
  if (tempPdfId) inUseTempPdfs.delete(tempPdfId);
};

/**
 * Checks whether a temporary PDF exists, has not expired, and is not currently locked.
 * 
 * @param {string} tempPdfId 
 * @returns {Promise<boolean>}
 */
export const isTempPdfValid = async (tempPdfId) => {
  if (!tempPdfId || inUseTempPdfs.has(tempPdfId)) {
    return false;
  }

  const filePath = getTempPdfPath(tempPdfId);
  if (!filePath) {
    return false;
  }

  try {
    const stats = await fs.promises.stat(filePath);
    const maxAgeMs = TEMP_PDF_LIFETIME_MINUTES * 60 * 1000;
    if (Date.now() - stats.mtimeMs > maxAgeMs) {
      await fs.promises.unlink(filePath).catch(() => {});
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Reads a temporary PDF from disk and returns its Buffer if not expired.
 * If expired or missing, returns null.
 * 
 * @param {string} tempPdfId 
 * @returns {Promise<Buffer|null>}
 */
export const readTempPdf = async (tempPdfId) => {
  const filePath = getTempPdfPath(tempPdfId);
  if (!filePath) {
    return null;
  }

  try {
    const stats = await fs.promises.stat(filePath);
    const maxAgeMs = TEMP_PDF_LIFETIME_MINUTES * 60 * 1000;
    if (Date.now() - stats.mtimeMs > maxAgeMs) {
      // File has expired; delete it safely and return null
      await fs.promises.unlink(filePath).catch(() => {});
      return null;
    }

    return await fs.promises.readFile(filePath);
  } catch (error) {
    return null;
  }
};

/**
 * Deletes a temporary PDF from disk and releases in-use lock.
 * Safely ignores missing files or deletion errors.
 * 
 * @param {string} tempPdfId 
 * @returns {Promise<boolean>}
 */
export const deleteTempPdf = async (tempPdfId) => {
  if (!tempPdfId || typeof tempPdfId !== 'string') {
    return false;
  }

  inUseTempPdfs.delete(tempPdfId);

  const sanitizedId = tempPdfId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedId) return false;

  const filePath = path.join(TEMP_DIR, `${sanitizedId}.pdf`);

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (error) {
    // Safely ignore deletion errors
  }

  return false;
};

/**
 * Scans the temporary invoices directory and deletes files older than maxAgeMinutes.
 * 
 * @param {number} [maxAgeMinutes=TEMP_PDF_LIFETIME_MINUTES] 
 * @returns {Promise<number>} Number of deleted files
 */
export const cleanupExpiredTempPdfs = async (maxAgeMinutes = TEMP_PDF_LIFETIME_MINUTES) => {
  if (!fs.existsSync(TEMP_DIR)) {
    return 0;
  }

  let deletedCount = 0;
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  const now = Date.now();

  try {
    const files = await fs.promises.readdir(TEMP_DIR);

    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;

      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.promises.stat(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      } catch (err) {
        // File may have been removed concurrently; ignore safely
      }
    }
  } catch (err) {
    // Directory access error; ignore safely
  }

  return deletedCount;
};

let cleanupInterval = null;

/**
 * Starts periodic background scanning and cleanup for expired temporary PDFs.
 * 
 * @param {number} [intervalMinutes=5] Frequency of cleanup
 * @param {number} [maxAgeMinutes=TEMP_PDF_LIFETIME_MINUTES] Expiration lifetime
 */
export const startPeriodicCleanup = (intervalMinutes = 5, maxAgeMinutes = TEMP_PDF_LIFETIME_MINUTES) => {
  if (cleanupInterval) return;

  // Run initial cleanup
  cleanupExpiredTempPdfs(maxAgeMinutes).catch(() => {});

  cleanupInterval = setInterval(() => {
    cleanupExpiredTempPdfs(maxAgeMinutes).catch(() => {});
  }, intervalMinutes * 60 * 1000);

  // Unref so timer does not prevent process termination
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
};

/**
 * Stops periodic cleanup interval (useful for tests).
 */
export const stopPeriodicCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

export default {
  TEMP_PDF_LIFETIME_MINUTES,
  TEMP_PDF_LIFETIME_SECONDS,
  ensureTempDir,
  saveTempPdf,
  getTempPdfPath,
  isTempPdfValid,
  isTempPdfInUse,
  markTempPdfInUse,
  releaseTempPdfInUse,
  readTempPdf,
  deleteTempPdf,
  cleanupExpiredTempPdfs,
  startPeriodicCleanup,
  stopPeriodicCleanup,
};
