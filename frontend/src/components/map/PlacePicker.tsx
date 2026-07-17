"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { EventLocation } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { resolvePlaceByAddress, resolvePlaceByUri } from "@/lib/geo/client";
import { usePlaceSuggestions } from "@/lib/geo/hooks";
import type { PlaceSuggestion } from "@/lib/geo/types";
import { ru } from "@/lib/i18n/ru";
import { useDebounced } from "@/lib/useDebounced";
import { inputClass } from "@/components/ui/Field";

interface Props {
  id: string;
  "aria-invalid": boolean;
  value: EventLocation | null;
  near?: { lat: number; lng: number } | null;
  invalid?: boolean;
  onChange: (location: EventLocation) => void;
}

/**
 * Поле выбора места с подсказками Yandex Suggest.
 */
export function PlacePicker({
  id,
  "aria-invalid": ariaInvalid,
  value,
  near,
  invalid,
  onChange,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sessionToken] = useState(() => crypto.randomUUID());

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value?.address ?? "");
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedDraft = useDebounced(draft, 300);
  const displayValue = focused ? draft : (value?.address ?? "");

  const suggestionsQuery = usePlaceSuggestions(debouncedDraft, {
    enabled: focused,
    sessionToken,
    near: near ?? undefined,
  });

  const suggestions = suggestionsQuery.data ?? [];
  const showDropdown =
    focused &&
    open &&
    debouncedDraft.trim().length >= 2 &&
    (suggestionsQuery.isFetching || suggestions.length > 0 || suggestionsQuery.isError);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function pickSuggestion(item: PlaceSuggestion) {
    setResolving(true);
    setResolveError(null);
    try {
      const place = item.uri
        ? await resolvePlaceByUri(item.uri)
        : await resolvePlaceByAddress(item.title);
      if (!place) {
        setResolveError(ru.create.placeResolveError);
        return;
      }
      setDraft(place.address);
      onChange(place);
      setOpen(false);
      setActiveIndex(-1);
    } catch {
      setResolveError(ru.create.placeResolveError);
    } finally {
      setResolving(false);
    }
  }

  function onInputChange(next: string) {
    setDraft(next);
    setOpen(true);
    setResolveError(null);
    setActiveIndex(-1);
    onChange({
      lat: value?.lat ?? near?.lat ?? 55.7558,
      lng: value?.lng ?? near?.lng ?? 37.6173,
      address: next,
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void pickSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="search"
        role="combobox"
        aria-invalid={ariaInvalid}
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={displayValue}
        disabled={resolving}
        placeholder={ru.create.detailsPlacePlaceholder}
        onFocus={() => {
          setFocused(true);
          setDraft(value?.address ?? "");
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setOpen(false);
        }}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          inputClass(Boolean(invalid)),
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />

      {(suggestionsQuery.isFetching || resolving) && (
        <p className="px-1 pt-1 text-[12px] text-fg-muted">
          {resolving ? ru.create.placeResolving : ru.create.placeSearching}
        </p>
      )}

      {(resolveError || suggestionsQuery.isError) && (
        <p role="alert" className="px-1 pt-1 text-[12px] text-danger">
          {resolveError ?? ru.create.placeSuggestError}
        </p>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl bg-bg py-1 shadow-xl ring-1 ring-border"
        >
          {suggestions.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left",
                  index === activeIndex ? "bg-surface" : "hover:bg-surface/80",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pickSuggestion(item)}
              >
                <p className="truncate text-[15px] font-medium">{item.title}</p>
                {item.subtitle && (
                  <p className="truncate text-[12px] text-fg-muted">{item.subtitle}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown &&
        !suggestionsQuery.isFetching &&
        suggestions.length === 0 &&
        !suggestionsQuery.isError && (
          <p className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl bg-bg px-3 py-2 text-[13px] text-fg-muted shadow-xl ring-1 ring-border">
            {ru.create.placeNotFound}
          </p>
        )}
    </div>
  );
}
