const mongoose=require('mongoose');

const dotenv=require('dotenv');
dotenv.config();

const dbConnection = async () => {
    try { 
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connect to database"); 
    } catch (err) {
        console.log("error occurr because of .env file " + err.message);
    }
} 

module.exports =dbConnection