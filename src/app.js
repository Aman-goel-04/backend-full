import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {upload} from "./middlewares/multer.middleware.js"

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}));
app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({
    extended: true,
    limit: "10kb"
}));
app.use(express.static("public"));
app.use(cookieParser());

// routes import:  
import userRouter from "./routes/user.routes.js"

// routes declaration:
app.use('/api/v1/users', 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRouter);
// this gives me a route: http://localhost:8000/api/v1/users/:slug (slug is decided in the user.routes.js)

export {app};