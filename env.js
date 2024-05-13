import { createEnv } from "@t3-oss/env-core";
import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv();

export const env = createEnv({
    isServer: true,
    server: {
        PORT: z.coerce.number(),
        SALT: z.string()
    },
    runtimeEnv: process.env
});
