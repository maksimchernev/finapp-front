import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/entities/category/model/types";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { CategoryPayload } from "@/entities/transaction/api/transactionApi";
import {
  addCategoryKeyword,
  canEditCategory,
  categoryColorOptions,
  categoryIconOptions,
  createCategoryForm,
  removeCategoryKeyword,
  toCategoryPayload,
  type CategoryForm,
} from "@/pages/categories/lib/categoryForm";
import { Dialog } from "@/shared/ui/Dialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import styles from "@/pages/categories/ui/CategoriesPage.module.scss";

type CategoryType = "expense" | "income";

export function CategoriesPage({
  categories,
  onCreateCategory,
  onDeleteCategory,
  onUpdateCategory,
}: {
  categories: Category[];
  onCreateCategory: (category: CategoryPayload) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<void>;
  onUpdateCategory: (id: string, category: CategoryPayload) => Promise<Category>;
}) {
  const [activeType, setActiveType] = useState<CategoryType>("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCategories = categories
    .filter((category) => category.type === activeType)
    .sort(compareCategories);
  const isEditable = canEditCategory(editingCategory);

  function openCreateDialog() {
    setEditingCategory(null);
    setForm(createCategoryForm(activeType));
    resetDialogMeta();
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setForm(createCategoryForm(activeType, category));
    resetDialogMeta();
  }

  function closeDialog() {
    if (isSaving) return;

    dismissDialog();
  }

  function dismissDialog() {
    setEditingCategory(null);
    setForm(null);
    resetDialogMeta();
  }

  function updateForm(patch: Partial<CategoryForm>) {
    if (!isEditable) return;

    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function resetDialogMeta() {
    setError(null);
    setIsAddingKeyword(false);
    setKeywordDraft("");
    setIsConfirmingDelete(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !isEditable) return;

    const payload = toCategoryPayload(form);
    if (!payload.nameRu) {
      setError("Введите название категории.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const savedCategory = editingCategory
        ? await onUpdateCategory(editingCategory.id, payload)
        : await onCreateCategory(payload);
      setActiveType(savedCategory.type);
      dismissDialog();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить категорию",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingCategory || editingCategory.isDefault) return;

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onDeleteCategory(editingCategory.id);
      dismissDialog();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить категорию",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function commitKeywordDraft() {
    if (!form || !isEditable) return;

    setForm(addCategoryKeyword(form, keywordDraft));
    setKeywordDraft("");
    setIsAddingKeyword(false);
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitKeywordDraft();
    }
    if (event.key === "Escape") {
      setKeywordDraft("");
      setIsAddingKeyword(false);
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>автокатегоризация</span>
          <h2>Категории</h2>
          <span className={styles.eyebrow}>Правила распознавания операций</span>
        </div>
        <button
          aria-label="Добавить категорию"
          className={styles.iconButton}
          type="button"
          onClick={openCreateDialog}
        >
          <Plus size={20} />
        </button>
      </header>

      <div className={styles.segmented}>
        <button
          className={activeType === "expense" ? styles.selectedSegment : undefined}
          type="button"
          onClick={() => setActiveType("expense")}
        >
          Расход
        </button>
        <button
          className={activeType === "income" ? styles.selectedSegment : undefined}
          type="button"
          onClick={() => setActiveType("income")}
        >
          Доход
        </button>
      </div>

      <section className={styles.categoryList}>
        {visibleCategories.length === 0 ? (
          <EmptyState text="Пока нет категорий этого типа." />
        ) : (
          visibleCategories.map((category) => (
            <button
              className={styles.categoryCard}
              key={category.id}
              type="button"
              onClick={() => openEditDialog(category)}
            >
              <span
                className={styles.categoryIcon}
                style={{ background: category.bgColor, color: category.color }}
              >
                <CategoryIcon icon={category.icon} />
              </span>
              <span className={styles.categoryMain}>
                <span className={styles.categoryTitleRow}>
                  <b>{category.nameRu}</b>
                  <small>
                    {category.isDefault === false ? "Можно удалить" : "Системная"}
                  </small>
                </span>
                <span className={styles.categoryMeta}>
                  {formatKeywordCount(category.keywords.length)}
                </span>
                {category.keywords.length > 0 && (
                  <span className={styles.previewChips}>
                    {category.keywords.slice(0, 2).map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </section>

      {form && (
        <Dialog
          ariaLabelledBy="category-edit-title"
          backdropClassName={styles.backdrop}
          className={styles.dialog}
          onClose={closeDialog}
        >
            <header className={styles.dialogHeader}>
              <div>
                <span>{editingCategory ? "категория" : "новая категория"}</span>
                <h3 id="category-edit-title">
                  {isEditable
                    ? editingCategory
                      ? "Редактировать"
                      : "Создать категорию"
                    : "Системная категория"}
                </h3>
              </div>
              <button
                aria-label="Закрыть"
                className={styles.closeButton}
                type="button"
                onClick={closeDialog}
              >
                <X size={20} />
              </button>
            </header>

            <form className={styles.categoryForm} onSubmit={handleSubmit}>
              {!isEditable && (
                <p className={styles.readOnlyText}>
                  Системные категории нельзя изменять. Создайте свою категорию,
                  если нужны другие правила.
                </p>
              )}

              <label>
                Название
                <input
                  disabled={!isEditable}
                  maxLength={80}
                  placeholder="Например, Питомец"
                  value={form.nameRu}
                  onChange={(event) => updateForm({ nameRu: event.target.value })}
                />
              </label>

              <div className={styles.segmented}>
                <button
                  className={form.type === "expense" ? styles.selectedSegment : undefined}
                  disabled={!isEditable}
                  type="button"
                  onClick={() => updateForm({ type: "expense" })}
                >
                  Расход
                </button>
                <button
                  className={form.type === "income" ? styles.selectedSegment : undefined}
                  disabled={!isEditable}
                  type="button"
                  onClick={() => updateForm({ type: "income" })}
                >
                  Доход
                </button>
              </div>

              <fieldset>
                <legend>Иконка</legend>
                <div className={styles.iconGrid}>
                  {categoryIconOptions.map((icon) => (
                    <button
                      aria-label={icon}
                      className={clsx(
                        styles.optionButton,
                        form.icon === icon && styles.selectedOption,
                      )}
                      disabled={!isEditable}
                      key={icon}
                      type="button"
                      onClick={() => updateForm({ icon })}
                    >
                      <CategoryIcon icon={icon} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Цвет</legend>
                <div className={styles.colorGrid}>
                  {categoryColorOptions.map((option) => (
                    <button
                      aria-label={option.label}
                      className={clsx(
                        styles.colorButton,
                        form.color === option.color && styles.selectedColor,
                      )}
                      disabled={!isEditable}
                      key={option.color}
                      style={{ background: option.bgColor, color: option.color }}
                      type="button"
                      onClick={() =>
                        updateForm({
                          bgColor: option.bgColor,
                          color: option.color,
                        })
                      }
                    >
                      <span />
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Ключевые слова</legend>
                <div className={styles.keywordChips}>
                  {form.keywords.map((keyword) => (
                    <button
                      className={styles.keywordChip}
                      disabled={!isEditable}
                      key={keyword}
                      type="button"
                      onClick={() => setForm(removeCategoryKeyword(form, keyword))}
                    >
                      {keyword}
                      <X size={14} />
                    </button>
                  ))}
                  {isAddingKeyword ? (
                    <input
                      autoFocus
                      className={styles.keywordInput}
                      disabled={!isEditable}
                      maxLength={80}
                      value={keywordDraft}
                      onBlur={commitKeywordDraft}
                      onChange={(event) => setKeywordDraft(event.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                    />
                  ) : (
                    <button
                      aria-label="Добавить ключевое слово"
                      className={styles.addKeyword}
                      disabled={!isEditable}
                      type="button"
                      onClick={() => setIsAddingKeyword(true)}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </fieldset>

              {error && <p className={styles.errorText}>{error}</p>}

              <div className={styles.dialogActions}>
                {editingCategory && editingCategory.isDefault === false && (
                  <button
                    className={styles.deleteButton}
                    disabled={isSaving}
                    type="button"
                    onClick={handleDelete}
                  >
                    <Trash2 size={17} />
                    {isConfirmingDelete ? "Подтвердить удаление" : "Удалить"}
                  </button>
                )}
                <button
                  className={styles.saveButton}
                  disabled={isSaving || !isEditable}
                  type="submit"
                >
                  {isSaving ? "Сохраняю" : "Сохранить"}
                </button>
              </div>
            </form>
        </Dialog>
      )}
    </section>
  );
}

function compareCategories(a: Category, b: Category) {
  return a.nameRu.localeCompare(b.nameRu);
}

function formatKeywordCount(count: number) {
  if (count === 0) return "Нет ключевых слов";
  if (count === 1) return "1 ключевое слово";
  if (count >= 2 && count <= 4) return `${count} ключевых слова`;
  return `${count} ключевых слов`;
}
