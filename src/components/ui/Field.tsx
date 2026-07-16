"use client";

import { cn } from "@/lib/cn";
import { useId, type ReactNode } from "react";

interface Props {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean }) => ReactNode;
}

export function Field({ label, error, hint, children }: Props) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block px-1 text-[13px] font-medium text-fg-muted">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error) })}
      {error ? (
        <p role="alert" className="px-1 text-[13px] text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="px-1 text-[13px] text-fg-muted">{hint}</p>
      )}
    </div>
  );
}

export const inputClass = (invalid?: boolean) =>
  cn(
    "w-full rounded-xl bg-surface px-3 py-2.5 text-[16px] text-fg",
    "placeholder:text-fg-muted",
    "focus:ring-2 focus:ring-primary focus:outline-none",
    invalid && "ring-2 ring-danger",
  );
