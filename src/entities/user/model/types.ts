export type Provider = "google" | "yandex" | "manual";
export type RecognitionMethod = "tesseract" | "ai";
export type UserPreferences = {
  defaultCurrency: string;
  recognitionMethod?: RecognitionMethod;
  aiRecognitionConsent?: boolean | null;
};

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone?: string | null;
  provider: Provider;
  aiTestAccess?: boolean;
  preferences?: UserPreferences | null;
}
