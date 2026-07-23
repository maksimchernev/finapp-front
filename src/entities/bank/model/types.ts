export interface Bank {
  id: string;
  userId: string;
  name: string;
  normalizedName: string;
  keywords: string[];
  lastImportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
