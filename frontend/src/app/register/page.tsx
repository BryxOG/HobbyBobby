"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { activityIdsToInterestIds, createUser } from "@/lib/api/http/users";
import { USING_MOCKS } from "@/lib/api/client";
import { qk } from "@/lib/api/hooks";
import type { ActivityId } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
import { ActivityGrid } from "@/components/events/ActivityGrid";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Регистрация нового пользователя с выбором интересов. */
export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUserId = useAuth((s) => s.setUserId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<ActivityId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (USING_MOCKS) {
      router.replace("/menu");
    }
  }, [router]);

  function toggleInterest(id: ActivityId) {
    setInterests((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    if (error) setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError(ru.auth.nameRequired);
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(ru.auth.invalidEmail);
      return;
    }
    if (activityIdsToInterestIds(interests).length === 0) {
      setError(ru.auth.interestsRequired);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const profile = await createUser({
        name: trimmedName,
        email: trimmedEmail,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        interests,
      });
      setUserId(profile.id);
      qc.setQueryData(qk.me, profile);
      router.replace("/menu/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : ru.common.error;
      setError(
        message.includes("уже существует")
          ? ru.auth.emailTaken
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
      <div className="space-y-6 rounded-card bg-surface p-5">
        <div className="space-y-1 text-center">
          <h1 className="text-[22px] font-bold tracking-tight">
            {ru.auth.registerTitle}
          </h1>
          <p className="text-[14px] text-fg-muted">{ru.auth.registerHint}</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field label={ru.auth.name} error={error === ru.auth.nameRequired ? error : undefined}>
            {({ id, "aria-invalid": invalid }) => (
              <input
                id={id}
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="name"
                aria-invalid={invalid}
                className={inputClass(invalid)}
              />
            )}
          </Field>

          <Field
            label={ru.auth.email}
            error={
              error === ru.auth.invalidEmail || error === ru.auth.emailTaken
                ? error
                : undefined
            }
          >
            {({ id, "aria-invalid": invalid }) => (
              <input
                id={id}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={invalid}
                className={inputClass(invalid)}
              />
            )}
          </Field>

          <Field label={ru.profile.city}>
            {({ id }) => (
              <input
                id={id}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                className={inputClass()}
              />
            )}
          </Field>

          <Field label={ru.profile.about}>
            {({ id }) => (
              <textarea
                id={id}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={inputClass()}
              />
            )}
          </Field>

          <div className="space-y-3">
            <p className="px-1 text-[13px] font-medium text-fg-muted">
              {ru.interests.title}
            </p>
            <p className="px-1 text-[14px] text-fg-muted">{ru.interests.hint}</p>
            <p className="px-1 text-[13px] font-medium text-fg-muted">
              {ru.interests.count(interests.length)}
            </p>
            <ActivityGrid
              mode="multi"
              selected={interests}
              onSelect={toggleInterest}
            />
            {error === ru.auth.interestsRequired && (
              <p role="alert" className="px-1 text-[13px] text-danger">
                {error}
              </p>
            )}
          </div>

          {error &&
            error !== ru.auth.nameRequired &&
            error !== ru.auth.invalidEmail &&
            error !== ru.auth.emailTaken &&
            error !== ru.auth.interestsRequired && (
              <p role="alert" className="px-1 text-[13px] text-danger">
                {error}
              </p>
            )}

          <Button type="submit" fullWidth loading={loading}>
            {ru.auth.register}
          </Button>
        </form>

        <p className="text-center text-[14px] text-fg-muted">
          {ru.auth.hasAccount}{" "}
          <Link href="/login" className="font-semibold text-primary">
            {ru.auth.submit}
          </Link>
        </p>
      </div>
    </div>
  );
}
