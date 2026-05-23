import { Pool } from "pg";
import config from "../config";
export const pool= new Pool(
    {
        connectionString: config.connectionString,
    }
)

export const initDB= async()=>{
    try{
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        email VARCHAR(50) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
        );
            `)


    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20)
NOT NULL
DEFAULT 'open'
CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INTEGER ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
       
        );
        `)
    }catch(error){
        console.error("Error initializing database:", error);
    }
}