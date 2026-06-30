export type Provider = "google" | "yandex" | "manual";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone?: string | null;
  provider: Provider;
  preferences?: {
    defaultCurrency: string;
  } | null;
}
