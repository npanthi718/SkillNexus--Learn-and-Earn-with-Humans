export const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "/api";

export const FRONTEND_ORIGIN =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PUBLIC_ORIGIN) ||
  (typeof window !== "undefined" ? window.location.origin : "");
