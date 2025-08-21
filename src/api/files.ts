import { http } from "./http.js";

export async function fetchFileContent(id: string) {
  return http.get(`/files/${id}/content`);
}

export async function uploadFile(formData: FormData) {
  return http.post(`/files/upload`, {
    data: formData,
    content_type: "multipart/form-data",
  });
}
