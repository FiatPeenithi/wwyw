// app/lib/parse.ts

export function getCategoryListFromTripCategory(
  raw: string
): Array<{ id: string; name: string }> {
  if (!raw) return [];

  return raw
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const m = part.match(/^(\d+)\s*-\s*(.+)$/);
      if (m) {
        return { id: m[1], name: m[2].trim() };
      }
      const fallback = part.match(/^(\d+)\s*(.*)$/);
      return {
        id: fallback?.[1] ?? "",
        name: fallback?.[2]?.trim() || part,
      };
    })
    .filter((x) => x.id);
}

// ⬇️ helper ใหม่: ใช้พาร์ส "เฉพาะ id" เพื่อให้ชื่อไปดึงจากแท็บ category
export function getCategoryIdsFromTripCategory(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const withDash = part.match(/^(\d+)\s*-\s*.+$/);
      if (withDash) return withDash[1];
      const onlyNumber = part.match(/^(\d+)/);
      return onlyNumber?.[1] ?? "";
    })
    .filter(Boolean);
}
