import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_URL || "",
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`, // File naming convention
      bucketName: "uploads", // Match the GridFS collection name
    };
  },
});

export const upload = multer({ storage });
