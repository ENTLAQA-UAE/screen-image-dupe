// ==============================================================================
// Shared CORS configuration for Qudurat edge functions
// ==============================================================================
// Set ALLOWED_ORIGINS environment variable as a comma-separated list, e.g.:
//   ALLOWED_ORIGINS=https://qudurat.com,https://app.qudurat.com,https://*.qudurat.com
//
// For local development, include http://localhost:5173 and http://localhost:3000.
// ==============================================================================

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Resolve CORS headers for a given request.
 * Checks the request's Origin header against the allowlist.
 * Returns `*` wildcard only as an absolute last resort (never in production).
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();

  // Exact match
  let allowOrigin = allowed.includes(origin) ? origin : "";

  // Wildcard subdomain match (e.g., *.qudurat.com)
  if (!allowOrigin) {
    for (const pattern of allowed) {
      if (pattern.startsWith("https://*.")) {
        const suffix = pattern.slice("https://*.".length);
        if (origin.startsWith("https://") && origin.endsWith(`.${suffix}`)) {
          allowOrigin = origin;
          break;
        }
      }
    }
  }

  // If origin is not allowed, return headers that will cause a CORS error
  // (browser will block the response). This is the secure default.
  if (!allowOrigin) {
    allowOrigin = allowed[0] ?? "";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Call at the top of every edge function.
 */
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
  return null;
}
