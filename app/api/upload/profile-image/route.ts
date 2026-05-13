import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

function extensionFromMime(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");
    if (!(rawFile instanceof File)) {
      return NextResponse.json({ success: false, error: { message: "No file uploaded." } }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(rawFile.type)) {
      return NextResponse.json({ success: false, error: { message: "Only JPG, PNG, or WEBP allowed." } }, { status: 400 });
    }
    if (rawFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: { message: "File size must be 2MB or less." } }, { status: 400 });
    }

    const bytes = Buffer.from(await rawFile.arrayBuffer());
    const extension = extensionFromMime(rawFile.type);
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), bytes);

    const relativeUrl = `/uploads/profile/${fileName}`;
    const baseUrl = new URL(request.url).origin;
    const publicUrl = `${baseUrl}${relativeUrl}`;

    return NextResponse.json({
      success: true,
      data: {
        relativeUrl,
        publicUrl,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Upload failed." } }, { status: 500 });
  }
}

