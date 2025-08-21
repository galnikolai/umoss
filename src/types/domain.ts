export interface Node {
  id: string;
  name: string;
  parentId: string | null;
  type: "folder" | "file";
  description: string;
}
