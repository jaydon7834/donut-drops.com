import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { clickMines, rollDiceGame, startMines } from "../controllers/gameController.js";

const router = Router();

router.use(authMiddleware);
router.post("/mines/start", startMines);
router.post("/mines/click", clickMines);
router.post("/dice/roll", rollDiceGame);

export default router;
