export type LatLng = { lat: number; lng: number };

// รองรับเลขทศนิยม + ไม่มีทศนิยม
const COORD_RE = /(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/;

// เช็คช่วง lat,lng ให้ถูกต้อง
const isValidLatLng = (lat: number, lng: number) =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export function parseLatLngFromGoogleMapsUrl(urlStr: string): LatLng | null {
  try {
    const url = new URL(urlStr);

    //
    // 1) รูปแบบ @lat,lng,zoom
    //
    const atMatch = urlStr.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (atMatch) {
      const lat = Number(atMatch[1]);
      const lng = Number(atMatch[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    //
    // 2) query parameters เช่น ?q=lat,lng
    //
    const keys = ["q", "query", "center", "ll", "sll"] as const;
    for (const k of keys) {
      const v = url.searchParams.get(k);
      if (!v) continue;

      const m = v.match(COORD_RE);
      if (m) {
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        if (isValidLatLng(lat, lng)) return { lat, lng };
      }
    }

    //
    // 3) lat,lng อยู่ใน pathname เช่น /place/13.7,100.5/
    //
    const pathMatch = url.pathname.match(COORD_RE);
    if (pathMatch) {
      const lat = Number(pathMatch[1]);
      const lng = Number(pathMatch[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    //
    // 4) Pattern inside 'data' param or URL path for !3d...!4d...
    //    Example: !3d13.7563309!4d100.5017651
    //
    const dataLatMatch = urlStr.match(/!3d(-?\d{1,3}(?:\.\d+)?)/);
    const dataLngMatch = urlStr.match(/!4d(-?\d{1,3}(?:\.\d+)?)/);
    if (dataLatMatch && dataLngMatch) {
      const lat = Number(dataLatMatch[1]);
      const lng = Number(dataLngMatch[1]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    //
    // 5) fallback — scan both URL for any lat,lng pattern
    //
    const allMatches = [...urlStr.matchAll(COORD_RE)];
    for (const m of allMatches) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

export function getQueryFromGoogleMapsUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    return url.searchParams.get("q") || url.searchParams.get("query") || null;
  } catch {
    return null;
  }
}
