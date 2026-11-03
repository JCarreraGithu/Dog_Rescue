import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { IntakeError } from "@/lib/intake-validation";

export const MAX_REPORT_IMAGE_BYTES = 8 * 1024 * 1024;
export const REPORT_IMAGE_CHUNK_BYTES = 2 * 1024 * 1024;
export function imageContentType(bytes: Uint8Array) {
  const data = Buffer.from(bytes);
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (/^GIF8[79]a/.test(data.subarray(0, 6).toString('ascii'))) return "image/gif";
  if (data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') return "image/webp";
  throw new IntakeError("La imagen debe ser JPG, PNG, WEBP o GIF.");
}
export async function uploadReportImage(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) throw new IntakeError("No se recibió una imagen válida.");
  if (file.size > REPORT_IMAGE_CHUNK_BYTES) throw new IntakeError("El fragmento de imagen supera 2 MB.", 413);
  const totalSize = Number(form.get("totalSize") ?? file.size), offset = Number(form.get("offset") ?? 0);
  if (!Number.isSafeInteger(totalSize) || totalSize <= 0 || totalSize > MAX_REPORT_IMAGE_BYTES) throw new IntakeError("La imagen supera el límite de 8 MB.", 413);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + file.size > totalSize) throw new IntakeError("Fragmento de imagen no válido.");
  const content = new Uint8Array(await file.arrayBuffer());
  const uploadId = form.get("uploadId");
  if (!uploadId) {
    if (offset !== 0) throw new IntakeError("Falta el inicio de la imagen.");
    const uploadToken = crypto.randomBytes(32).toString('hex');
    const complete = content.length === totalSize;
    const row = await prisma.reportImage.create({ data: { content, contentType: imageContentType(content), totalSize, received: content.length, uploadTokenHash: complete ? null : crypto.createHash('sha256').update(uploadToken).digest('hex') } });
    return complete ? { url: `/api/case-reports/images/${row.id}` } : { uploadId: row.id, uploadToken, received: row.received };
  }
  const token = form.get("uploadToken");
  if (typeof uploadId !== 'string' || !/^[0-9a-f-]{36}$/i.test(uploadId) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new IntakeError("Carga de imagen no válida.");
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return prisma.$transaction(async tx => {
    const row = await tx.reportImage.findUnique({ where: { id: uploadId } });
    if (!row || row.uploadTokenHash !== tokenHash || row.received !== offset || row.totalSize !== totalSize) throw new IntakeError("La carga de imagen cambió o no es válida.", 409);
    const received = offset + content.length, complete = received === totalSize;
    const result = await tx.reportImage.updateMany({ where: { id: uploadId, received: offset, uploadTokenHash: tokenHash }, data: { content: new Uint8Array(Buffer.concat([row.content, content])), received, ...(complete ? { uploadTokenHash: null } : {}) } });
    if (!result.count) throw new IntakeError("La carga de imagen cambió. Inténtalo de nuevo.", 409);
    return complete ? { url: `/api/case-reports/images/${row.id}` } : { uploadId: row.id, uploadToken: token, received };
  });
}
