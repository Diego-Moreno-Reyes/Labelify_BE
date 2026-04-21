import express from "express";
import { UserController } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = express.Router();

// Role 2 = Admin, Role 3 = SuperAdmin
router.use(authMiddleware);
router.use(roleMiddleware([2, 3]));

router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);
router.post("/", UserController.create);
router.patch("/:id", UserController.update);
router.delete("/:id", UserController.delete);




export default router;
