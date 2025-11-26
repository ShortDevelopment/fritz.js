import type { FritzClient } from "../index.ts";

export type SessionInfo = {
  readonly sid: string;
};

export type IAuthHandler = {
  login(client: FritzClient): Promise<SessionInfo>;
  logout(client: FritzClient, session: SessionInfo): Promise<void>;
};
