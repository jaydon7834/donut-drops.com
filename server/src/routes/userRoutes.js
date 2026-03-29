import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getBalance, setClientSeed } from "../controllers/userController.js";

const router = Router();

router.use(authMiddleware);
router.get("/balance", getBalance);
router.patch("/seed", setClientSeed);

export default router;
