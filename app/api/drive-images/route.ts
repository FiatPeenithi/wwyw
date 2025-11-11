// /app/api/drive-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listImagesInFolder } from "@/app/lib/drive";

export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get("folder");
  if (!folder) return NextResponse.json({ error: "Missing folder param" }, { status: 400 });

  try {
    const images = await listImagesInFolder(folder);
    // ส่งแค่ที่จำเป็น
    return NextResponse.json(images.map(i => ({
      id: i.id,
      name: i.name,
      view: i.webViewLink,
      // รูปจริงสำหรับ <img>: ใช้ endpoint ของไฟล์
      // https://drive.google.com/uc?id=<ID> เป็นทางลัดง่ายๆ
     src: `/api/proxy-drive-image?id=${i.id}`,
      thumb: i.thumbnailLink ?? `https://drive.google.com/thumbnail?sz=w200&id=${i.id}`,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Drive error" }, { status: 500 });
  }
}
