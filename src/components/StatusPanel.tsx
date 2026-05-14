import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type StatusPanelProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function StatusPanel({ title, eyebrow, children, className }: StatusPanelProps) {
  return (
    <section className={cn("rounded-md border border-border bg-surface p-5", className)}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  );
}
