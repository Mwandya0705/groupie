export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-inkmuted">The requested dashboard route does not exist.</p>
      <a href="/dashboard" className="mt-4 rounded bg-surface2 px-4 py-2 text-ink">
        Go to dashboard
      </a>
    </main>
  );
}
