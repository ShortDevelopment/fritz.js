import type { FritzClient } from "./client/index.ts";
import { RequestSid } from "./client/protocol/login-sid.ts";

type FritzUser = {
  name: string;
  wasLastActive: boolean;
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
