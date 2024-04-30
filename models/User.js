const mongoose=require('mongoose');

const UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    email:{type:String,unique:true},
    status: { type: Boolean, default: false }
},{timestamps:true});


const UserModel=mongoose.model('User',UserSchema);
module.exports=UserModel; 