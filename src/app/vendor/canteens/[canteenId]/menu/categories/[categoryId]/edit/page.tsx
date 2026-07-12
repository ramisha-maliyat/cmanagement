import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMenuCategoryAction } from "@/app/actions/menu";
import { AuthMessage } from "@/components/auth/auth-message";
import { MenuCategoryForm } from "@/components/menu/menu-category-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireVendorCanteen } from "@/lib/vendor/vendor-canteen";

type EditCategoryPageProps = {
  params: Promise<{
    canteenId: string;
    categoryId: string;
  }>;

  searchParams: PageSearchParams;
};

export default async function EditCategoryPage({
  params,
  searchParams,
}: EditCategoryPageProps) {
  const {
    canteenId,
    categoryId,
  } = await params;

  const { vendor, canteen } =
    await requireVendorCanteen(canteenId);

  const supabase = await createClient();

  const { data: category, error: queryError } =
    await supabase
      .from("menu_categories")
      .select("*")
      .eq("id", categoryId)
      .eq("canteen_id", canteen.id)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

  if (!queryError && !category) {
    notFound();
  }

  const query = await searchParams;

  const error =
    getQueryValue(query.error) ??
    (queryError
      ? "The menu category could not be loaded."
      : undefined);

  if (!category) {
    return (
      <AuthMessage error={error} />
    );
  }

  return (
    <>
      <Link
        href={`/vendor/canteens/${canteen.id}/menu`}
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← {canteen.name} menu
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Edit {category.name}
        </h1>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <MenuCategoryForm
          action={updateMenuCategoryAction}
          canteenId={canteen.id}
          category={category}
          submitLabel="Save category"
          pendingLabel="Saving category..."
        />
      </section>
    </>
  );
}