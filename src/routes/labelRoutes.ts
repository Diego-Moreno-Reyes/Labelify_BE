import { Router } from "express";
import { LabelController } from "../controllers/labelController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Protect these routes as well
router.get("/", authMiddleware, LabelController.listLabels);
router.get("/:id", authMiddleware, LabelController.getLabelInfo);
router.get("/:id/logs", authMiddleware, LabelController.getLabelLogs);


export default router;
