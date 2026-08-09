"use client";

import { ArrowDown, ArrowUp, BusFront, Clock3, Edit3, MapPin, Navigation, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTrip } from "@/contexts/trip-context";
import { buildGoogleMapsUrl, formatUpdatedAt } from "@/lib/utils";
import { formatTripDate, formatWeekday } from "@/lib/date";
import { transportTypeLabels } from "@/lib/labels";
import type { City, DayTransport, Place, TripDay } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CityEditor, DayEditor, PlaceEditor, TransportEditor } from "@/components/itinerary-editors";

type EditorState = { type: "city"; item?: City } | { type: "day"; item?: TripDay } | { type: "place"; dayId: string; item?: Place } | { type: "transport"; dayId: string; item?: DayTransport } | null;

export default function ItineraryPage() {
  const { workspace, online, upsertEntity, deleteEntity, upsertNested, deleteNested } = useTrip();
  const [editor, setEditor] = useState<EditorState>(null);
  const [cityFilter, setCityFilter] = useState("all");
  const cities = useMemo(() => [...workspace.cities].sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [workspace.cities]);
  const days = useMemo(() => [...workspace.days].sort((a,b) => a.date.localeCompare(b.date)).filter((day) => cityFilter === "all" || day.cityId === cityFilter), [workspace.days, cityFilter]);
  const cityById = Object.fromEntries(cities.map((city) => [city.id, city]));

  async function remove(name: "cities" | "days", item: City | TripDay, label: string) {
    if (name === "cities" && workspace.days.some((day) => day.cityId === item.id)) {
      toast.error("仍有行程日使用這個城市，請先改到其他城市再刪除。");
      return;
    }
    if (!confirm(`確定刪除「${label}」？此動作無法復原。`)) return;
    try { await deleteEntity(name, item); toast.success("已刪除"); } catch (error) { toast.error(error instanceof Error ? error.message : "刪除失敗"); }
  }

  async function removeChild(dayId: string, name: "places" | "transports", item: Place | DayTransport, label: string) {
    if (!confirm(`確定刪除「${label}」？`)) return;
    try { await deleteNested(dayId, name, item); toast.success("已刪除"); } catch (error) { toast.error(error instanceof Error ? error.message : "刪除失敗"); }
  }

  async function reorder<T extends City | Place | DayTransport>(items: T[], index: number, direction: -1 | 1, save: (item: T) => Promise<void>) {
    const target = index + direction; if (target < 0 || target >= items.length) return;
    const first = { ...items[index], sortOrder: target }; const second = { ...items[target], sortOrder: index };
    try { await save(first); await save(second); } catch (error) { toast.error(error instanceof Error ? error.message : "排序失敗"); }
  }

  return <div className="page-wrap">
    <header className="page-header"><div><span className="eyebrow">ITINERARY</span><h1 className="page-title">每日行程</h1><p className="page-description">17 天的移動與探索，都可以在這裡調整。</p></div><div className="flex gap-2"><Button variant="secondary" disabled={!online} onClick={() => setEditor({ type: "city" })}><MapPin size={16} />新增城市</Button><Button disabled={!online} onClick={() => setEditor({ type: "day" })}><Plus size={16} />新增日期</Button></div></header>

    <section className="mb-7 overflow-x-auto pb-1"><div className="flex min-w-max gap-2"><button onClick={() => setCityFilter("all")} className={`rounded-full px-4 py-2 text-sm font-bold ${cityFilter === "all" ? "bg-[#1f6a4a] text-white" : "border border-[#d8dcd7] bg-white text-[#5f6963]"}`}>全部</button>{cities.map((city, index) => <div key={city.id} className={`group flex items-center rounded-full border ${cityFilter === city.id ? "border-[#1f6a4a] bg-[#dfece4] text-[#1f6a4a]" : "border-[#d8dcd7] bg-white text-[#5f6963]"}`}><button onClick={() => setCityFilter(city.id)} className="px-4 py-2 text-sm font-bold">{city.name}</button><button className="pr-2 opacity-60 hover:opacity-100" onClick={() => setEditor({ type: "city", item: city })} aria-label={`編輯 ${city.name}`}><Edit3 size={13} /></button>{online && <><button className="opacity-50 hover:opacity-100" onClick={() => void reorder(cities,index,-1,(item) => upsertEntity("cities",item))} disabled={index === 0} aria-label="向前移"><ArrowUp size={12} /></button><button className="opacity-50 hover:opacity-100" onClick={() => void reorder(cities,index,1,(item) => upsertEntity("cities",item))} disabled={index === cities.length-1} aria-label="向後移"><ArrowDown size={12} /></button><button className="mr-2 opacity-45 hover:text-[#a62f2b] hover:opacity-100" onClick={() => void remove("cities",city,city.name)} aria-label={`刪除 ${city.name}`}><Trash2 size={12}/></button></>}</div>)}</div></section>

    <div className="space-y-6">{days.map((day) => { const places = [...day.places].sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); const transports = [...(day.transportation ?? [])].sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); return <article key={day.id} className="card overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-[#e2e5e0] bg-[#fbfcfa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1f6a4a] text-white"><span className="text-lg font-black">{day.dayNumber}</span></div><div><div className="mb-1 flex flex-wrap items-center gap-2"><Badge tone="green">{cityById[day.cityId]?.name ?? day.cityId}</Badge><span className="text-xs font-bold text-[#727c76]">{formatTripDate(day.date)} · {formatWeekday(day.date)}</span></div><h2 className="m-0 text-xl font-black tracking-[-.025em]">{day.title}</h2>{day.subtitle && <p className="mt-1 mb-0 text-sm text-[#747e78]">{day.subtitle}</p>}</div></div><div className="flex gap-1 self-end sm:self-auto"><Button variant="ghost" size="icon" disabled={!online} onClick={() => setEditor({ type: "day", item: day })} aria-label="編輯日期"><Edit3 size={16} /></Button><Button variant="ghost" size="icon" disabled={!online} onClick={() => void remove("days",day,day.title)} aria-label="刪除日期"><Trash2 size={16} /></Button></div></header>
      {transports.length > 0 && <div className="flex flex-wrap gap-2 border-b border-[#e5e7e3] bg-[#f3f5f1] px-5 py-3 sm:px-7">{transports.map((transport) => <div key={transport.id} className="inline-flex items-center rounded-xl border border-[#d9ded9] bg-white text-xs font-bold"><button onClick={() => setEditor({ type: "transport", dayId: day.id, item: transport })} className="inline-flex items-center gap-2 px-3 py-2 text-left hover:text-[#1f6a4a]"><BusFront size={14} className="text-[#1f6a4a]" /><span>{transport.label}</span><span className="text-[#89918d]">{transportTypeLabels[transport.type]}</span></button><button disabled={!online} onClick={() => void removeChild(day.id,"transports",transport,transport.label)} className="border-l border-[#e1e4df] px-2 py-2 text-[#8a928e] hover:text-[#a62f2b]" aria-label={`刪除 ${transport.label}`}><Trash2 size={13}/></button></div>)}</div>}
      <div className="divide-y divide-[#e8eae6]">{places.map((place,index) => <div key={place.id} className="group flex items-center gap-3 px-5 py-4 sm:px-7"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef0ed] text-[11px] font-black text-[#69736d]">{String(index+1).padStart(2,"0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-sm font-extrabold">{place.name}</h3>{place.time && <span className="inline-flex items-center gap-1 text-xs font-bold text-[#526f60]"><Clock3 size={12}/>{place.time}</span>}</div>{(place.englishName || place.note) && <p className="mt-1 mb-0 truncate text-xs text-[#808985]">{place.englishName ?? place.note}</p>}</div>{place.mapQuery && <a href={buildGoogleMapsUrl(place.mapQuery,place.latitude,place.longitude)} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-xl text-[#1f6a4a] hover:bg-[#e2ece6]" aria-label="開啟地圖"><Navigation size={16}/></a>}<div className="hidden items-center gap-0.5 group-hover:flex sm:flex"><Button variant="ghost" size="icon" disabled={!online || index===0} onClick={() => void reorder(places,index,-1,(item) => upsertNested(day.id,"places",item))} aria-label="上移"><ArrowUp size={14}/></Button><Button variant="ghost" size="icon" disabled={!online || index===places.length-1} onClick={() => void reorder(places,index,1,(item) => upsertNested(day.id,"places",item))} aria-label="下移"><ArrowDown size={14}/></Button><Button variant="ghost" size="icon" disabled={!online} onClick={() => setEditor({ type:"place",dayId:day.id,item:place })} aria-label="編輯"><Edit3 size={14}/></Button><Button variant="ghost" size="icon" disabled={!online} onClick={() => void removeChild(day.id,"places",place,place.name)} aria-label="刪除"><Trash2 size={14}/></Button></div></div>)}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e7e2] bg-[#fbfcfa] px-5 py-3 sm:px-7"><span className="text-[11px] text-[#8a928e]">{formatUpdatedAt(day.updatedAt)}{day.updatedBy && ` · ${day.updatedBy.name}`}</span><div className="flex gap-2"><Button size="sm" variant="ghost" disabled={!online} onClick={() => setEditor({type:"transport",dayId:day.id})}><BusFront size={14}/>交通</Button><Button size="sm" variant="secondary" disabled={!online} onClick={() => setEditor({type:"place",dayId:day.id})}><Plus size={14}/>景點</Button></div></footer>
    </article>; })}</div>
    {days.length === 0 && <EmptyState icon={MapPin} title="沒有符合的行程" description="切換城市篩選或新增一個行程日。" action={<Button onClick={() => setEditor({type:"day"})}><Plus size={16}/>新增日期</Button>} />}

    <CityEditor open={editor?.type === "city"} item={editor?.type === "city" ? editor.item : undefined} onClose={() => setEditor(null)} onSave={async (item) => upsertEntity("cities", { ...item, sortOrder: item.sortOrder ?? cities.length })} />
    <DayEditor open={editor?.type === "day"} item={editor?.type === "day" ? editor.item : undefined} cities={cities} onClose={() => setEditor(null)} onSave={async (item) => upsertEntity("days", { ...item, sortOrder: item.sortOrder ?? workspace.days.length })} />
    <PlaceEditor open={editor?.type === "place"} item={editor?.type === "place" ? editor.item : undefined} onClose={() => setEditor(null)} onSave={async (item) => { if (editor?.type === "place") await upsertNested(editor.dayId,"places",{...item,sortOrder:item.sortOrder ?? (workspace.days.find((day)=>day.id===editor.dayId)?.places.length ?? 0)}); }} />
    <TransportEditor open={editor?.type === "transport"} item={editor?.type === "transport" ? editor.item : undefined} onClose={() => setEditor(null)} onSave={async (item) => { if (editor?.type === "transport") await upsertNested(editor.dayId,"transports",{...item,sortOrder:item.sortOrder ?? (workspace.days.find((day)=>day.id===editor.dayId)?.transportation?.length ?? 0)}); }} />
  </div>;
}
