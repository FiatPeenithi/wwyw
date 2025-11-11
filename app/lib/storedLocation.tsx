type StoredLocation = {
  lat: number;
  lng: number;
  name?: string;
  source: "current" | "pin" | "search";
  savedAt: number;
};

export const getLocation = (): StoredLocation | null => {
  const raw = localStorage.getItem("startLocation");
  if (!raw) return null; // ยังไม่เคยเซฟ

  try {
    const parsed = JSON.parse(raw) as StoredLocation;

    // ตรวจสอบความถูกต้องขั้นต่ำ
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      typeof parsed.source === "string" &&
      typeof parsed.savedAt === "number"
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null; // JSON เสีย/ไม่ตรงฟอร์แมต
  }
};
