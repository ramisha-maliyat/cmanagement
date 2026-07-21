import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">
        Admin dashboard
      </h1>

      <p className="mt-2 text-slate-600">
        Manage vendors, customers, orders and system activity.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Vendor applications
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Approve or reject businesses requesting vendor access.
          </p>

          <Link
            href="/admin/vendors"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Review applications →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Users
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            User-management tools will be added later.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Stock check reports
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View completed and in-progress stock takes for vendor inventory.
          </p>

          <Link
            href="/admin/stock-checks"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            View stock checks →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Platform orders
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            System-wide order reporting will appear here.
          </p>
        </section>
      </div>
    </>
  );
}