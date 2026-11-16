import crypto from 'node:crypto';

/**
 * Generates an institutional enquiry tracking ID
 * Format: ADM-YYYYMMDD-XXXX (e.g. ADM-20261115-9E3B)
 */
export const generateTrackingId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;
  const randomSegment = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `ADM-${dateSegment}-${randomSegment}`;
};
