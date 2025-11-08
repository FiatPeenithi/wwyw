
// app/components/main-layout.tsx
"use client";

import React from "react";
import NavBar from "./nav-bar";

export type MainLayoutProps = {
  /** Page content */
  children: React.ReactNode;
  /** Optional: constrain content width and add page padding */
  container?: boolean;
  /** Optional: extra classes for the <main> area */
  mainClassName?: string;
  /** When true, show loading UI inside <main> instead of children */
  loading?: boolean;
  /** Optional custom loading UI. Shown when `loading` is true. */
  loadingSlot?: React.ReactNode;
};

export default function MainLayout({
  children,
  container = true,
  mainClassName = "",
  loading = false,
  loadingSlot,
}: MainLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#F2F0EF] text-slate-900">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 backdrop-blur">
        <NavBar />
      </header>

      {/* Main content */}
      <main
        id="content"
        aria-busy={loading}
        className={`${
          container ? "container mx-auto px-4 sm:px-6 lg:px-8" : ""
        } flex-1 w-full py-6 ${mainClassName}`}
      >
        {loading ? (
          loadingSlot ?? (
            <div className="flex items-center gap-3 text-slate-500">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
              <span>Loading…</span>
            </div>
          )
        ) : (
          children
        )}
      </main>
    </div>
  );
}