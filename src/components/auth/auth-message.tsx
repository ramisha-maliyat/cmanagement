type AuthMessageProps = {
  error?: string;
  message?: string;
};

export function AuthMessage({
  error,
  message,
}: AuthMessageProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </div>
    );
  }

  if (message) {
    return (
      <div
        role="status"
        className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        {message}
      </div>
    );
  }

  return null;
}