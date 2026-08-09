"use client";

import { CalendarPlus, Edit3, ExternalLink, Heart, MapPin, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PlaceIdeaEditor, SchedulePlaceIdeaDialog } from "@/components/place-idea-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTrip } from "@/contexts/trip-context";
import { formatTripDate } from "@/lib/date";
import { placeIdeaStatusLabels, placeTypeLabels } from "@/lib/labels";
import { filterPlaceIdeas } from "@/lib/place-ideas";
import { formatUpdatedAt, resolveGoogleMapsUrl } from "@/lib/utils";
import type { PlaceIdea } from "@/types/types";

const statusTone = { want_to_go: "green", considering: "amber", skipped: "neutral" } as const;

export default function PlacesPage() {
  const { workspace, online, upsertEntity, deleteEntity, schedulePlaceIdea } = useTrip();
  const [editor, setEditor] = useState<PlaceIdea | "new" | null>(null);
  const [scheduling, setScheduling] = useState<PlaceIdea | null>(null);
  const [query, setQuery] = useState("");
  const [cityId, setCityId] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [schedule, setSchedule] = useState("all");
  const cities = useMemo(() => [...workspace.cities].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [workspace.cities]);
  const cityById = Object.fromEntries(cities.map((city) => [city.id, city]));
  const dayById = Object.fromEntries(workspace.days.map((day) => [day.id, day]));
  const ideas = useMemo(() => filterPlaceIdeas(
    [...workspace.placeIdeas].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    { query, cityId, type, status, schedule },
  ), [workspace.placeIdeas, query, cityId, type, status, schedule]);
  const scheduledCount = workspace.placeIdeas.filter((idea) => idea.scheduledDayIds.length > 0).length;

  async function remove(idea: PlaceIdea) {
    if (idea.scheduledDayIds.length > 0) {
      toast.error("此收藏仍在行程中，請先從所有日期移除後再刪除。");
      return;
    }
    if (!confirm(`確定刪除「${idea.name}」？`)) return;
    try {
      await deleteEntity("placeIdeas", idea);
      toast.success("收藏已刪除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    }
  }

  return <div className="page-wrap">
    <header className="page-header"><div><span className="eyebrow">PLACE COLLECTION</span><h1 className="page-title">景點清單</h1><p className="page-description">先把大家想去的地方放進共享收藏，再挑選適合的日期排入行程。</p></div><Button disabled={!online} onClick={() => setEditor("new")}><Plus size={16} />新增景點</Button></header>

    <section className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="card p-4"><div className="text-xs font-bold text-[#78817c]">全部收藏</div><div className="mt-1 text-2xl font-black">{workspace.placeIdeas.length}</div></div>
      <div className="card p-4"><div className="text-xs font-bold text-[#78817c]">已排入行程</div><div className="mt-1 text-2xl font-black text-[#1f6a4a]">{scheduledCount}</div></div>
      <div className="card p-4"><div className="text-xs font-bold text-[#78817c]">尚未排入</div><div className="mt-1 text-2xl font-black">{workspace.placeIdeas.length - scheduledCount}</div></div>
    </section>

    <section className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="relative sm:col-span-2 lg:col-span-1"><Search className="pointer-events-none absolute top-3 left-3 text-[#87908b]" size={17} /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋景點或地址" aria-label="搜尋景點" /></label>
      <select className="select" value={cityId} onChange={(event) => setCityId(event.target.value)} aria-label="城市篩選"><option value="all">所有城市</option><option value="">未分類</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select>
      <select className="select" value={type} onChange={(event) => setType(event.target.value)} aria-label="類型篩選"><option value="all">所有類型</option>{Object.entries(placeTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="狀態篩選"><option value="all">所有狀態</option>{Object.entries(placeIdeaStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="select" value={schedule} onChange={(event) => setSchedule(event.target.value)} aria-label="排程篩選"><option value="all">全部排程</option><option value="scheduled">已排</option><option value="unscheduled">未排</option></select>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">{ideas.map((idea) => {
      const scheduledDays = idea.scheduledDayIds.map((id) => dayById[id]).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
      return <article key={idea.id} className="card flex flex-col overflow-hidden">
        <div className="flex flex-1 gap-4 p-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e2eee7] text-[#1f6a4a]"><Heart size={19} /></div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone={statusTone[idea.status]}>{placeIdeaStatusLabels[idea.status]}</Badge><Badge>{placeTypeLabels[idea.type]}</Badge>{idea.scheduledDayIds.length > 0 && <Badge tone="blue">已排 {idea.scheduledDayIds.length} 天</Badge>}</div>
            <h2 className="m-0 text-lg font-black tracking-[-.02em]">{idea.name}</h2>
            {idea.englishName && <p className="mt-1 mb-0 text-sm text-[#79827d]">{idea.englishName}</p>}
            <p className="mt-3 mb-0 flex items-center gap-1.5 text-xs font-bold text-[#65716a]"><MapPin size={13} />{cityById[idea.cityId ?? ""]?.name ?? "未分類"}{idea.address && `・${idea.address}`}</p>
            {idea.note && <p className="mt-3 mb-0 line-clamp-2 text-sm leading-6 text-[#68736d]">{idea.note}</p>}
          </div>
        </div>
        {scheduledDays.length > 0 && <div className="flex flex-wrap gap-2 border-t border-[#e7e9e5] bg-[#f7f8f5] px-5 py-3">{scheduledDays.map((day) => <Link key={day.id} href="itinerary" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1f6a4a] ring-1 ring-[#dce2dd]">第 {day.dayNumber} 天・{formatTripDate(day.date)}</Link>)}</div>}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e7e2] px-4 py-3"><span className="text-[11px] text-[#89918d]">{formatUpdatedAt(idea.updatedAt)}{idea.updatedBy && `・${idea.updatedBy.name}`}</span><div className="flex items-center gap-1">
          <a href={resolveGoogleMapsUrl(idea)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#1f6a4a] hover:bg-[#e3eee8]"><ExternalLink size={14} />Google 地圖</a>
          <Button size="sm" variant="secondary" disabled={!online} onClick={() => setScheduling(idea)}><CalendarPlus size={14} />排入</Button>
          <Button size="icon" variant="ghost" disabled={!online} onClick={() => setEditor(idea)} aria-label={`編輯 ${idea.name}`}><Edit3 size={15} /></Button>
          <Button size="icon" variant="ghost" disabled={!online || idea.scheduledDayIds.length > 0} onClick={() => void remove(idea)} aria-label={`刪除 ${idea.name}`}><Trash2 size={15} /></Button>
        </div></footer>
      </article>;
    })}</div>

    {ideas.length === 0 && <EmptyState icon={Heart} title="沒有符合條件的景點" description={workspace.placeIdeas.length ? "調整搜尋或篩選條件後再看看。" : "先加入大家想去的景點，再一起安排到適合的日期。"} action={!workspace.placeIdeas.length ? <Button disabled={!online} onClick={() => setEditor("new")}><Plus size={16} />新增第一個景點</Button> : undefined} />}

    <PlaceIdeaEditor open={editor !== null} item={editor === "new" ? undefined : editor} cities={cities} nextSortOrder={workspace.placeIdeas.length} onClose={() => setEditor(null)} onSave={(idea) => upsertEntity("placeIdeas", idea)} />
    <SchedulePlaceIdeaDialog open={scheduling !== null} idea={scheduling} days={workspace.days} cities={cities} onClose={() => setScheduling(null)} onSchedule={async (dayId) => { if (scheduling) await schedulePlaceIdea(scheduling, dayId); }} />
  </div>;
}
