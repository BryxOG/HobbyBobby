import { httpChatsClient, USING_MOCK_CHATS } from "./http/chats";
import { httpUsersClient, USING_MOCK_USERS } from "./http/users";
import { mockClient } from "./mock";
import type { ApiClient } from "./types";

/**
 * The seam between the UI and the backend.
 *
 * Users → UserService; chats → EventService + realtime WebSocket.
 * Events/map/tags остаются на моках до готовности EventService.
 */
export const USING_MOCKS = USING_MOCK_USERS;

function buildApi(): ApiClient {
  if (USING_MOCK_USERS && USING_MOCK_CHATS) {
    return mockClient;
  }

  return {
    ...mockClient,
    users: USING_MOCK_USERS ? mockClient.users : httpUsersClient,
    chats: USING_MOCK_CHATS ? mockClient.chats : httpChatsClient,
  };
}

export const api: ApiClient = buildApi();
