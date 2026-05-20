import type { Request, Response } from "express";
import { pool } from "../../db";
import { authService } from "./auth.service";

const signup = async(req:Request,res:Response)=>{
    try {
        const result = await authService.createUser(req.body);
        const { password, ...userWithoutPassword } = result.rows[0];
        res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
    }catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    } }



export const authController ={
    signup
}