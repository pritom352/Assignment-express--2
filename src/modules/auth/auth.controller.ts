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

const login = async(req:Request,res:Response)=>{
    try {
        const result= await authService.loginUser(req.body.email as string,req.body.password as string)

        console.log("Login result:", result); // Log the entire result object for debugging
        const { password, ...userWithoutPassword } = result.user;
        res.status(200).json({ message: "Login successful", user: userWithoutPassword, accessToken: result.accessToken });  
    }catch (error:any) {
     
        res.status(500).json({success:false, message: error.message });
    }
}

const allUsers = async(req:Request,res:Response)=>{
    try {
        const result = await authService.getAllUsers();
        res.status(200).json({success:true,message:"User retrieved successfully", users: result.rows });
    }catch(error:any) {
        res.status(500).json({success:false, message: error.message });
    }

    }
export const authController ={
    signup,
    login,
    allUsers
}
