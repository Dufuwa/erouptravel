"use client";

import { BedDouble, CalendarCheck2, CheckCircle2, ChevronRight, Clock3, Navigation, RefreshCw, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useTrip } from "@/contexts/trip-context";
import { getTodayState, formatTripDate } from "@/lib/date";
import { buildGoogleMapsUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TodayPage() {
  const { workspace, refreshing, refresh } = useTrip();
  const { trip, days, todos, accommodations, transportBookings, tickets } = workspace;
  const state = getTodayState(trip, days);
  const completed = todos.filter((todo) => todo.status === "completed").length;
  const booked = accommodations.filter((item) => item.status === "booked" || item.status === "confirmed").length + transportBookings.filter((item) => item.status === "booked" || item.status === "confirmed").length + tickets.filter((item) => item.status === "purchased").length;
  const totalBookings = accommodations.length + transportBookings.length + tickets.length;

  return <div className="page-wrap">
    <header className="page-header"><div><span className="eyebrow">TRIP OVERVIEW</span><h1 className="page-title">{state.phase === "before" ? "準備出發" : state.phase === "during" ? `第 ${state.day?.dayNumber} 天` : "旅程回顧"}</h1><p className="page-description">{state.phase === "before" ? `距離布拉格還有 ${state.countdown} 天，把重要事項一件件完成。` : state.phase === "during" ? `${state.day ? formatTripDate(state.day.date) : state.today} · ${state.day?.title ?? "自由探索"}` : "17 天的中歐旅程已完成。"}</p></div><Button variant="secondary" className="hidden md:inline-flex" loading={refreshing} onClick={() => void refresh()}><RefreshCw size={16} />重新整理</Button></header>

    <section className="relative overflow-hidden rounded-[26px] bg-[#1d5e43] px-6 py-7 text-white shadow-[var(--shadow)] sm:px-9 sm:py-9">
      <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full border-[45px] border-white/5" />
      <div className="relative grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end"><div><div className="mb-3 text-xs font-extrabold tracking-[.13em] text-[#b8d7c6]">{state.phase === "before" ? "NEXT DESTINATION" : "TODAY'S PLAN"}</div><h2 className="m-0 max-w-2xl text-3xl font-black tracking-[-.04em] sm:text-4xl">{state.day?.title ?? trip.title}</h2><p className="mt-3 mb-0 max-w-xl leading-7 text-[#d5e6dc]">{state.day?.subtitle ?? trip.subtitle}</p></div>{state.phase === "before" && <div className="text-left sm:text-right"><div className="text-5xl font-black tracking-[-.06em]">{state.countdown}</div><div className="text-xs font-bold text-[#b8d7c6]">DAYS TO GO</div></div>}</div>
    </section>

    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      <StatCard icon={CheckCircle2} label="行前待辦" value={`${completed} / ${todos.length}`} note={completed === todos.length ? "全部完成" : `還有 ${todos.length - completed} 項`} />
      <StatCard icon={TicketCheck} label="預訂進度" value={`${booked} / ${totalBookings}`} note="住宿・交通・票券" />
      <StatCard icon={CalendarCheck2} label="完整行程" value={`${days.length} 天`} note={`${trip.countries.length} 個國家 · ${workspace.cities.length} 個城市`} />
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_.75fr]">
      <section><div className="mb-4 flex items-end justify-between"><div><span className="eyebrow">ITINERARY</span><h2 className="mt-1 mb-0 text-2xl font-extrabold tracking-[-.03em]">{state.phase === "before" ? "第一天預覽" : "今日安排"}</h2></div><Link href="itinerary" className="flex items-center gap-1 text-sm font-bold text-[#1f6a4a]">全部行程<ChevronRight size={16} /></Link></div>
        <div className="card divide-y divide-[#e5e7e3] overflow-hidden">{state.day?.places.slice(0, 7).map((place, index) => <div key={place.id} className="flex items-center gap-4 px-5 py-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf0ec] text-xs font-black text-[#59655e]">{String(index + 1).padStart(2,"0")}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-extrabold">{place.name}</h3>{place.time && <Badge tone="blue"><Clock3 size={11} className="mr-1" />{place.time}</Badge>}</div>{place.englishName && <p className="mt-1 mb-0 truncate text-xs text-[#7a837e]">{place.englishName}</p>}</div>{place.mapQuery && <a href={buildGoogleMapsUrl(place.mapQuery, place.latitude, place.longitude)} target="_blank" rel="noreferrer" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#1f6a4a] hover:bg-[#e1ece5]" aria-label={`在地圖開啟 ${place.name}`}><Navigation size={17} /></a>}</div>)}{!state.day?.places.length && <div className="px-6 py-12 text-center text-sm text-[#7a837e]">這一天還沒有景點安排。</div>}</div>
      </section>
      <aside><div className="mb-4"><span className="eyebrow">UP NEXT</span><h2 className="mt-1 mb-0 text-2xl font-extrabold tracking-[-.03em]">優先處理</h2></div><div className="space-y-3">{todos.filter((todo) => todo.status !== "completed" && todo.status !== "not_applicable").sort((a,b) => ({high:0,medium:1,low:2}[a.priority] - {high:0,medium:1,low:2}[b.priority])).slice(0,4).map((todo) => <Link href="todos" key={todo.id} className="card block p-4 transition hover:border-[#b8c9bd]"><div className="mb-2 flex items-center justify-between gap-2"><Badge tone={todo.priority === "high" ? "red" : todo.priority === "medium" ? "amber" : "neutral"}>{todo.priority === "high" ? "高優先" : todo.priority === "medium" ? "中優先" : "低優先"}</Badge>{todo.recommendedCompleteDate && <span className="text-[11px] text-[#79827d]">{todo.recommendedCompleteDate.slice(5).replace("-","/")} 前</span>}</div><h3 className="m-0 text-sm leading-6 font-extrabold">{todo.title}</h3></Link>)}</div></aside>
    </div>
  </div>;
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof BedDouble; label: string; value: string; note: string }) {
  return <div className="card flex items-center gap-4 p-5"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e1ece5] text-[#1f6a4a]"><Icon size={20} /></div><div><div className="text-xs font-bold text-[#77817b]">{label}</div><div className="mt-1 text-xl font-black tracking-[-.03em]">{value}</div><div className="mt-0.5 text-[11px] text-[#8a928e]">{note}</div></div></div>;
}
