import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`flex items-center justify-between px-4 sm:px-6 ${wide ? "h-14" : "h-16"}`}
      >
        <Logo />
        <ThemeToggle />
      </header>
      <main
        className={`flex flex-1 items-start justify-center px-4 ${wide ? "pb-4 pt-0 sm:pt-1" : "pb-16 pt-6 sm:pt-12"}`}
      >
        <div
          className={`w-full ${wide ? "max-w-xl has-[[data-servant=true]]:max-w-3xl" : "max-w-md"}`}
        >
          <div>
            <h1
              className={`font-display font-semibold tracking-tight ${wide ? "text-2xl" : "text-3xl"}`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={
                  wide ? "mt-0.5 text-sm text-muted" : "mt-2 text-muted"
                }
              >
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`rounded-lg border border-line bg-surface shadow-card ${wide ? "mt-3 p-4 sm:p-5" : "mt-8 p-6 sm:p-8"}`}
          >
            {children}
          </div>
          {footer && (
            <p
              className={`text-center text-sm text-muted ${wide ? "mt-3" : "mt-6"}`}
            >
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export const AuthLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className="font-medium text-primary hover:underline">
    {children}
  </Link>
);

export function FormAlert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success";
  children: React.ReactNode;
}) {
  const c =
    tone === "danger"
      ? "border-danger/30 bg-danger/10 text-danger"
      : "border-success/30 bg-success/10 text-success";
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`mb-4 rounded border px-3 py-2 text-sm ${c}`}
    >
      {children}
    </div>
  );
}
