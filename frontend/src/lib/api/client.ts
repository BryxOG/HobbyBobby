import { httpUsersClient, USING_MOCK_USERS } from "./http/users";
import { mockClient } from "./mock";
import type { ApiClient } from "./types";

/**
 * The seam between the UI and the backend.
 *
 * Events/chats/map still use mocks. Users go to UserService when
 * NEXT_PUBLIC_USE_MOCK_USERS is not "true".
 */
export const USING_MOCKS = USING_MOCK_USERS;

export const api: ApiClient = USING_MOCK_USERS
  ? mockClient
  : {
      ...mockClient,
      users: httpUsersClient,
    };
