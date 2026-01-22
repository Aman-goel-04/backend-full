import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // refresh token needs to be added to the db
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    // steps:
    // 1. req body -> data
    // 2. username or email
    // 3. find the user
    // 4. if user exists, password check
    // 5. password matched, generate both the tokens and give them to the user
    // 6. send cookies (secure)
    // 7. success message

    const {email, username, password} = req.body;
    if(!(username || email)){
        throw new ApiError(400, "Username or password is required.");
    }

    // now i want ki username and email dono se login kar sakein
    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if(!user){
        throw new Error(404, "User does not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password); // note: do not access it using User, it would be user.
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials.");
    }

    // now create access and refresh tokens... 
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggenInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // send cookies: 
    // create options:
    const options = {
        httpOnly: true, 
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options) // cookies are sent like this
    .cookie("refreshToken", refreshToken, options) 
    .json(
        new ApiResponse(
            200,
            {
                user: loggenInUser,
                accessToken, 
                refreshToken
            }, // this object is the data in the Api Response
            "User logged in successfully."
        )
    )

});

const logoutUser = asyncHandler(async (req, res) => {
    // steps:
    // 1.

    // to find the user, i need an Id... how?
    // User.findById() ???
    // firse email password dalwayein?
    // no.....
    // we will use middlewares

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true, 
        secure: true 
    }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out."))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // i can access the refresh token from the cookies, or by the body (in mobile apps)
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access.");
    }
    
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        
        // now i have decoded token
        // i put the id for the token, so i can access using id:
        
        const user = await User.findById(decodedToken?._id);
        
        if(!user){
            throw new ApiError(401, "Invalid refresh token.");
        }
    
        // match:
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used.");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed successfully."
            )
        );
    } catch (error) {
        throw new ApiError(401, error?.message || 
            "Invalid refresh token."
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if(newPassword !== confirmPassword){
        throw new ApiError(401, "New password and confirm password do not match.")
    }

    // agar middleware chala hai matlab req.user mein user hai
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password.");
    }

    // now i need to set the new password
    // pre wala middleware chalega user model mein (VV IMP)

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully."
        )
    )
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            req.user, 
            "Current user fetched successfully."
        )
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if(!fullName && !email){
        throw new ApiError(400, "All fields are required.");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id, // find this
        {
            $set: {
                fullName,
                email: email
            }
        }, 
        {new: true} // update hone ke baad wali info return hoti hai
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing.");
    }

    const avatarReceived = await uploadOnCloudinary(avatarLocalPath); 

    if(!avatarReceived.url){
        throw new ApiError(400, "Error while uploading on cloudinary.");
    }

    const user = await User.findByIdAndUpdate(
        req.users?._id,
        {
            $set:{
                avatar: avatarReceived.url // avatar recieved is a complete object
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully.")
    )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path; // note: file hoga, not files... 

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover file is missing.");
    }

    const coverImageReceived = await uploadOnCloudinary(coverImageLocalPath); 

    if(!coverImageReceived.url){
        throw new ApiError(400, "Error while uploading on cloudinary.");
    }

    const user = await User.findByIdAndUpdate(
        req.users?._id,
        {
            $set:{
                avatar: coverImageReceived.url // avatar recieved is a complete object
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully.")
    )
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};