const User=require('../models/User');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');

exports.resetPassword=async(req,res)=>{
    try{
        const {token,password}=req.body;
        const decode=jwt.verify(token,process.env.JWT_SECRET);
        let hashedPassword = await bcrypt.hash(password, 10);
        const result=await User.findByIdAndUpdate(decode.id,{password:hashedPassword});
        return res.status(200).json({success:true,message:result});
    }catch(err){
        return res.status(401).json({success:false,message:"Pasword doesnot change"});
    }
}