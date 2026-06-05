/**
 * Thin auth helpers — persists token + tenantId in localStorage.
 * Replace with a proper session/cookie approach for production.
 */

const TOKEN_KEY = "jrcorp_token";
const TENANT_KEY = "jrcorp_tenant";

export const auth = {
  save(tenantId: string, token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TENANT_KEY, tenantId);
  },
  token(): string {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  },
  tenantId(): string {
    return localStorage.getItem(TENANT_KEY) ?? "";
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
