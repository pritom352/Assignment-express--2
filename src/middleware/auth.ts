import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../modules/auth/auth.service";
import { pool } from "../db";
const auth=()=>{
    return async (req:Request,res:Response,next:NextFunction)=>{ 
        try{
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({success:false, message: "Authorization header missing" });
            }

            const decodedToken =jwt.verify(authHeader,authService.jwtCode) as jwt.JwtPayload;
            console.log("Decoded token:", decodedToken);// Log the decoded token for debugging
            const matchingUser = await pool.query(`SELECT * FROM users WHERE id = $1 AND name = $2`, [decodedToken.id, decodedToken.name]
            );
const user = matchingUser.rows[0];
if(matchingUser.rows.length === 0){
    return res.status(401).json({success:false, message: "User not foundbbbb" });
}
req.user = decodedToken;
            next()
        }catch(error){
            res.status(401).json({success:false, message:"Unauthorized access"})
            next(error)
        }
}}

export default auth