const configuredApiUrl = import.meta.env.VITE_DIRECT_API_URL;

export const API_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, "") : "";
