// components/ReviewForm.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

export default function ReviewForm({
  tripId,
  onSubmitted,
}: {
  tripId: string;
  onSubmitted?: () => void;
}) {
  const locale = useLocale();
  const tDup = useMemo(
    () => (locale?.startsWith("th") ? "Email ที่ใช้งานเคยรีวิวทริปนี้ไปแล้ว" : "This email used to review a trip"),
    [locale]
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    comment: "",
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // duplicate email state
  const [dupChecking, setDupChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // lightweight client-side validation (aesthetic-usability / error prevention)
  const emailValid = /.+@.+\..+/.test(form.email);
  const nameValid = form.name.trim().length >= 2;
  const commentValid = form.comment.trim().length >= 10;
  const canSubmit = nameValid && emailValid && commentValid && !submitting && !isDuplicate;

  const sanitizeEmail = (v: string) => v.trim().toLowerCase();

  async function checkDuplicateEmail() {
    const email = sanitizeEmail(form.email);
    if (!email || !emailValid) {
      setIsDuplicate(false);
      return false;
    }
    setDupChecking(true);
    try {
      const res = await fetch(`/api/reviews?tripId=${encodeURIComponent(tripId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("fetch error");
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const dup = items.some((r: any) => String(r?.email || "").toLowerCase() === email);
      setIsDuplicate(dup);
      return dup;
    } catch (e) {
      // ไม่บล็อคการส่งกรณีเช็คไม่ได้ แต่ก็ไม่ตั้ง dup
      setIsDuplicate(false);
      return false;
    } finally {
      setDupChecking(false);
    }
  }

  // Auto-check when email changes and looks valid (debounced)
  useEffect(() => {
    if (!emailValid) {
      setIsDuplicate(false);
      return;
    }
    const id = setTimeout(() => {
      checkDuplicateEmail();
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email, tripId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    // final duplicate guard right before submit
    const dup = await checkDuplicateEmail();
    if (dup) {
      setIsError(true);
      setMessage(tDup);
      return;
    }

    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          trip_id: tripId,
          rating: Number(form.rating),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(locale?.startsWith("th") ? "ส่งรีวิวเรียบร้อย ขอบคุณครับ" : "Review submitted. Thank you!");
        setIsError(false);
        setForm({ name: "", email: "", comment: "", rating: 5 });
        setIsDuplicate(false);
        onSubmitted?.();
      } else {
        setMessage(data?.error || (locale?.startsWith("th") ? "ส่งไม่สำเร็จ" : "Submit failed"));
        setIsError(true);
      }
    } catch (err) {
      setMessage(locale?.startsWith("th") ? "มีข้อขัดข้องในการเชื่อมต่อ ลองใหม่อีกครั้ง" : "Network error, please try again");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-lg font-semibold text-slate-900">{locale?.startsWith("th") ? "เขียนรีวิว" : "Write a review"}</div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm text-slate-600">{locale?.startsWith("th") ? "ชื่อ" : "Name"}</label>
          <input
            required
            placeholder={locale?.startsWith("th") ? "เช่น กิตติ" : "e.g., John"}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-amber-500/30 transition focus:ring-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {!nameValid && (
            <p className="text-xs text-amber-700">{locale?.startsWith("th") ? "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" : "Please enter at least 2 characters"}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-slate-600">{locale?.startsWith("th") ? "อีเมล" : "Email"}</label>
          <input
            required
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full rounded-xl border px-3 py-2 text-slate-900 outline-none ring-amber-500/30 transition focus:ring-2 ${
              isDuplicate ? "border-amber-400 bg-amber-50" : "border-slate-300 bg-white"
            }`}
            value={form.email}
            onBlur={checkDuplicateEmail}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, email: v }));
            }}
          />
          {!emailValid && (
            <p className="text-xs text-amber-700">{locale?.startsWith("th") ? "รูปแบบอีเมลไม่ถูกต้อง" : "Invalid email format"}</p>
          )}
          {emailValid && (dupChecking || isDuplicate) && (
            <p className={`text-xs ${isDuplicate ? "text-amber-700" : "text-slate-500"}`}>
              {dupChecking ? (locale?.startsWith("th") ? "กำลังตรวจสอบ..." : "Checking...") : tDup}
            </p>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <label className="block text-sm text-slate-600">{locale?.startsWith("th") ? "คอมเมนต์" : "Comment"}</label>
        <textarea
          required
          rows={4}
          maxLength={600}
          placeholder={
            locale?.startsWith("th")
              ? "เล่าประสบการณ์การเดินทาง จุดเด่นที่ชอบ หรือสิ่งที่อยากให้ปรับปรุง"
              : "Share your experience, highlights, or things to improve"
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-amber-500/30 transition focus:ring-2"
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className={commentValid ? "" : "text-amber-700"}>
            {locale?.startsWith("th") ? "อย่างน้อย 10 ตัวอักษร" : "At least 10 characters"}
          </span>
          <span>{form.comment.length}/600</span>
        </div>
      </div>

      {/* Star rating – replace select for direct manipulation */}
      <div className="space-y-2">
        <label className="block text-sm text-slate-600">{locale?.startsWith("th") ? "ให้คะแนน" : "Rating"}</label>
        <StarRating
          value={form.rating}
          onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
          disabled={submitting}
        />
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <button
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-medium text-white shadow-sm ring-1 ring-amber-400/40 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? (locale?.startsWith("th") ? "กำลังส่ง..." : "Submitting...") : (locale?.startsWith("th") ? "ส่งรีวิว" : "Submit review")}
        </button>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border p-3 text-sm ${
              isError
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </form>
  );
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  // keyboard-friendly radio-like group (Fitts's, feedback, consistency)
  return (
    <div
      role="radiogroup"
      aria-label="ให้คะแนน"
      className="inline-flex select-none items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2"
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(5, value + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.max(1, value - 1));
        }
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${n} ดาว`}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`grid h-9 w-9 place-items-center rounded-xl transition active:scale-95 ${
              active
                ? "bg-amber-50 ring-1 ring-amber-200"
                : "hover:bg-slate-100"
            } disabled:opacity-40`}
          >
            <Star
              className={`h-5 w-5 ${
                active ? "fill-amber-400 text-amber-400" : "text-slate-300"
              }`}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-slate-700">{value}/5</span>
    </div>
  );
}
