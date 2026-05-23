import type { Request } from "express";
import { pool } from "../../db";
import type { JwtPayload } from "jsonwebtoken";
import AppError from "../../utils/error";

const createIssue = async (issueData:any, user:any) => {
    
    try {
        const {title,description,type} = issueData;

         const reporter_id = user?.id
         console.log("Reporter ID:", reporter_id);

        if(!title){
             throw new AppError(400, "Title is required")
        }
        if(title.length > 150){
            throw new AppError(400, "Title should not exceed 150 characters")
        }
        if(!description){
            throw new AppError(400, "Description is required")
        }   
        if(description.length < 20){
            throw new AppError(400, "Description should be at least 20 characters long")
        }

        if(!type){
            throw new AppError(400, "Type is required")
        }   
        if(type !== "bug" && type !== "feature_request"){
                throw new AppError(400, "Type should be either 'bug' or 'feature_request'")
        }
        // console.log("Reporter ID:", reporter_id);
        if(!reporter_id){
            throw new AppError(400, "only authenticated users can create issues")
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

    if (type === 'bug' || type === 'feature_request') {
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
        throw new AppError(404, "Issue not found");
    }

    const userRes = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [issueRes.rows[0].reporter_id]
    );
    issueRes.rows[0].reporter = userRes.rows[0];


    return issueRes.rows[0];
};

// update issue
const updateIssue = async (req:Request) => {
    try {
        const { id } = req.params;
        const { title, description, type, status } = req.body;
        const user = req.user;
        if (!user || !user.id) {
            throw new AppError(401, "Authentication required");
        }
        const findIssue = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
        if(findIssue.rows.length === 0)
{
    throw new AppError(404, "Issue not found");
}
const issue = findIssue.rows[0];


const isMaintainer = user.role === 'maintainer';
const isContributionOpen= user.role==="contributor" && issue.status === "open"
if (!isMaintainer && !isContributionOpen) {
    throw new AppError(403, "You are not authorized to update this issue");
}   
if(issue.reporter_id !== user.id && !isMaintainer){
    throw new AppError(403, "You can only update issues you reported")
}
let updateSql=`UPDATE issues SET `;
const updateValues:any[]=[];
const values:any[]=[];
if(title !== undefined){
    updateValues.push(`title =$${values.length + 1}`);
    values.push(title);
}
if(description !== undefined){
    updateValues.push(`description =$${values.length + 1}`);
    values.push(description);
}
if(type !== undefined){
    if(type !== "bug" && type !== "feature_request"){
        throw new AppError(400, "Type should be either 'bug' or 'feature_request'")
}
    updateValues.push(`type =$${values.length + 1}`);
    values.push(type);
}   
if(status !== undefined && isMaintainer){
    if(!["open","in_progress","resolved"].includes(status)){
        throw new AppError(400, "Status should be either 'open', 'in_progress' or 'resolved'")
}
    updateValues.push(`status =$${values.length + 1}`);
    values.push(status);

}else if(status !==undefined && !isMaintainer){
    throw new AppError(403, "Only maintainers can update the status")
}
if(updateValues.length === 0){
    throw new AppError(400, "At least one field (title, description, type, status) must be provided for update");
}
updateValues.push(`updated_at = NOW()`);
values.push(id);
 updateSql += updateValues.join(", ") + ` WHERE id = $${values.length} RETURNING *`

 const result = await pool.query(updateSql, values);

 return result.rows[0];


    } catch (error) {
        console.error("Error during issue update:", error);
        throw error;
    }
};

const deleteIssue = async (req:Request) => {
    try {
        const { id } = req.params;
        const userRole= req.user?.role;
        if(userRole !== "maintainer"){
            throw new AppError(403, "Only maintainers can delete issues");
        }
        const deleteIssue = await pool.query(`DELETE FROM issues WHERE id = $1 RETURNING *`, [id]);
        

        if(deleteIssue.rows.length === 0){
            throw new AppError(404, "Issue not found");
        }
        return deleteIssue.rows[0];
    
    } catch (error) {
       
        throw error;
    }
};

export const issueService = {
    createIssue,
    getAllIssues,
    getIssueById,
   
    deleteIssue,

    updateIssue
}