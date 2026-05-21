import { Router } from "express";
import { authController } from "./auth.controller";
import  auth  from "../../middleware/auth";
const router= Router()
router.post("/signup",authController.signup)
router.get("/allusers",auth(),authController.allUsers)
router.post("/login",authController.login)

export const authRouter= router