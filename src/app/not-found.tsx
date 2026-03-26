import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background min-h-dvh flex">
      <main className="bg-background w-full max-w-[95%] sm:max-w-10/12 mx-auto flex flex-col py-6 sm:py-16">
        <div className="border border-border-custom rounded-lg p-6 sm:p-8 font-mono">
          <p className="text-muted text-xs sm:text-sm mb-2">error://route-not-found</p>
          <h1 className="text-foreground text-2xl sm:text-3xl font-bold mb-2">404</h1>
          <p className="text-foreground/70 text-sm sm:text-base mb-6">
            The page you requested does not exist or was moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              href="/home"
              className="px-4 py-2 border border-foreground text-foreground rounded-md text-sm hover:bg-foreground hover:text-background transition-colors text-center"
            >
              Go to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

