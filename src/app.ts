import express from "express";
import rateLimiterRouter from "./routes/rateLimiter.routes";

const app=express();
app.use(express.json());

app.use("/api",rateLimiterRouter);

app.get("/health",(_,res)=>{
    res.status(200).json({status:"ok"});
});



export default app;