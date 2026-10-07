import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="space-y-1 text-center">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          aria-label="Mr.Anime home"
        >
          Mr<span className="text-sky-500">.</span>Anime
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        {children}
      </div>

      {footer ? (
        <div className="text-center text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}

export function FormMessage({
  message,
  success,
}: {
  message?: string;
  success?: string;
}) {
  if (!message && !success) return null;
  return (
    <p
      role={message ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${
        message
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {message ?? success}
    </p>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {errors[0]}
    </p>
  );
}
