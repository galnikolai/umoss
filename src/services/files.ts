import { fetchFileContent, uploadFile } from "../api/index.js";

const fileContentCache = new Map(); // id -> { content, language }

export function getCachedFileContent(fileId: string) {
  return fileContentCache.get(fileId) || null;
}

export async function getFileContent(fileId: string) {
  const cached = fileContentCache.get(fileId);
  if (cached) return cached;
  const data = await fetchFileContent(fileId);
  const value = { content: data.content, language: data.language };
  fileContentCache.set(fileId, value);
  return value;
}

export function invalidateFileCache(fileId: string) {
  return fileContentCache.delete(fileId);
}

export function clearFileCache() {
  fileContentCache.clear();
}

export async function uploadNewFile({
  file,
  parentId,
  description,
}: {
  file: File;
  parentId: string;
  description: string;
}) {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) formData.append("parentId", parentId);
  if (description) formData.append("description", description);
  const created = await uploadFile(formData);
  return created;
}
