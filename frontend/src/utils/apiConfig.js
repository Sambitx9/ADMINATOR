/**
 * ADMINATOR — Frontend API Configuration
 * Supports production backend URLs via VITE_API_URL or VITE_API_BASE_URL.
 * Defaults to '' for same-domain or local Vite proxy deployments (/api).
 * Security Invariant: Never store backend secrets in VITE environment variables.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

/**
 * Returns full API URL for a given endpoint path.
 * @param {string} endpoint - e.g. '/api/v1/colleges'
 * @returns {string} - e.g. 'https://api.example.com/api/v1/colleges' or '/api/v1/colleges'
 */
export const getApiUrl = (endpoint) => {
  if (!endpoint) return API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export default getApiUrl;
