"use client";

import { BookOpen, CalendarDays, CheckSquare2, CloudOff, LogOut, RefreshCw, Settings, TicketCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTrip } from "@/contexts/trip-context";
import { TRIP_ID } from "@/data/seed";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { AuthGuard } from "./auth-guard";

const navigation = [
  { href: "today", label: "今日", icon: CalendarDays },
  { href: "itinerary", label: "行程", icon: BookOpen },
  { href: "todos", label: "待辦", icon: CheckSquare2 },
  { href: "bookings", label: "預訂", icon: TicketCheck },
  { href: "settings", label: "設定", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { workspace, online, refreshing, refresh, firebaseMode } = useTrip();
  const base = `/trip/${TRIP_ID}`;
  return <AuthGuard><div className="app-shell md:pl-[248px]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#dfe2dd] bg-[#f9faf7]/95 px-4 py-5 backdrop-blur md:flex">
      <div className="px-3 py-3"><div className="mb-2 flex items-center gap-2 text-xs font-extrabold tracking-[.12em] text-[#1f6a4a]"><span className="h-2 w-2 rounded-full bg-[#1f6a4a]" />CENTRAL EUROPE</div><div className="text-xl font-black tracking-[-.03em]">{workspace.trip.title}</div><div className="mt-1 text-xs text-[#78817c]">3/27 — 4/12 · 17 天</div></div>
      <nav className="mt-6 space-y-1">{navigation.map(({ href, label, icon: Icon }) => { const active = pathname.endsWith(`/${href}`); return <Link key={href} href={`${base}/${href}`} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition", active ? "bg-[#dfece4] text-[#1d6246]" : "text-[#626d67] hover:bg-[#eceeea]")}><Icon size={18} />{label}</Link>; })}</nav>
      <div className="mt-auto border-t border-[#dfe2dd] pt-4"><div className="mb-3 flex items-center gap-3 px-2"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dcece3] text-sm font-black text-[#1f6a4a]">{user?.displayName.slice(0,1)}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{user?.displayName}</div><div className="truncate text-[11px] text-[#7b837f]">{firebaseMode ? "Firebase" : "本機展示模式"}</div></div></div><Button variant="ghost" className="w-full justify-start" onClick={() => void signOut()}><LogOut size={16} />登出</Button></div>
    </aside>
    {!online && <div className="sticky top-0 z-20 flex items-center justify-center gap-2 bg-[#8b5514] px-4 py-2 text-center text-xs font-bold text-white"><CloudOff size={14} />離線唯讀模式 · 顯示最近快取資料</div>}
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#e0e3de] bg-[#f7f8f5]/92 px-4 backdrop-blur md:hidden"><div><div className="text-[10px] font-extrabold tracking-[.12em] text-[#1f6a4a]">2027 CENTRAL EUROPE</div><div className="text-sm font-black">{workspace.trip.title}</div></div><Button variant="ghost" size="icon" onClick={() => void refresh()} loading={refreshing} aria-label="重新整理"><RefreshCw size={18} /></Button></header>
    <main>{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#dfe2dd] bg-[#fbfcfa]/96 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden">{navigation.map(({ href, label, icon: Icon }) => { const active = pathname.endsWith(`/${href}`); return <Link key={href} href={`${base}/${href}`} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-bold", active ? "text-[#1f6a4a]" : "text-[#78817c]")}><Icon size={19} strokeWidth={active ? 2.6 : 2} />{label}</Link>; })}</nav>
  </div></AuthGuard>;
}
