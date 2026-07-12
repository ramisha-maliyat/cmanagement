import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-9">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-bold text-emerald-700"
        >
          CManagement
        </Link>

        {children}
      </section>
    </main>
  );
}