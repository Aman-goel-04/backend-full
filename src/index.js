import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})

// print these to check if the env is loaded correctly etc
// console.log(process.env.MONGODB_URL);
// console.log(process.env.PORT);


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on the port: ${process.env.PORT}`);
    });
    // can also add the app.on("error", ()=>{}) thingy... 
})
.catch((error) => {
    console.log("Error: ", error)
});

/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error", (error)=>{
            console.log("the error is: ", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("Error: ", error);
        // either throw the error or process exit... 
    }
})();
*/