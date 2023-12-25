const mongoose=require('mongoose');

const UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    email:{type:String,unique:true},
},{timestamps:true});
// const UserSchema = new mongoose.Schema({
//     username: {
//       type: String,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true, // Enforce uniqueness
//     },
//   },{timestamps:true});

const UserModel=mongoose.model('User',UserSchema);
module.exports=UserModel; 