import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#e2e5ea] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold leading-tight sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-[#5c6570] sm:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e5ea] bg-white">{children}</div>
  );
}
