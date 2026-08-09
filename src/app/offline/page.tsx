import { CloudOff } from "lucide-react";

export default function OfflinePage() { return <main className="grid min-h-dvh place-items-center p-6"><section className="card max-w-md p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0d6] text-[#8b5514]"><CloudOff /></div><h1 className="text-2xl font-extrabold">目前沒有網路</h1><p className="leading-7 text-[#69736d]">曾在受信任裝置載入的行程可從原本頁面查看；新的頁面需要恢復連線後才能開啟。</p></section></main>; }
