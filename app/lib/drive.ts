// /lib/drive.ts
import { google } from "googleapis";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GOOGLE_PRIVATE_KEY_ID = process.env.GOOGLE_PRIVATE_KEY_ID || undefined;

function assertDriveEnv() {
  const missing: string[] = [];
  if (!GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (missing.length) throw new Error(`Missing ENV: ${missing.join(", ")}`);
}

function extractFolderId(input: string) {
  // รองรับทั้งลิงก์แบบเต็มและใส่เป็น id ตรงๆ
  const m = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : input.trim();
}

async function getDriveClient() {
  assertDriveEnv();
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    keyId: GOOGLE_PRIVATE_KEY_ID,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  await auth.authorize();
  return google.drive({ version: "v3", auth });
}

export type DriveImage = {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink: string;
  webContentLink?: string; // สำหรับดาวน์โหลดโดยตรง (ถ้าต้องใช้)
  createdTime?: string;
};

export async function listImagesInFolder(folderLinkOrId: string): Promise<DriveImage[]> {
  const folderId = extractFolderId(folderLinkOrId);
  const drive = await getDriveClient();

  // ดึงเฉพาะไฟล์รูป และรองรับ Shared drives
  const fields = "nextPageToken, files(id,name,thumbnailLink,webViewLink,webContentLink,createdTime,mimeType)";
  const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;

  let pageToken: string | undefined = undefined;
  const out: DriveImage[] = [];

  do {
    const { data } = await drive.files.list({
      q,
      fields,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: "createdTime", // เก่าก่อนไปใหม่
      pageToken,
    });
    (data.files || []).forEach(f => {
      out.push({
        id: f.id!,
        name: f.name!,
        thumbnailLink: f.thumbnailLink || undefined,
        webViewLink: f.webViewLink!,
        webContentLink: f.webContentLink || undefined,
        createdTime: f.createdTime || undefined,
      });
    });
    pageToken = data.nextPageToken || undefined;
  } while (pageToken);

  return out;
}
