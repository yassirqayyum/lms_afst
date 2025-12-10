import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export const {
  signUp,
  signIn,
  requestPasswordReset,
  resetPassword,
  signOut,
  getSession,
  useSession,
} = authClient;
