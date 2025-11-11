// /app/api/proxy-drive-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const imageId = req.nextUrl.searchParams.get("id");
  if (!imageId) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  const driveUrl = `https://drive.google.com/uc?export=download&id=${imageId}`;

  try {
    const response = await fetch(driveUrl);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const contentLength = response.headers.get("content-length") ?? undefined;

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, immutable",
    });
    if (contentLength) headers.set("Content-Length", contentLength);

    // ใช้ Web ReadableStream ตรง ๆ
    return new NextResponse(response.body, { headers });
    // หรือจะ return new Response(response.body, { headers }) ก็ได้
  } catch {
    return new NextResponse("Internal Server Error fetching drive image", {
      status: 500,
    });
  }
}
