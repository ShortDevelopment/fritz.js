import type { FritzClient } from "../index.ts";
import { LoginSid, LogoutSid, RequestSid } from "../protocol/login-sid.ts";
import type { IAuthHandler, SessionInfo } from "./handler.ts";
import { crypto } from "@std/crypto";

/**
 * Credentials for authentication.
 */
export type NetworkCredential = {
  readonly username: string;
  readonly password: string;
};

/**
 * Authentication using username and password.
 */
export class UserPassword implements IAuthHandler {
  constructor(private readonly credential: NetworkCredential) {}

  /**
   * Logs in to the Fritz!Box device using the provided credentials.
   * @param client The FritzClient instance.
   * @returns The session information.
   */
  async login(client: FritzClient): Promise<SessionInfo> {
    const challengeResponse = await client
      .request(RequestSid)
      .then((x) => x.data());

    const { challenge } = challengeResponse.sessionInfo;
    const { username, password } = this.credential;

    const response = await client
      .request(LoginSid, {
        username,
        response: await handleChallenge(challenge, password),
      })
      .then((x) => x.data());
    return response.sessionInfo;
  }

  /**
   * Logs out of the Fritz!Box device.
   * @param client The FritzClient instance.
   * @param param1 The session information.
   */
  async logout(client: FritzClient, { sid }: SessionInfo): Promise<void> {
    await using response = await client.request(LogoutSid, {
      logout: "1",
      sid,
    });
    response.throwOnError();
  }

  /**
   * Generates the challenge-response for authentication.
   * @param challenge The challenge string provided by the Fritz!Box device.
   * @param password The password to use for generating the response.
   * @returns The computed response string.
   */
  static async handleChallenge(
    challenge: string,
    password: string,
  ): Promise<string> {
    return await handleChallenge(challenge, password);
  }
}

async function handleChallenge(
  challenge: string,
  password: string,
): Promise<string> {
  // Determine the Fritz!Box firmware version from the challenge format
  if (challenge.startsWith("2$")) {
    return await handleChallengeV2(challenge, password);
  } else {
    return await handleChallengeV1(challenge, password);
  }
}

async function handleChallengeV1(
  challenge: string,
  password: string,
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "MD5",
    encodeUtf16Le(`${challenge}-${password}`),
  );
  return `${challenge}-${new Uint8Array(hashBuffer).toHex()}`;
}

async function handleChallengeV2(
  challenge: string,
  password: string,
): Promise<string> {
  const [_, iter1, salt1, iter2, salt2] = challenge.split("$");

  const hash1 = await pbkdf2_hmac_sha256(
    new TextEncoder().encode(password),
    Uint8Array.fromHex(salt1),
    parseInt(iter1, 10),
  );
  const hash2 = await pbkdf2_hmac_sha256(
    hash1,
    Uint8Array.fromHex(salt2),
    parseInt(iter2, 10),
  );
  return `${salt2}$${new Uint8Array(hash2).toHex()}`;
}

async function pbkdf2_hmac_sha256(
  value: BufferSource,
  salt: BufferSource,
  iterations: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", value, "PBKDF2", false, [
    "deriveBits",
  ]);
  return await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    256,
  );
}

function encodeUtf16Le(str: string): BufferSource {
  const buffer = new Uint16Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buffer[i] = str.charCodeAt(i);
  }
  return buffer;
}
