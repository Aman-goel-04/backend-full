import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const app = express();

const connectDB = async ()=> {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n MongoDB CONNECTED!! DB HOST: ${connectionInstance.connection.host}`);

        // either print this here, or i could print it in the THEN of the index.js (the async function returns a promise)
        // app.listen(process.env.PORT, () => {
        //     console.log(`Server running on port ${process.env.PORT}`);
        // });
    }   
    catch(error){
        console.log("ERROR: ", error);
        // can either throw, or use process.exit(1)
        // process is given to us by node, and it is the reference to the current app that is working
        process.exit(1);
    }
}

export default connectDB;