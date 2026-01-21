import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=> {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout
        });
        console.log(`\n MongoDB CONNECTED!! DB HOST: ${connectionInstance.connection.host}`);

        // either print this here, or i could print it in the THEN of the index.js (the async function returns a promise)
        // app.listen(process.env.PORT, () => {
        //     console.log(`Server running on port ${process.env.PORT}`);
        // });
    }   
    catch(error){
        console.log("MongoDB connection ERROR: ", error.message);
        console.log("Full error:", error);
        // can either throw, or use process.exit(1)
        // process is given to us by node, and it is the reference to the current app that is working
        process.exit(1);
    }
}

export default connectDB;