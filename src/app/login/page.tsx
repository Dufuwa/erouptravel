"use client";

import { AlertCircle, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-dvh place-items-center"><div className="skeleton h-12 w-48" /></main>}><LoginContent /></Suspense>;
}

function LoginContent() {
  const { user, loading, signIn, configured } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => { if (!loading && user) router.replace(params.get("next") ?? "/trip/central-europe-2027/today"); }, [loading, user, router, params]);
  return <main className="grid min-h-dvh lg:grid-cols-[1.05fr_.95fr]">
    <section className="flex flex-col justify-between bg-[#1d5e43] p-7 text-white sm:p-12 lg:p-16">
      <div className="flex items-center gap-2 text-xs font-black tracking-[.14em]"><MapPin size={17} />CENTRAL EUROPE · 2027</div>
      <div className="my-16 max-w-2xl"><p className="mb-4 text-sm font-bold text-[#bcd9c9]">17 DAYS · 7 CITIES · 3 COUNTRIES</p><h1 className="m-0 text-5xl leading-[1.02] font-black tracking-[-.055em] sm:text-7xl">一起把旅程<br />準備得更從容。</h1><p className="mt-7 max-w-xl text-base leading-8 text-[#d4e5db]">從布拉格走到維也納。行程、住宿、車票與待辦，都在旅伴共享的一個地方。</p></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#c5ddcf]"><span>布拉格</span><span>Český Krumlov</span><span>薩爾斯堡</span><span>湖區</span><span>布達佩斯</span><span>維也納</span></div>
    </section>
    <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-md"><span className="eyebrow">TRAVEL WORKSPACE</span><h2 className="page-title mt-3">歡迎回來</h2><p className="mb-8 leading-7 text-[#6b746f]">請使用受邀的 Google 帳號登入。只有旅伴名單中的帳號可以查看與編輯內容。</p>
      <Button className="h-13 w-full text-base" loading={submitting || loading} onClick={async () => {
        setSubmitting(true);
        setErrorMessage("");
        try {
          await signIn();
        } catch (error) {
          setErrorMessage(getAuthErrorMessage(error));
        } finally {
          setSubmitting(false);
        }
      }}>{configured ? "使用 Google 帳號繼續" : "進入本機展示模式"}<ArrowRight size={18} /></Button>
      {errorMessage && <div role="alert" className="mt-4 flex gap-3 rounded-xl bg-[#fff0ef] p-4 text-sm leading-6 text-[#8f302c]"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{errorMessage}</span></div>}
      <div className="mt-8 space-y-4 border-t border-[#dfe2dd] pt-7">{[[ShieldCheck,"僅限受邀旅伴"],[CheckCircle2,"共同更新行程與待辦"]].map(([Icon,text]) => { const C = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 text-sm font-bold text-[#53605a]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4eee8] text-[#1f6a4a]"><C size={17} /></div>{String(text)}</div>; })}</div>
      {!configured && <p className="mt-6 rounded-xl bg-[#fff0d6] p-3 text-xs leading-5 text-[#805018]">尚未設定 Firebase 環境變數，目前自動使用瀏覽器本機資料，方便開發與預覽。</p>}
    </div></section>
  </main>;
}
