const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const dirs = ['uploads/avatars', 'uploads/projects', 'uploads/blogs', 'uploads/documents'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/general';
    if (file.fieldname === 'avatar') folder = 'uploads/avatars';
    else if (file.fieldname === 'project-image' || file.fieldname === 'image') folder = 'uploads/projects';
    else if (file.fieldname === 'blog-image') folder = 'uploads/blogs';
    else if (file.fieldname === 'resume') folder = 'uploads/documents';
    cb(null, path.join(__dirname, '..', folder));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

exports.uploadAvatar = upload.single('avatar');
exports.uploadProjectImage = upload.single('project-image');
exports.uploadProjectImages = upload.array('project-image', 10);
exports.uploadBlogImage = upload.single('blog-image');
exports.uploadResume = upload.single('resume');

exports.uploadToCloudinary = async (file) => {
  const filename = file.filename;
  const relativePath = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
  
  return { 
    url: '/' + relativePath,
    public_id: filename 
  };
};