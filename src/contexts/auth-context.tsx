"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AppUser } from "@/types/app";
import { OWNER_EMAIL } from "@/data/seed";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAppUser(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): AppUser {
  return { uid: user.uid, email: user.email ?? "", displayName: user.displayName ?? user.email?.split("@")[0] ?? "旅伴", photoURL: user.photoURL };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(
    isFirebaseConfigured ? null : { uid: "demo-owner", email: OWNER_EMAIL, displayName: "展示模式", isDemo: true },
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser ? toAppUser(nextUser) : null);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
    if (localStorage.getItem("erouptravel:trusted-device") === "true") {
      const db = getFirebaseDb();
      if (db) {
        await terminate(db).catch(() => undefined);
        await clearIndexedDbPersistence(db).catch(() => undefined);
      }
      localStorage.removeItem("erouptravel:trusted-device");
      window.location.reload();
    }
  }, []);

  const value = useMemo(() => ({ user, loading, configured: isFirebaseConfigured, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth 必須在 AuthProvider 中使用");
  return context;
}
