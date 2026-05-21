import type { Request, Response } from 'express';
import { issueService } from './issues.service';
const createIssue=async(req:Request,res:Response)=>{
    try {
        const result = await issueService.createIssue( req.body,
   req.user);
        res.status(201).json({success:true, message: "Issue created successfully", issue: result.rows[0] });
    }catch (error:any) {
        console.error("Error during issue creation:", error);
        res.status(500).json({success:false, message: error.message });
    }   }

export const issueController={
    createIssue
}