export interface Node {
  id: string;
  name: string;
  parentId: string | null;
  type: "folder" | "file";
  description: string;
}

export interface File {
  id: string;
  path: string;
  name: string;
  content?: string;
  language?: string;
}
