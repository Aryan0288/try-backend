const jwt=require('jsonwebtoken');
require('dotenv').config();
exports.VerifyToken=async (req,res)=>{
    try{
        const {token}=req.body;
        const result=jwt.verify(token,process.env.JWT_SECRET);
        console.log("res in VerifyToken: ",result);
        return res.status(200).json({success:true,message:token});
    }catch(err){
        console.log("err : ",err.message);
        return res.status(401).json({success:false,message:"Invalid Token"});
    }
}

