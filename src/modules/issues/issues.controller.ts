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


const getAllIssues = async (req: Request, res: Response) => {
    try {
        const result = await issueService.getAllIssues(req);
        res.status(200).json({
            success: true,
            message: "Issues retrieved successfully",
            data: result   // 'issues' না দিয়ে 'data'
        });
    } catch (error: any) {
        console.error("Error during retrieving issues:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getIssueById = async (req: Request, res: Response) => {
    try {
        const result = await issueService.getIssueById(req);  
        res.status(200).json({
            success: true,
            message: "Issue retrieved successfully",
            data: result
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// update issue
const updateIssue = async (req: Request, res: Response) => {
    try {
        // const { id } = req.params;
        const result = await issueService.updateIssue(req);
        res.status(200).json({
            success: true,
            message: "Issue updated successfully",
            data: result
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const issueController={
    createIssue,
    getAllIssues,
    getIssueById,
    updateIssue
}