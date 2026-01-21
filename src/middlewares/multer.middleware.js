import multer from "multer";

const storage = multer.diskStorage({ // we are using disk storage to store files on disk 
  destination: function (req, file, cb) { // ye file multer ke paas hi hota hai
    // the folder where i will be keeping my files
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

export const upload = multer({ 
    storage: storage 
})