import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";


export function RouteErrorFallback({
  error,
  reset,
  title = "This page didn't load",
  description = "Something went wrong on our end. You can try again or head back home.",
  boundary = "tanstack_route_error_component",
}: {
  error: Error;
  reset: () => void;
  title?: string;
  description?: string;
  boundary?: string;
}) {
  const router = useRouter();
  // eslint-disable-next-line no-console
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary });
  }, [error, boundary]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export function RouteNotFoundFallback({
  title = "We couldn't find that",
  description = "The page or item you're looking for doesn't exist anymore.",
  homeHref = "/",
  homeLabel = "Go home",
}: {
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
} = {}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          <a
            href={homeHref}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {homeLabel}
          </a>
        </div>

      </div>
    </div>
  );
}
