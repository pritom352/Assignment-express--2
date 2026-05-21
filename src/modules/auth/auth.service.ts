import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "../../types";
import jwt from "jsonwebtoken";
const jwtCode:string = "sitsldlfjsdotiweor"

const createUser = async(payload:IUser)=>{
    const { name, email, password, role = "contributor" } = payload;
    const salt = bcrypt.genSaltSync(10);
const hashPassword = bcrypt.hashSync(password, salt);

const result = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name,email,hashPassword,role]
)

return result
}

const loginUser = async(email:string,password:string)=>{
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`,[email])
if(result.rows.length===0){
    throw new Error("No user found with this email")
}
const user= result.rows[0];
const matchPassword = await bcrypt.compare(password,user.password);
if(!matchPassword){
    throw new Error("Invalid password")
}
//!  Genarate JWT token here and return it to the user

const jwtPayload = {
    id:user.id,
    name:user.name,
    role:user.role
}
const accessToken = jwt.sign(jwtPayload,jwtCode,{expiresIn:"10d"})
return {accessToken , user}
}

const getAllUsers = async()=>{
    const result = await pool.query(`SELECT * FROM users`)
    return result
}
export const authService ={
    createUser,
    loginUser,
    jwtCode,getAllUsers
}