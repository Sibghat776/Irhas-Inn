import multer from "multer";
import path from "path";

// Destination: Temporary storage in 'uploads/' folder
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "uploads/"); // Temporary folder to hold images
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//     }
// });

let storage = multer.memoryStorage();

// File type filter: Only images allowed
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|jfif|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed"), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // Max: 5MB per file
    fileFilter
});
export default upload;