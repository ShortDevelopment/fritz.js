/**
 * Module for managing users on the Fritz!Box.
 *
 * @example
 * ```ts
 * import { FritzClient } from "@shortdev/fritz";
 * import { listUsers, lastActiveUser } from "@shortdev/fritz/users";
 *
 * await using client = new FritzClient("http://fritz.box");
 * const users = await listUsers(client);
 * for (const user of users) {
 *   console.log(`User: ${user.name} ${user.wasLastActive ? "(last active)" : ""}`);
 * }
 * ```
 *
 * @module
 */

import type { FritzClient } from "./client/index.ts";
import { RequestSid } from "./client/protocol/login-sid.ts";

/**
 * Represents a user registered on the Fritz!Box.
 */
export type FritzUser = {
  /**
   * The name of the user.
   */
  readonly name: string;
  /**
   * Indicates if the user was the last active user.
   */
  readonly wasLastActive: boolean;
};

/**
 * Lists the registered users of the Fritz!Box.
 * @param client The Fritz!Box client use to make the request.
 * @returns An array of FritzUser objects.
 */
export const listUsers = async (client: FritzClient): Promise<FritzUser[]> => {
  const response = await client.request(RequestSid).then((x) => x.data());

  const users: FritzUser[] = [];
  for (const { user, last } of response.sessionInfo.users) {
    users.push({
      name: user,
      wasLastActive: last === "1",
    });
  }
  return users;
};

/**
 * Gets the last active user of the Fritz!Box.
 * @param client The Fritz!Box client use to make the request.
 * @returns The last active user or null if none found.
 */
export const lastActiveUser = async (
  client: FritzClient,
): Promise<FritzUser | null> => {
  const users = await listUsers(client);
  return users.find((user) => user.wasLastActive) || null;
};
