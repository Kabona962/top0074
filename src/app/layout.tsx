import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "시장·냉장고·농가 도우미",
  description: "농산물 가격 참고, 냉장고 레시피, 농가 달력 조언",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-10 border-b border-leaf-200/70 bg-white/85 backdrop-blur-md shadow-sm shadow-leaf-900/5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
            <Link href="/" className="group flex items-center gap-2 font-semibold text-moss-900">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-leaf-100 to-leaf-300 text-lg shadow-inner shadow-white/50 ring-1 ring-leaf-200/80"
                aria-hidden
              >
                🌿
              </span>
              <span className="leading-tight">
                시장·냉장고·농가
                <span className="mt-0.5 block text-[11px] font-normal text-leaf-700/90">신선한 농산 · 집밥 · 밭일</span>
              </span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              <Link
                href="/price"
                className="rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-leaf-100 hover:text-leaf-800"
              >
                가격 참고
              </Link>
              <Link
                href="/fridge"
                className="rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-leaf-100 hover:text-leaf-800"
              >
                냉장고
              </Link>
              <Link
                href="/farm-calendar"
                className="rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-leaf-100 hover:text-leaf-800"
              >
                농가 달력
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
