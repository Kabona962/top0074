"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { addFridgeItem, deleteFridgeItem, listFridge, suggestRecipes, type FridgeItem } from "@/lib/api";

export default function FridgePage() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [exp, setExp] = useState("");
  const [pref, setPref] = useState("");
  const [recipeMd, setRecipeMd] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoadErr(null);
    try {
      setItems(await listFridge());
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : "목록 로드 실패");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await addFridgeItem({
        name: name.trim(),
        quantity: qty.trim() || null,
        expiry_note: exp.trim() || null,
      });
      setName("");
      setQty("");
      setExp("");
      await refresh();
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    setBusy(true);
    try {
      await deleteFridgeItem(id);
      await refresh();
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  async function onSuggest() {
    setBusy(true);
    setRecipeMd(null);
    setModel(null);
    try {
      const r = await suggestRecipes(pref.trim() || null);
      setRecipeMd(r.recipe_markdown);
      setModel(r.model_used);
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : "레시피 요청 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-moss-900">냉장고 관리 & 레시피</h1>
        <p className="mt-2 text-sm text-stone-600">
          재료를 등록한 뒤, Ollama가 재료 소진 위주로 요리를 제안합니다.
        </p>
      </div>

      {loadErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 whitespace-pre-wrap">
          {loadErr}
        </div>
      )}

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-moss-900">재료 추가</h2>
        <form onSubmit={onAdd} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm sm:col-span-1">
            <span className="mb-1 block text-stone-600">이름</span>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="text-sm sm:col-span-1">
            <span className="mb-1 block text-stone-600">수량</span>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="300g, 2개..."
            />
          </label>
          <label className="text-sm sm:col-span-1">
            <span className="mb-1 block text-stone-600">유통 메모</span>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              placeholder="3일 안에"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-moss-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-moss-900">내 냉장고</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm text-moss-700 underline-offset-2 hover:underline"
          >
            새로고침
          </button>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">아직 재료가 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{it.name}</p>
                  <p className="text-stone-600">
                    {it.quantity}
                    {it.expiry_note ? ` · ${it.expiry_note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(it.id)}
                  disabled={busy}
                  className="shrink-0 text-red-600 hover:underline disabled:opacity-50"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-moss-900">레시피 추천</h2>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-stone-600">선호/제약 (선택)</span>
          <input
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-moss-700"
            value={pref}
            onChange={(e) => setPref(e.target.value)}
            placeholder="예: 맵기 약하게, 한식 위주"
          />
        </label>
        <button
          type="button"
          onClick={() => void onSuggest()}
          disabled={busy}
          className="mt-4 rounded-lg bg-moss-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "생성 중…" : "레시피 받기"}
        </button>
        {model && <p className="mt-2 text-xs text-stone-500">모델: {model}</p>}
        {recipeMd && (
          <div className="mt-4 prose prose-stone max-w-none border-t border-stone-100 pt-4">
            <ReactMarkdown>{recipeMd}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}
