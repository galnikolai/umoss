import { subscribeSelection, getSelectedNode } from "../store/index.js";

interface IHeader {
  addFolderBtn: HTMLElement;
  deleteFolderBtn: HTMLElement;
  uploadInput: HTMLElement;
  downloadBtn: HTMLElement;
  deleteBtn: HTMLElement;
  renameBtn: HTMLElement;
}

export class Header implements IHeader {
  addFolderBtn: HTMLElement;
  deleteFolderBtn: HTMLElement;
  uploadInput: HTMLElement;
  downloadBtn: HTMLElement;
  deleteBtn: HTMLElement;
  renameBtn: HTMLElement;
  unsubscribe: (() => void) | null;

  constructor({
    onAddFolder,
    onDeleteFolder,
    onDownloadFile,
    onDeleteFile,
    onRenameFile,
  }: {
    onAddFolder: () => void;
    onDeleteFolder: () => void;
    onDownloadFile: () => void;
    onDeleteFile: () => void;
    onRenameFile: () => void;
  }) {
    const addFolderBtn = document.getElementById("add-folder");
    const deleteFolderBtn = document.getElementById("delete-folder");
    const uploadInput = document.getElementById("upload-file-button");
    const downloadBtn = document.getElementById("download-file");
    const deleteBtn = document.getElementById("delete-file");
    const renameBtn = document.getElementById("rename-file");

    if (
      !addFolderBtn ||
      !deleteFolderBtn ||
      !uploadInput ||
      !downloadBtn ||
      !deleteBtn ||
      !renameBtn
    ) {
      throw new Error(
        "Один или несколько элементов управления не найдены в DOM."
      );
    }

    this.addFolderBtn = addFolderBtn;
    this.deleteFolderBtn = deleteFolderBtn;
    this.uploadInput = uploadInput;
    this.downloadBtn = downloadBtn;
    this.deleteBtn = deleteBtn;
    this.renameBtn = renameBtn;

    if (this.addFolderBtn) {
      this.addFolderBtn.addEventListener("click", onAddFolder);
    }
    if (this.deleteFolderBtn) {
      this.deleteFolderBtn.addEventListener("click", onDeleteFolder);
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", onDownloadFile);
    }
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener("click", onDeleteFile);
    }
    if (this.renameBtn) {
      this.renameBtn.addEventListener("click", onRenameFile);
    }

    this.updateButtons(null);
    this.unsubscribe = null;
  }

  mount() {
    this.updateButtons(getSelectedNode());
    this.unsubscribe = subscribeSelection((node: any) => {
      this.updateButtons(node);
    });
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  }

  showAddFolderBtn(show: boolean) {
    if (this.addFolderBtn) {
      this.addFolderBtn.style.display = show ? "inline-block" : "none";
    }
  }

  showUploadInput(show: boolean) {
    if (this.uploadInput) {
      this.uploadInput.style.display = show ? "inline" : "none";
    }
  }

  showDownloadBtn(show: boolean) {
    if (this.downloadBtn) {
      this.downloadBtn.style.display = show ? "inline-block" : "none";
    }
  }

  showDeleteBtn(show: boolean) {
    if (this.deleteBtn) {
      this.deleteBtn.style.display = show ? "inline-block" : "none";
    }
  }

  showDeleteFolderBtn(show: boolean) {
    if (this.deleteFolderBtn) {
      this.deleteFolderBtn.style.display = show ? "inline-block" : "none";
    }
  }

  showRenameBtn(show: boolean) {
    if (this.renameBtn) {
      this.renameBtn.style.display = show ? "inline-block" : "none";
    }
  }

  updateButtons(selectedNode: any) {
    const isFile = selectedNode && selectedNode.type === "file";
    const isFolder = selectedNode && selectedNode.type === "folder";
    const hasSelection = selectedNode !== null;

    this.showAddFolderBtn(!isFile);
    this.showUploadInput(!isFile);
    this.showDownloadBtn(isFile);
    this.showDeleteBtn(isFile);
    this.showDeleteFolderBtn(isFolder);
    this.showRenameBtn(hasSelection);
  }
}

export default Header;
