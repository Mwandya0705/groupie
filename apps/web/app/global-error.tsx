"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-slate-600">{error.message}</p>
          <button onClick={reset} className="mt-4 rounded bg-slate-800 px-4 py-2 text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
