import { TreeView } from "../ui/index.js";
import {
  getRootNodes,
  getChildrenNodes,
  createNewNode,
} from "../services/index.js";
import { setSelectedNode } from "../store/index.js";
import { Node } from "../types/domain.js";

export default class Tree {
  dataNodes: Node[];
  view: TreeView;

  constructor(
    container: HTMLElement,
    { onFileOpen }: { onFileOpen: (node: Node) => void }
  ) {
    this.view = new TreeView(container, {
      onFileClick: (node) => onFileOpen && onFileOpen(node),
      onSelect: (node) => setSelectedNode(node),
      onFolderToggle: async (node) => {
        const children = this.findChildren(node.id);
        if (children.length === 0) {
          try {
            const fetched = await getChildrenNodes(node.id);
            if (Array.isArray(fetched) && fetched.length > 0) {
              this.dataNodes.push(...fetched.map((c) => ({ ...c })));
              this.view.appendChildren(node.id, fetched);
            }
          } catch (e) {
            // Ошибку можно обработать, если нужно
          }
        }
      },
    });
    this.dataNodes = [];
  }

  async load() {
    const nodes = await getRootNodes();
    this.dataNodes = Array.isArray(nodes) ? nodes.map((n) => ({ ...n })) : [];
    this.view.mount();
    this.view.renderInitial(this.dataNodes);
  }

  addNodeToTree(node: Node, parentId: string | null) {
    const nodeToAdd = { ...node };
    if (parentId != null) nodeToAdd.parentId = parentId;
    this.dataNodes.push(nodeToAdd);
    this.view.addNodeToTree(nodeToAdd, parentId);
  }

  removeNodeFromTree(id: string) {
    const collectDesc = (nodeId: string): string[] => {
      const children = this.findChildren(nodeId);
      return children.reduce(
        (acc: string[], c: Node) => acc.concat(c.id, collectDesc(c.id)),
        []
      );
    };
    const allToDelete = [id, ...collectDesc(id)];
    this.dataNodes = this.dataNodes.filter((n) => !allToDelete.includes(n.id));
    this.view.removeNodes(allToDelete);
  }

  async createFolderViaButton(getSelected: () => any | null) {
    const name = prompt("Имя новой папки:");
    if (!name) return;
    let parentId = null;
    const selected = typeof getSelected === "function" ? getSelected() : null;
    if (selected && selected.type === "folder") parentId = selected.id;
    const newNode = await createNewNode({ name, type: "folder", parentId });
    this.addNodeToTree(newNode, parentId);
  }

  findChildren(parentId: string) {
    if (!Array.isArray(this.dataNodes)) return [];
    return this.dataNodes.filter((n: Node) => n.parentId === parentId);
  }
}
