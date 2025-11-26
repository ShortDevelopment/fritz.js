import { load as loadEnv } from "@std/dotenv";

// Credentials

const env = await loadEnv();

const baseUrl = env.FRITZBOX_BASE_URL;
const username = env.FRITZBOX_USERNAME;
const password = env.FRITZBOX_PASSWORD;

export { baseUrl, password, username };
