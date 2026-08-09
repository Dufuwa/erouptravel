import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="card flex flex-col items-center px-6 py-14 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e7ece8] text-[#526159]"><Icon size={22} /></div><h3 className="m-0 text-lg font-extrabold">{title}</h3><p className="mt-2 mb-5 max-w-md text-sm leading-6 text-[#6b746f]">{description}</p>{action}</div>;
}
