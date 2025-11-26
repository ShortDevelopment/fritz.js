import { load as loadEnv } from "@std/dotenv";

// Credentials

const env = await loadEnv();

const username = env.FRITZBOX_USERNAME;
const password = env.FRITZBOX_PASSWORD;

export { password, username };
