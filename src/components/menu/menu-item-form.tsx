import Link from "next/link";

import { SubmitButton } from "@/components/auth/submit-button";
import type {
  MenuCategory,
  MenuItem,
} from "@/types";

type MenuItemFormProps = {
  action: (formData: FormData) => Promise<void>;
  canteenId: string;
  categories: MenuCategory[];
  menuItem?: MenuItem;
  defaultCategoryId?: string;
  submitLabel: string;
  pendingLabel: string;
};

export function MenuItemForm({
  action,
  canteenId,
  categories,
  menuItem,
  defaultCategoryId,
  submitLabel,
  pendingLabel,
}: MenuItemFormProps) {
  const menuPath =
    `/vendor/canteens/${canteenId}/menu`;

  return (
    <form
      action={action}
      className="grid gap-5 md:grid-cols-2"
    >
      <input
        type="hidden"
        name="canteenId"
        value={canteenId}
      />

      {menuItem && (
        <input
          type="hidden"
          name="menuItemId"
          value={menuItem.id}
        />
      )}

      <div className="md:col-span-2">
        <label
          htmlFor="categoryId"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Menu category
        </label>

        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={
            menuItem?.category_id ??
            defaultCategoryId ??
            categories[0]?.id
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
              {!category.is_active ? " — inactive" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Item name
        </label>

        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={menuItem?.name ?? ""}
          placeholder="Chicken Burger"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Item URL name
        </label>

        <input
          id="slug"
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={menuItem?.slug ?? ""}
          placeholder="chicken-burger"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Price
        </label>

        <input
          id="price"
          name="price"
          type="number"
          required
          min={0}
          max={999999.99}
          step="0.01"
          defaultValue={
            menuItem?.price?.toString() ?? ""
          }
          placeholder="9.50"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="preparationMinutes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Preparation time in minutes
        </label>

        <input
          id="preparationMinutes"
          name="preparationMinutes"
          type="number"
          required
          min={0}
          max={1440}
          step={1}
          defaultValue={
            menuItem?.preparation_minutes ?? 10
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="stockQuantity"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Stock quantity
        </label>

        <input
          id="stockQuantity"
          name="stockQuantity"
          type="number"
          required
          min={0}
          max={1000000}
          step={1}
          defaultValue={
            menuItem?.stock_quantity ?? 0
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="flex items-center">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 py-3">
          <input
            name="trackStock"
            type="checkbox"
            defaultChecked={
              menuItem?.track_stock ?? false
            }
            className="h-4 w-4"
          />

          <span className="text-sm font-medium text-slate-700">
            Track stock for this item
          </span>
        </label>
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="imageUrl"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Image URL{" "}
          <span className="text-slate-400">
            (optional)
          </span>
        </label>

        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          maxLength={2048}
          defaultValue={menuItem?.image_url ?? ""}
          placeholder="https://example.com/chicken-burger.jpg"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          defaultValue={menuItem?.description ?? ""}
          placeholder="Describe the food, ingredients and serving size."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
        <div className="sm:w-56">
          <SubmitButton pendingText={pendingLabel}>
            {submitLabel}
          </SubmitButton>
        </div>

        <Link
          href={menuPath}
          className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}