import type { Request } from "express";
import { pool } from "../../db";

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


export const getAllIssues = async (req: Request) => {
    const { sort, type, status } = req.query;

    let sql = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
    const conditions = [];
    const values = [];

    if (type === 'bug' || type === 'feature') {
        conditions.push(`type = $${values.length + 1}`);
        values.push(type);
    }
    if (status === 'open' || status === 'in_progress' || status === 'resolved') {
        conditions.push(`status = $${values.length + 1}`);
        values.push(status);
    }
    if (conditions.length) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    const sortOrder = sort === 'oldest' ? 'ASC' : 'DESC';
    sql += ` ORDER BY created_at ${sortOrder}`;

    const issuesResult = await pool.query(sql, values);
    const issues = issuesResult.rows;

    // console.log("Fetched Issues:", issues);

    const issuesWithReporter = [];
    for (const issue of issues) {
        const userRes = await pool.query(
            `SELECT id, name, role FROM users WHERE id = $1`,
            [issue.reporter_id]
        );
        issuesWithReporter.push({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: userRes.rows[0] ,
            created_at: issue.created_at,
            updated_at: issue.updated_at
        });
    }

    // console.log("Issues with Reporter Info:", issuesWithReporter);
    return  issuesWithReporter ; 
};


// get id wise issue details
const getIssueById = async (req: Request) => {
    const { id } = req.params;
    const issueRes = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
    );
    if (!issueRes.rows[0]) {
        throw new Error("Issue not found");
    }
    return issueRes.rows[0];
};

export const issueService = {
    createIssue,
    getAllIssues,
    getIssueById
}