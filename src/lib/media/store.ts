import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp, { type OutputInfo } from "sharp";
import { ServiceError } from "@/lib/services/contracts";

/*
 * Uploaded images (members' page images). Stored outside public/ in
 * `.data/uploads` (git-ignored) and served by GET /api/media/[file], so files
 * added while the server runs are served in production too. Every upload is
 * re-encoded to WebP (max 2400 px wide), which also strips metadata.
 */

const DIR = join(process.cwd(), ".data", "uploads");
const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const NAME = /^[a-f0-9-]{36}\.webp$/;

export async function saveImage(file: File): Promise<{ src: string; width: number; height: number }> {
  if (!ACCEPTED.has(file.type)) throw new ServiceError("invalid", "Only JPEG, PNG, WebP, AVIF or GIF images");
  if (file.size > MAX_BYTES) throw new ServiceError("invalid", "Image is larger than 15 MB");
  const input = Buffer.from(await file.arrayBuffer());
  let out: { data: Buffer; info: OutputInfo };
  try {
    out = await sharp(input, { animated: false }).rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  } catch {
    throw new ServiceError("invalid", "Not a readable image");
  }
  const name = `${randomUUID()}.webp`;
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, name), out.data);
  return { src: `/api/media/${name}`, width: out.info.width, height: out.info.height };
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!NAME.test(name)) return null;
  try {
    return await readFile(join(DIR, name));
  } catch {
    return null;
  }
}

/** Removes a stored upload by its public src; ignores anything that is not one. */
export async function removeImage(src: string | undefined): Promise<void> {
  const name = src?.startsWith("/api/media/") ? src.slice("/api/media/".length) : "";
  if (NAME.test(name)) await unlink(join(DIR, name)).catch(() => undefined);
}
