import { Pool } from "pg";
export const pool= new Pool(
    {
        connectionString: "postgresql://neondb_owner:npg_N5kbfAiBYom2@ep-square-feather-aot20ss7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
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
        role VARCHAR(20) NOT NULL DEFAULT 'contributor',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
        );
            `)


    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        reporter_id INTEGER ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
        );
        `)
    }catch(error){
        console.error("Error initializing database:", error);
    }
}