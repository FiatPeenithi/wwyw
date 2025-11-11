// app/lib/mapsNavigation.ts

export const navigationUri = (
  lat1?: number | string,
  lng1?: number | string,
  lat2?: number | string,
  lng2?: number | string
): string => {
  const origin = `${lat1},${lng1}`;
  const destination = `${lat2},${lng2}`;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving"
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
