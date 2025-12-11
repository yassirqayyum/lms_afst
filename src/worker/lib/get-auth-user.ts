import { getAuth } from "./auth";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

export const getAuthUser = async (c: { env: Env; req: { raw: Request } }) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user?.id) return null;

  const db = drizzle(c.env.DB);
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id));

  return user || null;
};
