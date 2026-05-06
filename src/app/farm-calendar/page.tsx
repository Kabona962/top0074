"use client";

import ReactMarkdown from "react-markdown";
import { useMemo, useState } from "react";
import { fetchFarmCalendarAdvice } from "@/lib/api";

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FarmCalendarPage() {
  const defaultDate = useMemo(() => todayIsoLocal(), []);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [region, setRegion] = useState("");
  const [farmNotes, setFarmNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchFarmCalendarAdvice>> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const data = await fetchFarmCalendarAdvice({
        target_date: targetDate || null,
        region: region.trim() || null,
        farm_notes: farmNotes.trim() || null,
      });
      setResult(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "요청 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-moss-900">농가 달력</h1>
        <p className="mt-2 text-sm text-stone-600">
          선택한 날짜를 기준으로 Ollama가 파종·관리·병해충 주의를 정리합니다. 지역과 농가 메모를 넣으면 더 맞춤에 가깝습니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">기준일</span>
          <input
            type="date"
            className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">지역 (선택)</span>
          <input
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 강원 평지, 전남, 고랭지 배추"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">농가 메모 (선택)</span>
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
            value={farmNotes}
            onChange={(e) => setFarmNotes(e.target.value)}
            placeholder="예: 시설 토마토 300주, 노지 마늘, 텃밭 위주"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-moss-700 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {loading ? "생성 중…" : "달력 조언 받기"}
        </button>
      </form>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 whitespace-pre-wrap">
          {err}
        </div>
      )}

      {result && (
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">
            적용일: <span className="font-medium text-stone-700">{result.applied_date}</span>
            {result.region ? (
              <>
                {" "}
                · 지역: <span className="font-medium text-stone-700">{result.region}</span>
              </>
            ) : null}
            {" "}
            · 모델: {result.model_used}
          </p>
          <div className="mt-4 prose prose-stone max-w-none border-t border-stone-100 pt-4">
            <ReactMarkdown>{result.advice_markdown}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
