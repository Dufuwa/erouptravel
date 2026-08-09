"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTrip } from "@/contexts/trip-context";
import { Button } from "./ui/button";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { workspace, loading } = useTrip();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, user, router, pathname]);
  if (authLoading || loading) return <div className="grid min-h-dvh place-items-center"><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-2xl bg-[#cbdacf]" /><p className="text-sm font-bold text-[#6b746f]">正在整理行程…</p></div></div>;
  if (!user) return null;
  const allowed = user.isDemo || workspace.trip.memberEmails?.includes(user.email.toLowerCase());
  if (!allowed) return <main className="grid min-h-dvh place-items-center p-6"><section className="card max-w-md p-8 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#f9dfdd] text-[#a62f2b]"><LockKeyhole /></div><h1 className="text-2xl font-extrabold">尚未受邀</h1><p className="leading-7 text-[#69736d]">目前的 Google 帳號不在這趟旅程的旅伴名單中。請聯絡行程擁有者加入 <strong>{user.email}</strong>。</p><Button variant="secondary" onClick={() => void signOut()}>換一個帳號</Button></section></main>;
  return children;
}
