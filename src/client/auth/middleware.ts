import type { IAuthHandler, SessionInfo } from "./handler.ts";
import type { Middleware } from "../index.ts";

/**
 * Middleware that handles authentication using the provided handler.
 * @param handler The authentication handler to use.
 * @returns A middleware function that manages authentication.
 */
export const auth = (handler: IAuthHandler): Middleware => {
  let session: SessionInfo | null = null;

  return {
    async request(request, next, nextClient) {
      if (!session) {
        session = await handler.login(nextClient);
      }

      request.url = new URL(request.url);
      request.url.searchParams.set("sid", session.sid);

      if (request.body instanceof URLSearchParams) {
        request.body.set("sid", session.sid);
      }

      return await next(request);
    },
    async dispose(base) {
      if (session) {
        await handler.logout(base, session);
        session = null;
      }
    },
  };
};
