"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, USING_MOCKS } from "./client";
import { useAuth } from "@/lib/stores/auth";
import type {
  ActivityId,
  EventItem,
  EventListQuery,
  MyEventsScope,
  UserProfile,
} from "./types";

export const qk = {
  events: ["events"] as const,
  eventList: (q: EventListQuery) => ["events", "list", q] as const,
  eventDetail: (id: string) => ["events", "detail", id] as const,
  eventsMine: (scope: MyEventsScope) => ["events", "mine", scope] as const,
  publishQuote: ["events", "publish-quote"] as const,
  pins: (q: EventListQuery) => ["map", "pins", q] as const,
  chats: ["chats"] as const,
  messages: (eventId: string) => ["chats", eventId, "messages"] as const,
  me: ["users", "me"] as const,
  tags: ["tags"] as const,
};

/* --- Events ---------------------------------------------------------------- */

export function useEvents(query: EventListQuery = {}) {
  return useInfiniteQuery({
    queryKey: qk.eventList(query),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.events.list({ ...query, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: qk.eventDetail(id),
    queryFn: () => api.events.get(id),
  });
}

export function useMyEvents(scope: MyEventsScope) {
  return useInfiniteQuery({
    queryKey: qk.eventsMine(scope),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.events.mine(scope, { cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function usePublishQuote() {
  return useQuery({
    queryKey: qk.publishQuote,
    queryFn: () => api.events.publishQuote(),
    staleTime: Infinity,
  });
}

/**
 * Join/leave write the fresh event straight into its detail cache so the button
 * flips without a refetch, then invalidate the lists that embed a stale copy.
 */
function useMembershipMutation(action: "join" | "leave") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      action === "join" ? api.events.join(id) : api.events.leave(id),
    onSuccess: (event: EventItem) => {
      qc.setQueryData(qk.eventDetail(event.id), event);
      qc.invalidateQueries({ queryKey: qk.events });
      qc.invalidateQueries({ queryKey: qk.chats });
    },
  });
}

export const useJoinEvent = () => useMembershipMutation("join");
export const useLeaveEvent = () => useMembershipMutation("leave");

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.events.create,
    onSuccess: (event) => {
      qc.setQueryData(qk.eventDetail(event.id), event);
      qc.invalidateQueries({ queryKey: qk.events });
      qc.invalidateQueries({ queryKey: ["map"] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

/* --- Map ------------------------------------------------------------------- */

export function usePins(query: EventListQuery = {}) {
  return useQuery({
    queryKey: qk.pins(query),
    queryFn: () => api.map.pins(query),
    placeholderData: (prev) => prev, // Keep old pins while re-filtering.
  });
}

/* --- Chats ----------------------------------------------------------------- */

export function useChats() {
  return useQuery({ queryKey: qk.chats, queryFn: () => api.chats.list() });
}

export function useMessages(eventId: string) {
  return useQuery({
    queryKey: qk.messages(eventId),
    queryFn: () => api.chats.messages(eventId),
  });
}

export function useSendMessage(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.chats.send(eventId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(eventId) });
      qc.invalidateQueries({ queryKey: qk.chats });
    },
  });
}

/* --- Users ----------------------------------------------------------------- */

export function useMe() {
  const userId = useAuth((s) => s.userId);
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.users.me(),
    enabled: USING_MOCKS || Boolean(userId),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) => api.users.updateMe(patch),
    onSuccess: (profile) => qc.setQueryData(qk.me, profile),
  });
}

export function useSetInterests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (interests: ActivityId[]) => api.users.setInterests(interests),
    onSuccess: (profile) => qc.setQueryData(qk.me, profile),
  });
}

export function useTags() {
  return useQuery({
    queryKey: qk.tags,
    queryFn: () => api.tags.list(),
    staleTime: 5 * 60_000,
  });
}
