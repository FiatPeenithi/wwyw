export const navigationUri = (
  originVal: string | number,
  destVal: string | number,
  lat2?: string | number, // Optional, for backward compatibility or explicit lat/lng pairs
  lng2?: string | number
): string => {
  // Overloading-like logic:
  // If lat2/lng2 are provided, we assume parsing (lat1, lng1, lat2, lng2)
  // Otherwise we assume (originString, destinationString)

  let origin = String(originVal);
  let destination = String(destVal);

  if (lat2 !== undefined && lng2 !== undefined) {
    origin = `${originVal},${destVal}`;
    destination = `${lat2},${lng2}`;
  }

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving"
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
