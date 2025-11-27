import type { FritzClient } from "../index.ts";

/**
 * Session information returned after a successful login.
 */
export type SessionInfo = {
  /**
   * The session ID.
   */
  readonly sid: string;
};

/**
 * Interface for authentication handlers.
 */
export type IAuthHandler = {
  /**
   * Logs in to the Fritz!Box device.
   * @param client The FritzClient instance.
   * @returns The session information.
   */
  login(client: FritzClient): Promise<SessionInfo>;

  /**
   * Logs out from the Fritz!Box device.
   * @param client The FritzClient instance.
   * @param session The session information.
   */
  logout(client: FritzClient, session: SessionInfo): Promise<void>;
};
