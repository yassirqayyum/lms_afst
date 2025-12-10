import { getAuth } from "./auth";

export const getAuthUser = async (c: { env: Env; req: { raw: Request } }) => {
  const auth = getAuth(c.env);
  console.log("Headers:", Object.fromEntries(c.req.raw.headers.entries()));
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  console.log("Session result:", session);
  return session?.user ?? null;
};
