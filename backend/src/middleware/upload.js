/*
upload.js - This is the file uploaded middleware (powered by multer)
Multer is a middleware for handling multipart/form-data, which is primarily used for uploading files.
In this file, we configure multer to handle profile picture uploads for user registration. 
The uploaded files are stored in the 'uploads/profiles' directory, and we define a file filter to only accept image files (jpg, jpeg, png). 
The uploadProfilePicture middleware is then exported for use in the auth.routes.js file, where it is applied to the registration route.

The maximum size of the image is set as 2MB 
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads/profiles directory exists
const uploadDir = path.join(__dirname, '../uploads/profiles');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
// diskStorage means that files are saved in the local harddrive 
// Alternative is memoryStorage, which keeps files in ram as local buffer (not recommended for large files)
const storage = multer.diskStorage({
    // Where to save the file
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    // How to name the file
    filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext        = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueName}${ext}`);
  },
});

//File type filter only allows real images.
// FOr this we check both the mimetype and the extension of the file. 

function fileFilter(req, file, cb) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);  // accept the file
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp).'), false);
  }
}

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { 
        fileSize: 2*1024*1024, // 2MB in bytes 
    }, 
}); 

/*
uploading the profile picture as a single profile picture. 
The field name in the form must be "profilePicture"

Usage in a route:
 *   router.post('/register', uploadProfilePicture, authCtrl.register);
 *
 * After this runs, the controller gets:
 *   req.file.filename  → the saved filename  e.g. "1714500123456-847291034.jpg"
 *   req.file.path      → full path on disk
 *   req.file.size      → size in bytes
*/ 

const uploadProfilePicture = upload.single('profilePicture');

module.exports = { uploadProfilePicture}; 
