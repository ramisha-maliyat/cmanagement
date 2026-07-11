export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <section className="w-full max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Canteen Management System
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Welcome to Canteen Management
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600">
          Browse canteens, order food and manage menus from one simple
          platform.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Browse Menu
          </button>

          <button
            type="button"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Vendor Login
          </button>
        </div>
      </section>
    </main>
  );
}