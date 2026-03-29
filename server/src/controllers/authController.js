import { loginUser, registerUser } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
