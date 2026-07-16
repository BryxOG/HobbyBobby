import { eventRequest } from "./eventRequest";

/**
 * Синхронизирует участие в ивенте с EventService (доступ к чату).
 */
export const httpEventMembership = {
  async join(eventId: string): Promise<void> {
    await eventRequest<void>(`/events/${eventId}/join`, { method: "POST" });
  },

  async leave(eventId: string): Promise<void> {
    await eventRequest<void>(`/events/${eventId}/leave`, { method: "POST" });
  },
};
