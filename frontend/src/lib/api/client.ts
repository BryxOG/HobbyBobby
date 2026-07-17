import { httpChatsClient, USING_MOCK_CHATS } from "./http/chats";
import { httpEventsClient, USING_MOCK_EVENTS } from "./http/events";
import { httpUsersClient, USING_MOCK_USERS } from "./http/users";
import { mockClient } from "./mock";
import type { ApiClient } from "./types";

/**
 * The seam between the UI and the backend.
 *
 * Users → UserService; events/map/tags → EventService; chats → EventService + WebSocket.
 */
export const USING_MOCKS = USING_MOCK_USERS && USING_MOCK_EVENTS && USING_MOCK_CHATS;

function buildApi(): ApiClient {
  if (USING_MOCKS) {
    return mockClient;
  }

  return {
    events: USING_MOCK_EVENTS ? mockClient.events : httpEventsClient.events,
    map: USING_MOCK_EVENTS ? mockClient.map : httpEventsClient.map,
    tags: USING_MOCK_EVENTS ? mockClient.tags : httpEventsClient.tags,
    users: USING_MOCK_USERS ? mockClient.users : httpUsersClient,
    chats: USING_MOCK_CHATS ? mockClient.chats : httpChatsClient,
  };
}

export const api: ApiClient = buildApi();
