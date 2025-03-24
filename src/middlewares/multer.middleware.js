const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/temp')
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname)
//     }
// })

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "complaints", // Folder name in Cloudinary
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});

const upload = multer({ storage })
module.exports = upload;