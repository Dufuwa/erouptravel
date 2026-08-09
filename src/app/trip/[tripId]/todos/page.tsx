"use client";

import { Check, CheckSquare2, Circle, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTrip } from "@/contexts/trip-context";
import { priorityLabels, todoCategoryLabels, todoStatusLabels } from "@/lib/labels";
import { formatUpdatedAt } from "@/lib/utils";
import type { Todo } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TodoEditor } from "@/components/todo-editor";

export default function TodosPage() {
  const { workspace,online,upsertEntity,deleteEntity } = useTrip();
  const [search,setSearch] = useState(""); const [category,setCategory] = useState("all"); const [status,setStatus] = useState("active"); const [editing,setEditing] = useState<Todo | null | undefined>(undefined);
  const todos = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return workspace.todos
      .filter((todo) =>
        (category === "all" || todo.category === category) &&
        (status === "all" || (status === "active" ? !["completed", "not_applicable"].includes(todo.status) : todo.status === status)) &&
        `${todo.title} ${todo.city ?? ""} ${todo.nextAction ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || (a.recommendedCompleteDate ?? "9999").localeCompare(b.recommendedCompleteDate ?? "9999"));
  }, [workspace.todos, category, status, search]);
  const completed = workspace.todos.filter((todo)=>todo.status==="completed").length;
  const progress = Math.round((completed / workspace.todos.length) * 100);

  async function toggle(todo:Todo) { try { await upsertEntity("todos",{...todo,status:todo.status === "completed" ? "not_started" : "completed"}); } catch(error) { toast.error(error instanceof Error ? error.message : "更新失敗"); } }
  async function remove(todo:Todo) { if(!confirm(`確定刪除「${todo.title}」？`)) return; try { await deleteEntity("todos",todo); toast.success("待辦已刪除"); } catch(error) { toast.error(error instanceof Error ? error.message : "刪除失敗"); } }

  return <div className="page-wrap"><header className="page-header"><div><span className="eyebrow">PRE-TRIP CHECKLIST</span><h1 className="page-title">行前待辦</h1><p className="page-description">從住宿到票券，把準備進度一項項收好。</p></div><Button disabled={!online} onClick={() => setEditing(null)}><Plus size={16}/>新增待辦</Button></header>
    <section className="card mb-6 p-5 sm:p-6"><div className="mb-3 flex items-end justify-between"><div><div className="text-xs font-bold text-[#748079]">整體完成度</div><div className="mt-1 text-2xl font-black">{completed} <span className="text-sm font-bold text-[#7a837e]">/ {workspace.todos.length} 項</span></div></div><div className="text-3xl font-black tracking-[-.04em] text-[#1f6a4a]">{progress}%</div></div><div className="h-2 overflow-hidden rounded-full bg-[#e7eae6]"><div className="h-full rounded-full bg-[#1f6a4a] transition-all" style={{width:`${progress}%`}} /></div></section>
    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]"><label className="relative"><Search size={17} className="absolute top-3 left-3.5 text-[#7c8680]"/><input className="input pl-10" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="搜尋待辦、城市或下一步" /></label><select className="select md:w-36" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="all">全部分類</option><option value="accommodation">住宿</option><option value="transport">交通</option><option value="ticket">票券</option><option value="other">其他</option></select><select className="select md:w-36" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="active">尚未完成</option><option value="completed">已完成</option><option value="in_progress">進行中</option><option value="not_started">未開始</option><option value="not_applicable">不適用</option><option value="all">全部狀態</option></select></div>
    <div className="space-y-3">{todos.map((todo) => <article key={todo.id} className={`card group flex gap-4 p-4 sm:p-5 ${todo.status === "completed" ? "opacity-65" : ""}`}><button disabled={!online} onClick={() => void toggle(todo)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${todo.status === "completed" ? "border-[#1f6a4a] bg-[#1f6a4a] text-white" : "border-[#b9c1bc] text-transparent hover:border-[#1f6a4a]"}`} aria-label={todo.status === "completed" ? "標示未完成" : "標示完成"}>{todo.status === "completed" ? <Check size={15}/> : <Circle size={12}/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone="neutral">{todoCategoryLabels[todo.category]}</Badge><Badge tone={todo.priority === "high" ? "red" : todo.priority === "medium" ? "amber" : "neutral"}>{priorityLabels[todo.priority]}優先</Badge><span className="text-[11px] text-[#89918d]">{todoStatusLabels[todo.status]}</span></div><h2 className={`mt-2 mb-1 text-base font-extrabold ${todo.status === "completed" ? "line-through" : ""}`}>{todo.title}</h2>{todo.nextAction && <p className="mt-1 mb-2 text-sm leading-6 text-[#65706a]">{todo.nextAction}</p>}<div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#858d88]">{todo.city && <span>{todo.city}</span>}{todo.recommendedCompleteDate && <span>{todo.recommendedCompleteDate} 前</span>}<span>{formatUpdatedAt(todo.updatedAt)}{todo.updatedBy && ` · ${todo.updatedBy.name}`}</span></div></div><div className="flex shrink-0 flex-col gap-1 sm:flex-row"><Button variant="ghost" size="icon" disabled={!online} onClick={()=>setEditing(todo)} aria-label="編輯"><Edit3 size={15}/></Button><Button variant="ghost" size="icon" disabled={!online} onClick={()=>void remove(todo)} aria-label="刪除"><Trash2 size={15}/></Button></div></article>)}</div>
    {todos.length === 0 && <EmptyState icon={CheckSquare2} title="找不到待辦" description="調整搜尋或篩選條件，也可以新增一項準備工作。" action={<Button onClick={()=>setEditing(null)}><Plus size={16}/>新增待辦</Button>} />}
    <TodoEditor open={editing !== undefined} item={editing} onClose={()=>setEditing(undefined)} onSave={async(item)=>upsertEntity("todos",{...item,sortOrder:item.sortOrder ?? workspace.todos.length})}/>
  </div>;
}
