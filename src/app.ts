import express, {type Application } from "express";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issues.router";
const app:Application= express()
app.use(express.json());

app.use("/api/auth",authRouter)
app.use("/api/issues",issueRouter)

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello assignment 2" });
});

export default app;