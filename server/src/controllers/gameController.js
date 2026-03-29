import { clickMinesTile, rollDice, startMinesGame } from "../services/gameService.js";

export async function startMines(req, res, next) {
  try {
    const result = await startMinesGame(req.user._id, req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function clickMines(req, res, next) {
  try {
    const result = await clickMinesTile(req.user._id, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function rollDiceGame(req, res, next) {
  try {
    const result = await rollDice(req.user._id, req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}
