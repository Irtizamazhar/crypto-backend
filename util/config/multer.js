// util/config/multer.js
const multer = require("multer");

// Define storage configuration (store files in memory)
const storage = multer.memoryStorage();

// File upload filter – updated to allow more common file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/avif",
    "image/webp",

    // Documents
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "text/plain", // .txt
    "text/csv",   // .csv
    "application/json", // .json
    "application/xml",  // .xml

    // Archives
    "application/zip", // .zip
    "application/x-7z-compressed", // .7z
    "application/x-rar-compressed", // .rar
    "application/x-tar", // .tar
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type."), false); // Reject file
  }
};

// Create the multer instance with a maximum file size of 25MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = upload;
