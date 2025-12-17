"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

interface ExpandableTextProps {
    children: string;
    className?: string;
    initialLines?: number;
}

export default function ExpandableText({
    children,
    className = "",
    initialLines = 3,
}: ExpandableTextProps) {
    const [expanded, setExpanded] = useState(false);
    const locale = useLocale();

    if (!children) return null;

    // Simple heuristic: if text is short enough, don't show expanding logic
    // This is an estimation. For strict line counting, we'd need ResizeObserver/layout checks,
    // but character count is usually "good enough" for this level of UI.
    // ~100 chars per line on desktop, maybe ~40-50 on mobile.
    // Let's say if < 150 chars, just show it.
    if (children.length < 150) {
        return <p className={`whitespace-pre-line ${className}`}>{children}</p>;
    }

    const t = {
        readMore: locale === "en" ? "Read more" : "อ่านเพิ่มเติม",
        readLess: locale === "en" ? "Show less" : "ย่อ",
    };

    return (
        <div className={className}>
            <p
                className={`whitespace-pre-line text-slate-700 leading-relaxed transition-all ${expanded ? "" : `line-clamp-${initialLines}`
                    }`}
            >
                {children}
            </p>
            <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-sm font-medium text-amber-600 hover:text-amber-700 active:text-amber-800 transition-colors"
            >
                {expanded ? t.readLess : t.readMore}
            </button>
        </div>
    );
}
