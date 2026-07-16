"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { loginByEmail } from "@/lib/api/http/users";
import { USING_MOCKS } from "@/lib/api/client";
import { qk } from "@/lib/api/hooks";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Упрощённый вход по email — без пароля, пока нет полноценной аутентификации. */
export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUserId = useAuth((s) => s.setUserId);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (USING_MOCKS) {
      router.replace("/menu");
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setError(ru.auth.invalidEmail);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const profile = await loginByEmail(trimmed);
      setUserId(profile.id);
      qc.setQueryData(qk.me, profile);
      router.replace("/menu/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : ru.common.error;
      setError(
        message.includes("не найден") ? ru.auth.notFound : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-8">
      <div className="space-y-6 rounded-card bg-surface p-5">
        <div className="space-y-1 text-center">
          <h1 className="text-[22px] font-bold tracking-tight">
            {ru.auth.title}
          </h1>
          <p className="text-[14px] text-fg-muted">{ru.auth.emailHint}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label={ru.auth.email} error={error ?? undefined}>
            {({ id, "aria-invalid": invalid }) => (
              <input
                id={id}
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                aria-invalid={invalid}
                className={inputClass(invalid)}
              />
            )}
          </Field>

          <Button type="submit" fullWidth loading={loading}>
            {ru.auth.submit}
          </Button>
        </form>

        <p className="text-center text-[14px] text-fg-muted">
          {ru.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-primary">
            {ru.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
