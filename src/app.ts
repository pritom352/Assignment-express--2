import express, {type Application } from "express";
import { authRouter } from "./modules/auth/auth.route";

const app:Application= express()
app.use(express.json());

app.use("/auth",authRouter)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello assignment 2" });
});

export default app;