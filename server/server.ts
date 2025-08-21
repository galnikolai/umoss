import express from "express";
import { errorHandler } from "./middlewares/error.js";
import * as dataRepo from "./repositories/dataRepository.js";
import nodesRoutes from "./routes/nodes.js";
import filesRoutes from "./routes/files.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

(async () => {
  await dataRepo.load();
})();

app.use("/api", nodesRoutes);
app.use("/api", filesRoutes);

app.use(errorHandler);

app.listen(3000, () => console.log("Сервер запущен на порту 3000"));
