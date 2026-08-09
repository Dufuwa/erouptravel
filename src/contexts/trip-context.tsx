"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { seedWorkspace, TRIP_ID } from "@/data/seed";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { loadWorkspace, removeEntity, removeNestedEntity, saveEntity, saveNestedEntity, saveTrip, schedulePlaceIdea as schedulePlaceIdeaInFirestore } from "@/lib/firebase/repository";
import type { CollectionEntity, CollectionName, NestedCollectionName, NestedEntity, TripWorkspace } from "@/types/app";
import type { DayTransport, Place, PlaceIdea, Trip } from "@/types/types";
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
  schedulePlaceIdea: (idea: PlaceIdea, dayId: string) => Promise<void>;
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
    const currentUser = assertWritable();
    if (name === "placeIdeas" && ((entity as PlaceIdea).scheduledDayIds?.length ?? 0) > 0) throw new Error("此收藏仍在行程中，請先移除所有排程後再刪除。");
    if (isFirebaseConfigured) {
      await removeEntity(TRIP_ID, name, entity.id, currentUser, entity.updatedAt);
      await refresh();
    } else {
      persistLocal((current) => {
        if (name !== "days") return { ...current, [name]: current[name].filter((item) => item.id !== entity.id) } as TripWorkspace;
        const day = entity as TripWorkspace["days"][number];
        const sourceIds = new Set(day.places.map((place) => place.sourceIdeaId).filter(Boolean));
        return {
          ...current,
          days: current.days.filter((item) => item.id !== entity.id),
          placeIdeas: current.placeIdeas.map((idea) => sourceIds.has(idea.id) ? { ...idea, scheduledDayIds: idea.scheduledDayIds.filter((dayId) => dayId !== entity.id) } : idea),
        };
      });
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
        days: current.days.map((day) => {
          if (day.id !== dayId) return day;
          if (name === "places") {
            const previous = day.places.find((item) => item.id === entity.id);
            const merged = { ...previous, ...next } as Place;
            return { ...day, places: [...day.places.filter((item) => item.id !== entity.id), merged].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) };
          }
          const previous = (day.transportation ?? []).find((item) => item.id === entity.id);
          const merged = { ...previous, ...next } as DayTransport;
          return { ...day, transportation: [...(day.transportation ?? []).filter((item) => item.id !== entity.id), merged].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) };
        }),
      }));
    }
  }, [assertWritable, persistLocal, refresh]);

  const deleteNested = useCallback(async (dayId: string, name: NestedCollectionName, entity: NestedEntity) => {
    const currentUser = assertWritable();
    if (isFirebaseConfigured) {
      await removeNestedEntity(TRIP_ID, dayId, name, entity, currentUser, entity.updatedAt);
      await refresh();
    } else {
      persistLocal((current) => ({
        ...current,
        placeIdeas: name === "places" && (entity as Place).sourceIdeaId
          ? current.placeIdeas.map((idea) => idea.id === (entity as Place).sourceIdeaId ? { ...idea, scheduledDayIds: idea.scheduledDayIds.filter((item) => item !== dayId) } : idea)
          : current.placeIdeas,
        days: current.days.map((day) => day.id !== dayId ? day : name === "places"
          ? { ...day, places: day.places.filter((item) => item.id !== entity.id) }
          : { ...day, transportation: (day.transportation ?? []).filter((item) => item.id !== entity.id) }),
      }));
    }
  }, [assertWritable, persistLocal, refresh]);

  const schedulePlaceIdea = useCallback(async (idea: PlaceIdea, dayId: string) => {
    const currentUser = assertWritable();
    const day = workspace.days.find((item) => item.id === dayId);
    if (!day) throw new Error("找不到選擇的行程日。");
    if (idea.scheduledDayIds.includes(dayId)) throw new Error("這個景點已排入該日期。");
    if (isFirebaseConfigured) {
      await schedulePlaceIdeaInFirestore(TRIP_ID, dayId, idea, day.places.length, currentUser);
      await refresh();
    } else {
      const now = new Date().toISOString();
      const updatedBy = { uid: currentUser.uid, name: currentUser.displayName, email: currentUser.email };
      const place: Place = {
        id: idea.id,
        name: idea.name,
        englishName: idea.englishName,
        type: idea.type,
        address: idea.address,
        latitude: idea.latitude,
        longitude: idea.longitude,
        durationMinutes: idea.durationMinutes,
        mapQuery: idea.mapQuery,
        googleMapsUrl: idea.googleMapsUrl,
        note: idea.note,
        sourceIdeaId: idea.id,
        sortOrder: day.places.length,
        createdAt: now,
        updatedAt: now,
        updatedBy,
      };
      persistLocal((current) => ({
        ...current,
        placeIdeas: current.placeIdeas.map((item) => item.id === idea.id ? { ...item, scheduledDayIds: [...item.scheduledDayIds, dayId], updatedAt: now, updatedBy } : item),
        days: current.days.map((item) => item.id === dayId ? { ...item, places: [...item.places, place] } : item),
      }));
    }
  }, [assertWritable, persistLocal, refresh, workspace.days]);

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

  const value = useMemo(() => ({ workspace, loading, refreshing, online, trustedDevice, firebaseMode: isFirebaseConfigured, refresh, setTrustedDevice, upsertEntity, deleteEntity, upsertNested, deleteNested, schedulePlaceIdea, updateTrip }), [workspace, loading, refreshing, online, trustedDevice, refresh, setTrustedDevice, upsertEntity, deleteEntity, upsertNested, deleteNested, schedulePlaceIdea, updateTrip]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip 必須在 TripProvider 中使用");
  return context;
}
