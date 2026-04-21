import express from "express";
import { PrintController } from "../controllers/printController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ValidationMiddleware as Validation } from "../middlewares/validationMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/label/print",
  Validation.validateLabelPrint,
  PrintController.printLabel,
);
router.post(
  "/label/preview",
  Validation.validateLabelPrint,
  PrintController.previewLabel,
);
router.post("/label/reprint", PrintController.reprintLabel);
router.post("/label/reprint/preview", PrintController.previewReprint);

export default router;
