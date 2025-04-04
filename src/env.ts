import {z} from "zod";
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    BASE_API_URL:z.string().url(),
    EVOLUTION_URL_WITH_INSTANCE:z.string(),
    INSTANCE:z.string(),
    URL_SEND_MESSAGE_WHATSAPP:z.string(),
    APIKEY:z.string(),
    OPENAI_API_KEY:z.string(),
    DEEPSEEK_API_KEY:z.string(),
})

export const env = envSchema.parse(process.env);
