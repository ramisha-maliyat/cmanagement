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
            Menu browsing will be added in a later phase.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Current orders
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            You currently have no active orders.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Order history
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Completed orders will appear here.
          </p>
        </section>
      </div>
    </>
  );
}