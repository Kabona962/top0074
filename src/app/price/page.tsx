"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { analyzePrice } from "@/lib/api";

export default function PricePage() {
  const [name, setName] = useState("사과");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzePrice>> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const data = await analyzePrice(name.trim());
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
        <h1 className="text-2xl font-bold text-moss-900">농산물 가격 · 구매 참고</h1>
        <p className="mt-2 text-sm text-stone-600">
          통계 모듈이 시계열에서 지표를 만들고, Ollama(exaone3.5:2.4b)가 그 근거를 바탕으로 설명합니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium text-stone-700">품목 이름</span>
          <input
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 배추, 감자..."
          />
        </label>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-moss-700 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {loading ? "분석 중…" : "분석하기"}
        </button>
      </form>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 whitespace-pre-wrap">
          {err}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-500">데이터 출처 안내</h2>
            <p className="mt-1 text-sm text-stone-700">{result.data_source_note}</p>
            <p className="mt-3 text-sm">
              <span className="text-stone-500">최신 참고 가격:</span>{" "}
              <span className="font-semibold">
                {result.current_price.toLocaleString()} {result.unit}
              </span>
            </p>
            <p className="mt-1 text-xs text-stone-500">모델: {result.model_used}</p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-500">통계 요약 (백엔드 계산)</h2>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{result.statistics_summary}</pre>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm prose prose-stone max-w-none">
            <h2 className="text-sm font-semibold text-stone-500 !mt-0">AI 참고 의견</h2>
            <ReactMarkdown>{result.recommendation_markdown}</ReactMarkdown>
          </section>
        </div>
      )}
    </div>
  );
}
