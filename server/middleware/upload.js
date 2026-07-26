const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Local storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = 'server/uploads/';
    
    // Organize by type
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'project-image') {
      uploadPath += 'projects/';
    } else if (file.fieldname === 'blog-image') {
      uploadPath += 'blogs/';
    } else if (file.fieldname === 'resume') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'general/';
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'resume') {
    if (allowedDocTypes.test(extname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed for resume'), false);
    }
  } else {
    if (allowedImageTypes.test(extname)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: fileFilter
});

// Different upload configurations
exports.uploadAvatar = upload.single('avatar');
exports.uploadProjectImage = upload.array('project-image', 10);
exports.uploadBlogImage = upload.single('blog-image');
exports.uploadResume = upload.single('resume');
exports.uploadGeneral = upload.single('file');

// Cloudinary upload helper (for later use)
exports.uploadToCloudinary = async (file) => {
  // Will implement when you have Cloudinary credentials
  return {
    url: file.path,
    public_id: file.filename
  };
};