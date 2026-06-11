export default function LoadingSpinner({ size = 'h-8 w-8' }) {
  return (
    <div
      className={`${size} animate-spin rounded-full border-2 border-white/10 border-t-neon`}
      role="status"
      aria-label="Loading"
    />
  );
}
