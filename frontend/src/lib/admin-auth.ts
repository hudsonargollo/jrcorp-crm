const TOKEN_KEY = "jrcorp_admin_token";
const EMAIL_KEY = "jrcorp_admin_email";

export const adminAuth = {
  save(email: string, token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
  },
  token(): string {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  },
  email(): string {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
