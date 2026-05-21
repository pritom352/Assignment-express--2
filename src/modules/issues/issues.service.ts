import { pool } from "../../db";
import type { IIssue } from "../../types";
const createIssue = async (issueData:any, user:any) => {
    
    try {
        const {title,description,type} = issueData;

         const reporter_id = user?.id
         console.log("Reporter ID:", reporter_id);

        if(!title){
             throw new Error("Title is required")
        }
        if(title.length > 150){
            throw new Error("Title should not exceed 150 characters")
        }
        if(!description){
            throw new Error("Description is required")
        }   
        if(description.length < 20){
            throw new Error("Description should be at least 20 characters long")
        }

        if(!type){
            throw new Error("Type is required")
        }   
        if(type !== "bug" && type !== "feature"){
                throw new Error("Type should be either 'bug' or 'feature'")
        }
        // console.log("Reporter ID:", reporter_id);
        if(!reporter_id){
            throw new Error("only authenticated users can create issues")
        }
         const reporterCheck = await pool.query(`SELECT * FROM users WHERE id = $1`, [reporter_id]);
            if(!reporterCheck.rows[0]){
                throw new Error("not a valid user")
            }

    const result = await pool.query(
        `INSERT INTO issues (title, description,type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, description, type, reporter_id]
    );
    return result
    }
    catch(error:any){
   console.error("DB ERROR:", error.message);
   throw error;
}
}  
  
    export const issueService = {
        createIssue
    }