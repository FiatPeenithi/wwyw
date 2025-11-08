// lib/drive-image.ts

export type DriveUrlOptions = {
  /** If true, use Google thumbnail server (fast, resizable). */
  useThumbnail?: boolean;
  /** Only when useThumbnail=true. Example: "w1200" | "w1200-h800" */
  size?: string;
  /** Force download URL (for <a download>). Not for <img>. */
  download?: boolean;
};

/** Extracts the Drive file id from various URL formats */
export function extractDriveFileId(input: string): string | null {
  try {
    // If it's already an id
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;

    const u = new URL(input);
    // Patterns:
    // 1) /file/d/<id>/view
    const m1 = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];

    // 2) uc?export=download&id=<id>
    const idParam = u.searchParams.get("id");
    if (idParam) return idParam;

    // 3) open?id=<id>
    const openId = u.searchParams.get("open?id");
    if (openId) return openId;

    // 4) /thumbnail?sz=...&id=<id>
    const thumbId = u.searchParams.get("id");
    if (thumbId) return thumbId;

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns an image-safe URL from a Drive link or id.
 * - Default uses the `uc?export=view&id=...` endpoint which works in <img> and next/image.
 * - If `useThumbnail` is true, uses the Google thumbnail server (faster; supports sizing via `size`).
 */
export function driveImageUrl(input: string, opts: DriveUrlOptions = {}): string {
  const id = extractDriveFileId(input);
  if (!id) return input; // fallback to original if we can't parse

  const { useThumbnail = false, size, download = false } = opts;

  if (download) {
    // Direct download (not suitable for <img>):
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  if (useThumbnail) {
    // Thumbnail server supports optional size param, e.g. sz=w1200 (or w1200-h800)
    const sz = size ? `&sz=${encodeURIComponent(size)}` : "";
    return `https://drive.google.com/thumbnail?id=${id}${sz}`;
  }

  // Default: embeddable view URL (works for <img> / next/image)
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

/** Convenience: normalizes maybe-nullish into a safe string */
export function s(v: unknown): string { return v == null ? "" : String(v); }

// Example helpers for components
export function driveToNextImageProps(input: string, alt: string, width = 1200, height = 800) {
  return {
    src: driveImageUrl(input, { useThumbnail: true, size: `w${width}` }),
    alt,
    width,
    height,
  } as const;
}

// Quick test cases (uncomment in Node env)
// console.log(driveImageUrl("https://drive.google.com/file/d/1L09CI5NWhSp26eDkoxpw_ZxMTWOB7Wk5/view?usp=sharing"));
// console.log(driveImageUrl("1L09CI5NWhSp26eDkoxpw_ZxMTWOB7Wk5"));
// console.log(driveImageUrl("https://drive.google.com/uc?export=download&id=1L09CI5NWhSp26eDkoxpw_ZxMTWOB7Wk5"));
