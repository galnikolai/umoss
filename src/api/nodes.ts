import { http } from "./http.js";
import { Node } from "../types/domain.js";

export async function fetchTree() {
  return http.get("/nodes");
}

export async function fetchChildren(id: string) {
  return http.get(`/nodes/${id}/children`);
}

export async function createNode(
  node: Pick<Node, "name" | "type" | "parentId">
) {
  return http.post(`/nodes`, { data: node });
}

export async function updateNode(
  id: string,
  updates: Partial<{
    name: string;
    type: "folder" | "file";
    description: string;
  }>
) {
  return http.put(`/nodes/${id}`, { data: updates });
}

export async function deleteNode(id: string) {
  return http.delete(`/nodes/${id}`);
}
