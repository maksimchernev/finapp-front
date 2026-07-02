import type { Category } from "@/entities/category/model/types";

export type CategoryForm = {
  nameRu: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  bgColor: string;
  keywords: string[];
};

export type CategoryPayload = CategoryForm;

const defaultByType: Record<CategoryForm["type"], Pick<CategoryForm, "bgColor" | "color" | "icon">> = {
  expense: {
    bgColor: "#FAECE7",
    color: "#D85A30",
    icon: "shopping-cart",
  },
  income: {
    bgColor: "#E1F5EE",
    color: "#1D9E75",
    icon: "cash",
  },
};

export const categoryIconOptions = [
  "shopping-cart",
  "coffee",
  "bus",
  "cash",
  "briefcase",
  "credit-card",
  "heartbeat",
  "movie",
  "chart",
  "plus",
] as const;

export const categoryColorOptions = [
  { bgColor: "#FAECE7", color: "#D85A30", label: "Коралл" },
  { bgColor: "#E1F5EE", color: "#1D9E75", label: "Зеленый" },
  { bgColor: "#E6F1FB", color: "#378ADD", label: "Синий" },
  { bgColor: "#EEEDFE", color: "#7F77DD", label: "Лавандовый" },
  { bgColor: "#FBEAF0", color: "#D4537E", label: "Розовый" },
  { bgColor: "#F3E8DA", color: "#8B5E34", label: "Коричневый" },
] as const;

export function createCategoryForm(
  type: CategoryForm["type"],
  category?: Category | null,
): CategoryForm {
  if (category) {
    return {
      bgColor: category.bgColor,
      color: category.color,
      icon: category.icon,
      keywords: [...category.keywords],
      nameRu: category.nameRu,
      type: category.type,
    };
  }

  return {
    ...defaultByType[type],
    keywords: [],
    nameRu: "",
    type,
  };
}

export function canEditCategory(category: Category | null) {
  return !category || category.isDefault === false;
}

export function addCategoryKeyword(form: CategoryForm, keyword: string): CategoryForm {
  const nextKeyword = normalizeCategoryKeyword(keyword);
  if (!nextKeyword || form.keywords.includes(nextKeyword)) return form;

  return {
    ...form,
    keywords: [...form.keywords, nextKeyword],
  };
}

export function removeCategoryKeyword(
  form: CategoryForm,
  keyword: string,
): CategoryForm {
  return {
    ...form,
    keywords: form.keywords.filter((item) => item !== keyword),
  };
}

export function toCategoryPayload(form: CategoryForm): CategoryPayload {
  return {
    bgColor: form.bgColor,
    color: form.color,
    icon: form.icon,
    keywords: normalizeCategoryKeywords(form.keywords),
    nameRu: form.nameRu.trim().replace(/\s+/g, " "),
    type: form.type,
  };
}

function normalizeCategoryKeyword(keyword: string) {
  return keyword.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeCategoryKeywords(keywords: string[]) {
  return [...new Set(keywords.map(normalizeCategoryKeyword).filter(Boolean))];
}
