export async function uploadSpecialCaseForm(input: FormData, endpoint = "/api/special-cases/upload", isPrivate = false): Promise<Response> {
  const file = input.get("file");
  if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024) throw new Error("Selecciona una imagen de hasta 8 MB.");
  let uploadId = "", uploadToken = "";
  for (let offset = 0; offset < file.size; offset += 2 * 1024 * 1024) {
    const form = new FormData();
    form.set("file", file.slice(offset, offset + 2 * 1024 * 1024), file.name);
    form.set("offset", String(offset)); form.set("totalSize", String(file.size));
    if (isPrivate) form.set("private", "true");
    if (uploadId) { form.set("uploadId", uploadId); form.set("uploadToken", uploadToken); }
    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) return response;
    const data = await response.json();
    if (data.url) return Response.json({ url: data.url });
    uploadId = data.uploadId; uploadToken = data.uploadToken;
  }
  throw new Error("La fotografía no terminó de guardarse.");
}
