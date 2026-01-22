import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv";  

dotenv.config({ path: './.env' });  


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        console.log("Uploading to Cloudinary:", localFilePath); // ADD THIS

        // upload on cloudinary, it gives us an uploader:
        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto"
            }
        ); 
        // file has been uploaded successfully
        console.log('File has been uploaded on cloudinary successfully.', response.url);
        return response;
    } catch (error) {
        console.error('Cloudinary upload error:', error); // MAKE SURE THIS IS HERE
        // since it did not get uploaded on cloudinary, i will remove the locally saved temporary file:
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export {uploadOnCloudinary};