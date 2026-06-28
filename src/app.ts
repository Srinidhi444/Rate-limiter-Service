import express from "express";

const app=express();
app.use(express.json());

// app.use("/api",);

app.get("/health",(_,res)=>{
    res.status(200).json({status:"ok"});
});



export default app;