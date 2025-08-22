import express from "express";
import {
  listRoot,
  listChildren,
  createNode,
  updateNode,
  deleteNode,
} from "../services/nodeService.js";
const router = express.Router();

router.get("/nodes", async (req, res, next) => {
  try {
    res.json(await listRoot());
  } catch (e) {
    next(e);
  }
});

router.get("/nodes/:id/children", async (req, res, next) => {
  try {
    res.json(await listChildren(req.params.id));
  } catch (e) {
    next(e);
  }
});

router.post("/nodes", async (req, res, next) => {
  try {
    res.json(await createNode(req.body));
  } catch (e) {
    next(e);
  }
});

router.put("/nodes/:id", async (req, res, next) => {
  try {
    res.json(await updateNode(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
});

router.delete("/nodes/:id", async (req, res, next) => {
  try {
    await deleteNode(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

export default router;
