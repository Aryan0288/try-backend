const User = require('../models/User');
require('dotenv').config();
const jwt=require('jsonwebtoken')
const sendMail=require('../connection/sendMail');
exports.forgetpassword= async(req,res)=>{
    try{
        const {email}=req.body;
        console.log("email : ",email);

        const chkUserExist=await User.findOne({email});
        if(!chkUserExist){
            return res.status(404).json({success:false,message:"User doesnot exist"})
        }
        const payload={
            id:chkUserExist._id
        }
        const token=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"5m"});
        await sendMail(email,`reset password`,`click here ${process.env.Frontend_URL}/resetpassword?token=${token}`);

        return res.status(200).json({success:true,message:token});

    }catch(err){
        return res.status(401).json({success:false,message:err.message});
    }
}