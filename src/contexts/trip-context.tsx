"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { seedWorkspace, TRIP_ID } from "@/data/seed";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { loadWorkspace, removeEntity, removeNestedEntity, saveEntity, saveNestedEntity, saveTrip } from "@/lib/firebase/repository";
import type { CollectionEntity, CollectionName, NestedCollectionName, NestedEntity, TripWorkspace } from "@/types/app";
import type { DayTransport, Place, Trip } from "@/types/types";
import { useAuth } from "./auth-context";

interface TripContextValue {
  workspace: TripWorkspace;
  loading: boolean;
  refreshing: boolean;
  online: boolean;
  trustedDevice: boolean;
  firebaseMode: boolean;
  refresh: () => Promise<void>;
  setTrustedDevice: (enabled: boolean) => void;
  upsertEntity: (name: CollectionName, entity: CollectionEntity) => Promise<void>;
  deleteEntity: (name: CollectionName, entity: CollectionEntity) => Promise<void>;
  upsertNested: (dayId: string, name: NestedCollectionName, entity: NestedEntity) => Promise<void>;
  deleteNested: (dayId: string, name: NestedCollectionName, entity: NestedEntity) => Promise<void>;
  updateTrip: (patch: Partial<Trip>) => Promise<void>;
}

const TripContext = createContext<TripContextValue | null>(null);
const LOCAL_KEY = "erouptravel:workspace";

function readLocal() {
  if (typeof window === "undefined") return seedWorkspace;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as TripWorkspace) : seedWorkspace;
  } catch {
    return seedWorkspace;
  }
}

function withAudit<T extends CollectionEntity | NestedEntity>(entity: T, user: NonNullable<ReturnType<typeof useAuth>["user"]>): T {
  return {
    ...entity,
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: { uid: user.uid, name: user.displayName, email: user.email },
  };
}

export function TripProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<TripWorkspace>(seedWorkspace);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);
  const [trustedDevice, setTrustedState] = useState(false);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    queueMicrotask(() => {
      setOnline(navigator.onLine);
      setTrustedState(localStorage.getItem("erouptravel:trusted-device") === "true");
    });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      if (isFirebaseConfigured) {
        const data = await loadWorkspace(TRIP_ID);
        if (data) setWorkspace(data);
      } else {
        setWorkspace(readLocal());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "讀取行程失敗");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) queueMicrotask(() => void refresh());
  }, [user, refresh]);

  const persistLocal = useCallback((updater: (current: TripWorkspace) => TripWorkspace) => {
    setWorkspace((current) => {
      const next = updater(current);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const assertWritable = useCallback(() => {
    if (!online) throw new Error("離線模式僅供查看，請連線後再編輯。");
    if (!user) throw new Error("請先登入");
    return user;
  }, [online, user]);

  const upsertEntity = useCallback(async (name: CollectionName, entity: CollectionEntity) => {
    const currentUser = assertWritable();
    if (isFirebaseConfigured) {
      await saveEntity(TRIP_ID, name, entity, currentUser, entity.updatedAt);
      await refresh();
    } else {
      const next = withAudit(entity, currentUser);
      persistLocal((current) => ({ ...current, [name]: [...current[name].filter((item) => item.id !== entity.id), next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } as TripWorkspace));
    }
  }, [assertWritable, persistLocal, refresh]);

  const deleteEntity = useCallback(async (name: CollectionName, entity: CollectionEntity) => {
    assertWritable();
    if (isFirebaseConfigured) {
      await removeEntity(TRIP_ID, name, entity.id, entity.updatedAt);
      await refresh();
    } else {
      persistLocal((current) => ({ ...current, [name]: current[name].filter((item) => item.id !== entity.id) } as TripWorkspace));
    }
  }, [assertWritable, persistLocal, refresh]);

  const upsertNested = useCallback(async (dayId: string, name: NestedCollectionName, entity: NestedEntity) => {
    const currentUser = assertWritable();
    if (isFirebaseConfigured) {
      await saveNestedEntity(TRIP_ID, dayId, name, entity, currentUser, entity.updatedAt);
      await refresh();
    } else {
      const next = withAudit(entity, currentUser);
      persistLocal((current) => ({
        ...current,
        days: current.days.map((day) => day.id !== dayId ? day : {
          ...day,
          ...(name === "places"
            ? { places: [...day.places.filter((item) => item.id !== entity.id), next as Place].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) }
            : { transportation: [...(day.transportation ?? []).filter((item) => item.id !== entity.id), next as DayTransport].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) }),
        }),
      }));
    }
  }, [assertWritable, persistLocal, refresh]);

  const deleteNested = useCallback(async (dayId: string, name: NestedCollectionName, entity: NestedEntity) => {
    assertWritable();
    if (isFirebaseConfigured) {
      await removeNestedEntity(TRIP_ID, dayId, name, entity.id, entity.updatedAt);
      await refresh();
    } else {
      persistLocal((current) => ({
        ...current,
        days: current.days.map((day) => day.id !== dayId ? day : name === "places"
          ? { ...day, places: day.places.filter((item) => item.id !== entity.id) }
          : { ...day, transportation: (day.transportation ?? []).filter((item) => item.id !== entity.id) }),
      }));
    }
  }, [assertWritable, persistLocal, refresh]);

  const updateTrip = useCallback(async (patch: Partial<Trip>) => {
    const currentUser = assertWritable();
    if (isFirebaseConfigured) {
      await saveTrip(TRIP_ID, patch, currentUser, workspace.trip.updatedAt);
      await refresh();
    } else {
      persistLocal((current) => ({ ...current, trip: { ...current.trip, ...patch } }));
    }
  }, [assertWritable, persistLocal, refresh, workspace.trip.updatedAt]);

  const setTrustedDevice = useCallback((enabled: boolean) => {
    localStorage.setItem("erouptravel:trusted-device", String(enabled));
    setTrustedState(enabled);
    if (isFirebaseConfigured) window.location.reload();
  }, []);

  const value = useMemo(() => ({ workspace, loading, refreshing, online, trustedDevice, firebaseMode: isFirebaseConfigured, refresh, setTrustedDevice, upsertEntity, deleteEntity, upsertNested, deleteNested, updateTrip }), [workspace, loading, refreshing, online, trustedDevice, refresh, setTrustedDevice, upsertEntity, deleteEntity, upsertNested, deleteNested, updateTrip]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip 必須在 TripProvider 中使用");
  return context;
}
