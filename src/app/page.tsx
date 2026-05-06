import Link from "next/link";

const features = [
  {
    href: "/price",
    emoji: "🥬",
    title: "농산물 가격 참고",
    desc: "시세 흐름을 숫자로 정리하고, 지금 살지 말지 AI가 함께 설명해요.",
    accent: "from-leaf-50 to-white",
    ring: "ring-leaf-200/80",
  },
  {
    href: "/fridge",
    emoji: "🧊",
    title: "냉장고 & 레시피",
    desc: "남은 재료를 등록하면, 오늘 뭐 해먹을지 레시피를 제안해요.",
    accent: "from-emerald-50/90 to-white",
    ring: "ring-emerald-200/70",
  },
  {
    href: "/farm-calendar",
    emoji: "🌱",
    title: "농가 달력",
    desc: "이번 주·이번 달, 무엇을 심고 어떤 병해충을 조심할지 날짜에 맞춰 안내해요.",
    accent: "from-lime-50/80 to-white",
    ring: "ring-lime-200/70",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-leaf-200/90 bg-gradient-to-br from-white via-leaf-50/80 to-moss-50 px-6 py-10 shadow-lg shadow-leaf-900/10 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-leaf-300/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-moss-700/10 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-leaf-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-leaf-800 shadow-sm">
            <span aria-hidden>✨</span>
            오늘 장 · 냉장고 · 밭일을 한 화면에서
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-moss-900 sm:text-4xl">
            신선한 농산물,
            <span className="block bg-gradient-to-r from-leaf-700 to-moss-800 bg-clip-text text-transparent">
              초록빛으로 만나는 우리 앱
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">
            시장 가격은 숫자로, 집밥은 냉장고 재료로, 밭일은 달력으로. 세 가지가 서로 이어지도록
            초록 톤으로 정리해 두었어요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/price"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-leaf-600 to-moss-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-leaf-900/25 transition hover:brightness-105"
            >
              가격 보러 가기
            </Link>
            <Link
              href="/fridge"
              className="inline-flex items-center justify-center rounded-xl border border-leaf-300 bg-white/90 px-5 py-2.5 text-sm font-semibold text-leaf-800 shadow-sm transition hover:bg-leaf-50"
            >
              냉장고 열기
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="features-heading" className="text-lg font-bold text-moss-900">
              무엇을 도와드릴까요?
            </h2>
            <p className="mt-1 text-sm text-stone-600">기능 세 가지 — 카드를 눌러 바로 이동해요.</p>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.href}>
              <Link
                href={f.href}
                className={`group relative block h-full overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br ${f.accent} p-5 shadow-md shadow-leaf-900/5 ring-1 ${f.ring} transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-leaf-900/10`}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-2xl shadow-sm ring-1 ring-leaf-100"
                  aria-hidden
                >
                  {f.emoji}
                </span>
                <h3 className="mt-4 font-semibold text-moss-900 group-hover:text-leaf-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-leaf-700">
                  열기
                  <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="rounded-2xl border border-leaf-200/60 bg-white/60 px-5 py-4 text-center text-xs text-stone-500 backdrop-blur-sm">
        AI 조언은 참고용이에요. 가격·방제·식품 안전은 공식 정보와 전문가 의견을 함께 확인해 주세요.
      </footer>
    </div>
  );
}
