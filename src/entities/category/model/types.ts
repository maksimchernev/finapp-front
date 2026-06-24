export interface Category {
  id: string;
  name: string;
  nameRu: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "expense" | "income";
  keywords: string[];
}
