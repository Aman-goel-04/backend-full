import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "OK"
    // })

    // logic building steps:
    // 1. get user details from frontend (i can take from postman)
    // 2. validation of every data point
    // 3. check if user already exists: username and email
    // 4. check for images, check for avatar
    // 5. upload them to cloudinary, check avatar
    // 6. create user object - create entry in db
    // 7. remove password and refreshToken field from response
    // 8. check for user creation
    // 9. return response if yes, no if not created

    const {fullName, email, username, password} = req.body;
    console.log(email); // log to check if it is working
    console.log("The requestdotbody object: ", req.body); 
    
    
    // if(fullName === ""){
    //     throw new ApiError(400, "Full name is required.")
    // }
    
    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required.")
    }
    
    const existingUser = await User.findOne({
        // use operators:
        $or: [{username}, {email}]
    });
    console.log("The existing user reference: ", existingUser); 
    console.log("end!!!!!!!!!"); 
    
    if(existingUser){
        throw new ApiError(409, "User is already registered.")
    }
    
    console.log("The multer request files: ", req.files); 
    const avatarLocalPath = req.files?.avatar?.[0]?.path; // this is in our server
    let coverImageLocalPath; 

    if (req.files?.coverImage && req.files.coverImage[0]) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Avatar upload result:", avatar); 

    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log("CoverImage upload result:", coverImage); 
    }

    if(!avatar){
    throw new ApiError(400, "Avatar file is required.");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // i do not need password and refresh token!
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json( // .status code is what postman displays there!!
        new ApiResponse(200, createdUser, "User registered successfully.")
    )
});

export {registerUser};