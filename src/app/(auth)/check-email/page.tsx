import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        ✉
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        Check your email
      </h1>

      <p className="mt-3 leading-7 text-slate-600">
        We sent you a confirmation link. Open the email and confirm
        your address to activate your CManagement account.
      </p>

      <p className="mt-4 text-sm text-slate-500">
        Check your spam or junk folder if the email is not visible.
      </p>

      <Link
        href="/login"
        className="mt-7 inline-block font-semibold text-emerald-700 hover:underline"
      >
        Return to sign in
      </Link>
    </div>
  );
}