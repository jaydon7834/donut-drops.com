import { getBalanceSummary, updateClientSeed } from "../services/gameService.js";

export async function getBalance(req, res, next) {
  try {
    const summary = await getBalanceSummary(req.user._id);
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}

export async function setClientSeed(req, res, next) {
  try {
    const user = await updateClientSeed(req.user._id, req.body.clientSeed);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}
