import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const short = searchParams.get("url");
  if (!short) return NextResponse.json({ error: "missing url" }, { status: 400 });

  // ใช้ server fetch (ไม่มี CORS)
  const res = await fetch(short, { redirect: "follow" });

  return NextResponse.json({ expanded: res.url });
}
