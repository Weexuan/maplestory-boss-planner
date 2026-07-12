import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import { upsertUserProfile } from "../services/users";
import { ADMIN_EMAIL } from "../constants";
import type { UserRole } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  playerId: string | null;
  isAdmin: boolean;
  canEdit: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface OwnProfile {
  role: UserRole | null;
  playerId: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<OwnProfile>({ role: null, playerId: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) void upsertUserProfile(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile({ role: null, playerId: null });
      return;
    }
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      setProfile({
        role: (data?.role as UserRole | undefined) ?? null,
        playerId: (data?.playerId as string | undefined) ?? null,
      });
    });
    return unsubscribe;
  }, [user]);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  const canEdit = isAdmin || profile.role === "editor";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: profile.role,
        playerId: profile.playerId,
        isAdmin,
        canEdit,
        signIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
