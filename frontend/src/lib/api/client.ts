import { mockClient } from "./mock";
import type { ApiClient } from "./types";

/**
 * The seam between the UI and the backend.
 *
 * Today every call resolves against in-memory fixtures. When EventService and
 * UserService exist, add an `httpClient` implementing `ApiClient` against
 * NEXT_PUBLIC_API_URL and switch here — no screen or hook changes.
 */
export const api: ApiClient = mockClient;

export const USING_MOCKS = true;
