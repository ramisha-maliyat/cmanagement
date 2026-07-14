import Link from "next/link";

export default function CustomerDashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">
        Customer dashboard
      </h1>

      <p className="mt-2 text-slate-600">
        Browse canteens, place food orders and track your order
        status.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Browse menu
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View available vendors, canteens and current menu items.
          </p>

          <Link
            href="/vendors"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Browse canteens →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            My orders
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Track current orders and view your order history.
          </p>

          <Link
            href="/customer/orders"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            View my orders →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Sell through CManagement
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Apply to operate a canteen and manage your own menu.
          </p>

          <Link
            href="/customer/vendor-application"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Vendor application →
          </Link>
        </section>
      </div>
    </>
  );
}