// Small reusable error banner for forms and data fetches.
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
      {message}
    </div>
  );
}
