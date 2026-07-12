import { useAuth } from "../contexts/AuthContext";

/**
 * Reads are public. Writes require sign-in AND editor/admin role (see firestore.rules).
 * Wrap any create/edit/delete trigger with `gate(...)`:
 * - logged-out users are prompted to sign in with Google
 * - signed-in viewers are silently blocked (the persistent Layout banner explains why)
 */
export function useAuthGate() {
  const { user, canEdit, signIn } = useAuth();

  function gate(action: () => void) {
    if (!user) {
      void signIn();
      return;
    }
    if (!canEdit) return;
    action();
  }

  return { isSignedIn: !!user, canEdit, gate };
}
