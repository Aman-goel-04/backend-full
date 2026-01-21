import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
// router.route("/login").post(login); just for understanding that the slug would be login here

export default router;