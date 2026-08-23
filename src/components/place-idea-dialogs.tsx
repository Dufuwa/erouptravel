"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { placeIdeaSchema } from "@/lib/schemas";
import { placeIdeaStatusLabels, placeTypeLabels } from "@/lib/labels";
import { createId } from "@/lib/utils";
import { formatTripDate } from "@/lib/date";
import type { City, PlaceIdea, TripDay } from "@/types/types";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

const value = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const optional = (input: string) => input || undefined;

export function PlaceIdeaEditor({
  open,
  item,
  cities,
  nextSortOrder,
  onClose,
  onSave,
}: {
  open: boolean;
  item?: PlaceIdea | null;
  cities: City[];
  nextSortOrder: number;
  onClose: () => void;
  onSave: (idea: PlaceIdea) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const duration = value(form, "durationMinutes");
    const input = {
      name: value(form, "name"),
      englishName: optional(value(form, "englishName")),
      cityId: optional(value(form, "cityId")),
      type: value(form, "type"),
      status: value(form, "status"),
      address: optional(value(form, "address")),
      durationMinutes: duration ? Number(duration) : undefined,
      mapQuery: optional(value(form, "mapQuery")),
      googleMapsUrl: optional(value(form, "googleMapsUrl")),
      note: optional(value(form, "note")),
    };
    const parsed = placeIdeaSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "請檢查景點資料。");
      return;
    }
    const city = cities.find((entry) => entry.id === parsed.data.cityId);
    setSaving(true);
    try {
      await onSave({
        id: item?.id ?? createId("idea"),
        ...parsed.data,
        mapQuery: parsed.data.mapQuery || `${parsed.data.name} ${city?.englishName ?? city?.name ?? ""}`.trim(),
        scheduledDayIds: item?.scheduledDayIds ?? [],
        sortOrder: item?.sortOrder ?? nextSortOrder,
        createdAt: item?.createdAt,
        updatedAt: item?.updatedAt,
        updatedBy: item?.updatedBy,
        latitude: item?.latitude,
        longitude: item?.longitude,
      });
      toast.success(item ? "收藏已更新" : "景點已加入收藏");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open={open} onClose={onClose} title={item ? "編輯收藏景點" : "新增收藏景點"} description="貼上 Google Maps 網址，或填寫可搜尋的景點名稱。" footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button form="place-idea-form" type="submit" loading={saving}>儲存</Button></>}>
    <form id="place-idea-form" className="grid-form" onSubmit={submit}>
      <Field label="景點名稱"><input className="input" name="name" defaultValue={item?.name} required /></Field>
      <Field label="英文名稱"><input className="input" name="englishName" defaultValue={item?.englishName} /></Field>
      <Field label="城市"><select className="select" name="cityId" defaultValue={item?.cityId ?? ""}><option value="">未分類</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></Field>
      <Field label="類型"><select className="select" name="type" defaultValue={item?.type ?? "sight"}>{Object.entries(placeTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <Field label="收藏狀態"><select className="select" name="status" defaultValue={item?.status ?? "want_to_go"}>{Object.entries(placeIdeaStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <Field label="預估停留（分鐘）"><input className="input" name="durationMinutes" type="number" min="0" max="1440" defaultValue={item?.durationMinutes} /></Field>
      <Field label="Google Maps 網址" className="span-2"><input className="input" name="googleMapsUrl" type="url" placeholder="https://maps.app.goo.gl/..." defaultValue={item?.googleMapsUrl} /></Field>
      <Field label="Google Maps 搜尋文字" className="span-2"><input className="input" name="mapQuery" placeholder="例如 Prague Castle" defaultValue={item?.mapQuery} /></Field>
      <Field label="地址" className="span-2"><input className="input" name="address" defaultValue={item?.address} /></Field>
      <Field label="備註" className="span-2"><textarea className="textarea" name="note" defaultValue={item?.note} /></Field>
    </form>
  </Dialog>;
}

export function SchedulePlaceIdeaDialog({
  open,
  idea,
  days,
  cities,
  onClose,
  onSchedule,
}: {
  open: boolean;
  idea?: PlaceIdea | null;
  days: TripDay[];
  cities: City[];
  onClose: () => void;
  onSchedule: (dayId: string) => Promise<void>;
}) {
  const [selectedDayId, setSelectedDayId] = useState("");
  const [saving, setSaving] = useState(false);
  const sortedDays = useMemo(() => [...days].sort((a, b) => {
    const cityPriority = Number(b.cityId === idea?.cityId) - Number(a.cityId === idea?.cityId);
    return cityPriority || a.date.localeCompare(b.date);
  }), [days, idea?.cityId]);
  const cityById = Object.fromEntries(cities.map((city) => [city.id, city]));

  async function submit() {
    if (!selectedDayId) return;
    setSaving(true);
    try {
      await onSchedule(selectedDayId);
      toast.success("已排入行程");
      setSelectedDayId("");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "排入行程失敗");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open={open} onClose={onClose} title={`排入行程${idea ? `・${idea.name}` : ""}`} description="同城市日期會優先顯示；已排入的日期不可重複選擇。" footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button disabled={!selectedDayId} loading={saving} onClick={() => void submit()}><CalendarPlus size={16} />排入日期</Button></>}>
    <div className="space-y-2">
      {sortedDays.map((day) => {
        const scheduled = idea?.scheduledDayIds.includes(day.id) ?? false;
        const selected = selectedDayId === day.id;
        return <button key={day.id} type="button" disabled={scheduled} onClick={() => setSelectedDayId(day.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-[#1f6a4a] bg-[#e2eee7]" : "border-[#dfe2dd] bg-white hover:border-[#9ab9a8]"} disabled:cursor-not-allowed disabled:opacity-55`}>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#1f6a4a] text-white" : "bg-[#edf0ec] text-[#58645d]"}`}>{selected || scheduled ? <Check size={16} /> : day.dayNumber}</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{day.title}</span><span className="mt-0.5 block text-xs text-[#758079]">{cityById[day.cityId]?.name ?? day.cityId}・{formatTripDate(day.date)}</span></span>
          {scheduled && <span className="text-xs font-bold text-[#1f6a4a]">已排</span>}
        </button>;
      })}
    </div>
  </Dialog>;
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="field-label">{label}</span>{children}</label>;
}
