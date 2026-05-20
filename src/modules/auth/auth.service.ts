import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "../../types";
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


export const authService ={
    createUser
}