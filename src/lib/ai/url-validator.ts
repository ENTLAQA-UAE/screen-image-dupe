/**
 * SSRF protection for user-provided AI provider base URLs.
 *
 * Validates that the URL is:
 * - A valid HTTPS URL (or HTTP only for localhost in development)
 * - Not pointing to internal/private IP ranges
 * - Not pointing to cloud metadata endpoints
 *
 * This prevents Server-Side Request Forgery where a malicious org admin
 * could set their AI base URL to an internal service endpoint.
 */

const BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.google.com',
  '169.254.169.254', // AWS/GCP metadata
  '100.100.100.200', // Alibaba metadata
  'fd00::',
]);

const PRIVATE_IP_PATTERNS = [
  /^127\./,           // loopback
  /^10\./,            // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,  // Class B private
  /^192\.168\./,      // Class C private
  /^0\./,             // "this" network
  /^169\.254\./,      // link-local
  /^fc00:/i,          // IPv6 unique local
  /^fe80:/i,          // IPv6 link-local
  /^::1$/,            // IPv6 loopback
];

export function validateAiBaseUrl(urlString: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  // Empty is fine — adapter uses its default URL
  if (!urlString || urlString.trim() === '') {
    return { valid: true };
  }

  let url: URL;
  try {
    url = new URL(urlString.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Must be HTTPS in production (allow HTTP for localhost in dev)
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (url.protocol !== 'https:') {
    if (!(isDev && isLocalhost && url.protocol === 'http:')) {
      return {
        valid: false,
        error: 'Base URL must use HTTPS',
      };
    }
  }

  // Block known metadata endpoints
  if (BLOCKED_HOSTS.has(url.hostname)) {
    return {
      valid: false,
      error: 'This hostname is not allowed',
    };
  }

  // Block private IP ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(url.hostname)) {
      // Allow localhost in development only
      if (isDev && isLocalhost) continue;
      return {
        valid: false,
        error: 'Private/internal IP addresses are not allowed',
      };
    }
  }

  // Strip trailing slash for consistency
  const sanitized = url.origin + url.pathname.replace(/\/+$/, '');

  return { valid: true, sanitized };
}
