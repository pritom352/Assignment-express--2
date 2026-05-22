import { Router } from 'express'
import { issueController } from './issues.controller';
import auth from '../../middleware/auth';
const router=Router()

router.post("/",auth(),issueController.createIssue)

router.get("/",issueController.getAllIssues)
router.get("/:id",issueController.getIssueById)




export const issueRouter= router