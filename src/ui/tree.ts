import { Node } from "../types/domain.js";
interface ITreeView {
  appendChildren(parentId: string, children: Node[]): void;
  mount(): void;
  renderInitial(nodes: Node[]): void;
  createNodeElement(node: Node): HTMLElement;
  handleNodeClick(e: MouseEvent, node: Node): void;
  toggleFolder(folderId: string): void;
  addNodeToTree(newNode: Node, parentId: string): void;
  removeNodes(nodeIds: string[]): void;
  updateSelection(nodeId: string): void;
  updateNodeLabel(id: string, name: string): void;
}

export class TreeView implements ITreeView {
  openFolderIds = new Set<string>();
  selectedNodeId: string | null = null;
  container: HTMLElement;
  onFileClick: (node: any) => void;
  onSelect: (node: any) => void;
  onFolderToggle: (node: any) => void;

  constructor(
    container: HTMLElement,
    {
      onFileClick,
      onSelect,
      onFolderToggle,
    }: {
      onFileClick: (node: any) => void;
      onSelect: (node: any) => void;
      onFolderToggle: (node: any) => void;
    }
  ) {
    this.container = container;
    this.onFileClick = onFileClick;
    this.onSelect = onSelect;
    this.onFolderToggle = onFolderToggle;
  }

  appendChildren(parentId: string, children: Node[]) {
    if (!Array.isArray(children) || children.length === 0) return;
    const ul = this.container.querySelector(`li[data-id='${parentId}'] > ul`);
    if (!ul) return;

    if (ul.children.length > 0) return;
    children.forEach((child) => {
      const li = this.createNodeElement(child);
      if (child.type === "folder") {
        const childUl = document.createElement("ul");
        childUl.style.display = this.openFolderIds.has(child.id)
          ? "block"
          : "none";
        li.appendChild(childUl);
      }
      ul.appendChild(li);
    });
  }

  mount() {
    this.initOutsideClickClear();
  }

  renderInitial(nodes: Node[]) {
    const root = this.container;
    if (!root) return;
    root.innerHTML = "";
    const getRootNodes = (all: Node[]) =>
      Array.isArray(all) ? all.filter((n) => !n.parentId) : [];
    const findChildren = (all: Node[], parentId: string) =>
      Array.isArray(all) ? all.filter((n) => n.parentId === parentId) : [];
    const renderSubtree = (parentId: string | null, parentEl: HTMLElement) => {
      const list =
        parentId == null ? getRootNodes(nodes) : findChildren(nodes, parentId);
      list.forEach((node) => {
        const li = this.createNodeElement(node);
        if (node.type === "folder") {
          const ul = document.createElement("ul");
          ul.style.display = this.openFolderIds.has(node.id) ? "block" : "none";
          if (this.openFolderIds.has(node.id)) renderSubtree(node.id, ul);
          li.appendChild(ul);
        }
        parentEl.appendChild(li);
      });
    };
    renderSubtree(null, root);
  }

  createNodeElement(node: Node) {
    const li = document.createElement("li");
    li.className = node.type;
    const label = document.createElement("span");
    label.className = "node-label";
    label.textContent = node.name;
    if (this.selectedNodeId === node.id) label.classList.add("selected");
    li.appendChild(label);
    li.setAttribute("data-id", node.id);
    if (node.parentId) li.setAttribute("data-parent", node.parentId);
    if (node.type === "folder") {
      li.classList.add(this.openFolderIds.has(node.id) ? "open" : "closed");
    }
    if (node.description) {
      const tooltip = document.createElement("span");
      tooltip.className = "tooltip";
      tooltip.textContent = node.description;
      li.appendChild(tooltip);
      li.addEventListener(
        "mouseover",
        () => (tooltip.style.visibility = "visible")
      );
      li.addEventListener(
        "mouseout",
        () => (tooltip.style.visibility = "hidden")
      );
    }
    li.addEventListener("click", (e) => this.handleNodeClick(e, node));
    return li;
  }

  handleNodeClick(e: MouseEvent, node: Node) {
    e.stopPropagation();
    const wasSelected = this.selectedNodeId === node.id;
    this.updateSelection(node.id);
    if (typeof this.onSelect === "function") this.onSelect(node);
    if (node.type === "folder") {
      this.toggleFolder(node.id);
      if (typeof this.onFolderToggle === "function") this.onFolderToggle(node);
    } else if (!wasSelected && typeof this.onFileClick === "function") {
      this.onFileClick(node);
    }
  }

  async toggleFolder(folderId: string) {
    const li = this.container.querySelector(`li[data-id='${folderId}']`);
    if (!li) return;
    const ul =
      li.querySelector("ul") || li.appendChild(document.createElement("ul"));
    const isOpening = !this.openFolderIds.has(folderId);
    if (isOpening) {
      this.openFolderIds.add(folderId);
      li.classList.remove("closed");
      li.classList.add("open");
      ul.style.display = "block";
    } else {
      this.openFolderIds.delete(folderId);
      li.classList.remove("open");
      li.classList.add("closed");
      ul.style.display = "none";
    }
  }

  addNodeToTree(newNode: Node, parentId: string | null) {
    let parentUl = this.container;
    if (parentId != null) {
      const parentLi = this.container.querySelector(
        `li[data-id='${parentId}']`
      );
      if (!parentLi) return;
      this.openFolderIds.add(parentId);
      parentLi.classList.remove("closed");
      parentLi.classList.add("open");
      const ul =
        parentLi.querySelector("ul") ||
        parentLi.appendChild(document.createElement("ul"));
      ul.style.display = "block";
      parentUl = ul;
    }
    const li = this.createNodeElement(newNode);
    if (newNode.type === "folder") {
      const ul = document.createElement("ul");
      ul.style.display = this.openFolderIds.has(newNode.id) ? "block" : "none";
      li.appendChild(ul);
    }
    parentUl.appendChild(li);
  }

  removeNodes(nodeIds: string[]) {
    if (!Array.isArray(nodeIds)) return;
    nodeIds.forEach((id) => {
      if (this.selectedNodeId === id) this.selectedNodeId = null;
      this.openFolderIds.delete(id);
      const el = this.container.querySelector(`li[data-id='${id}']`);
      if (el && el.parentElement) el.parentElement.removeChild(el);
    });
  }

  updateSelection(nodeId: string | null) {
    if (this.selectedNodeId === nodeId) return;
    if (this.selectedNodeId) {
      const prev = this.container.querySelector(
        `li[data-id='${this.selectedNodeId}'] .node-label`
      );
      if (prev) prev.classList.remove("selected");
    }
    this.selectedNodeId = nodeId || null;
    if (nodeId) {
      const curr = this.container.querySelector(
        `li[data-id='${nodeId}'] .node-label`
      );
      if (curr) curr.classList.add("selected");
    }
  }

  updateNodeLabel(id: string, name: string) {
    const label = this.container.querySelector(
      `li[data-id='${id}'] .node-label`
    );
    if (label) label.textContent = name;
  }

  initOutsideClickClear() {
    const treeView = this.container && this.container.closest(".tree-view");
    if (!treeView || !this.container) return;
    treeView.addEventListener("click", (e: any) => {
      if (!this.container.contains(e.target)) {
        if (this.selectedNodeId) {
          const prev = this.container.querySelector(
            `li[data-id='${this.selectedNodeId}'] .node-label`
          );
          if (prev) prev.classList.remove("selected");
        }
        this.selectedNodeId = null;
        const detail = { node: null };
        treeView.dispatchEvent(
          new CustomEvent("tree:selection-cleared", { detail, bubbles: true })
        );
      }
    });
  }
}

export default TreeView;
