import express from "express";
import { upload, handleUpload, getContent } from "../services/fileService.js";
const router = express.Router();

router.get("/files/:id/content", getContent);
router.post("/files/upload", upload.single("file"), handleUpload);

export default router;
