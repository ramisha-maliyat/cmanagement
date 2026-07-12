import Link from "next/link";

import { SubmitButton } from "@/components/auth/submit-button";
import type { MenuCategory } from "@/types";

type MenuCategoryFormProps = {
  action: (formData: FormData) => Promise<void>;
  canteenId: string;
  category?: MenuCategory;
  submitLabel: string;
  pendingLabel: string;
};

export function MenuCategoryForm({
  action,
  canteenId,
  category,
  submitLabel,
  pendingLabel,
}: MenuCategoryFormProps) {
  const menuPath =
    `/vendor/canteens/${canteenId}/menu`;

  return (
    <form action={action} className="space-y-5">
      <input
        type="hidden"
        name="canteenId"
        value={canteenId}
      />

      {category && (
        <input
          type="hidden"
          name="categoryId"
          value={category.id}
        />
      )}

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Category name
        </label>

        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={category?.name ?? ""}
          placeholder="Breakfast"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Category URL name
        </label>

        <input
          id="slug"
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={category?.slug ?? ""}
          placeholder="breakfast"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          Use lowercase letters, numbers and hyphens only.
        </p>
      </div>

      <div>
        <label
          htmlFor="displayOrder"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Display order
        </label>

        <input
          id="displayOrder"
          name="displayOrder"
          type="number"
          required
          min={0}
          max={10000}
          step={1}
          defaultValue={category?.display_order ?? 0}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          Lower numbers appear first.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
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