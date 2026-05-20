import express, {type Application } from "express";

const app:Application= express()
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello assignment 2" });
});

export default app;