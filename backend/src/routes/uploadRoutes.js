import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudConfig.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedImage = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    const allowedVideo = /^video\/(mp4|webm|quicktime|ogg)$/i;
    if (allowedImage.test(file.mimetype) || allowedVideo.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos allowed"));
    }
  }
});

const CLOUD_FOLDER = "skill_nexus";

async function uploadToCloudinary(buffer, mimetype, folder, publicId, resourceType = "image") {
  const b64 = buffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `${CLOUD_FOLDER}/${folder}`,
    resource_type: resourceType,
    public_id: publicId
  });
  return result;
}

// Profile image - auth required
router.post("/profile", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const ext = req.file.originalname.split(".").pop() || "jpg";
    const publicId = `${req.user._id}`;
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "profile", publicId, "image");
    res.json({ url: result.secure_url, path: result.public_id });
  } catch (err) {
    console.error("Upload profile error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Intro video - auth required
router.post("/video", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const ts = Date.now();
    const publicId = `${req.user._id}_${ts}`;
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "video", publicId, "video");
    res.json({ url: result.secure_url, path: result.public_id });
  } catch (err) {
    console.error("Upload video error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Complaint proof - auth required
router.post("/proof", authRequired, upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
    const ts = Date.now();
    const urls = [];
    for (let i = 0; i < req.files.length; i++) {
      const publicId = `${req.user._id}_${ts}_${i}`;
      const result = await uploadToCloudinary(req.files[i].buffer, req.files[i].mimetype, "proof", publicId, "image");
      urls.push(result.secure_url);
    }
    res.json({ urls });
  } catch (err) {
    console.error("Upload proof error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Payment QR - auth required (user) or admin
router.post("/qr", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const ts = Date.now();
    const publicId = req.user.role === "Admin" ? `admin_${ts}` : `${req.user._id}_${ts}`;
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "qr", publicId, "image");
    res.json({ url: result.secure_url, path: result.public_id });
  } catch (err) {
    console.error("Upload QR error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Verification docs - learner photos or teacher certificates (images)
router.post("/verification", authRequired, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
    const type = (req.body.type || "learner_photo").toString();
    const folder = type === "teacher_certificate" ? "verification/certificates" : "verification/photos";
    const ts = Date.now();
    const urls = [];
    for (let i = 0; i < req.files.length; i++) {
      const publicId = `${req.user._id}_${ts}_${i}`;
      const result = await uploadToCloudinary(req.files[i].buffer, req.files[i].mimetype, folder, publicId, "image");
      urls.push(result.secure_url);
    }
    res.json({ urls });
  } catch (err) {
    console.error("Upload verification error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Logo upload (admin)
router.post("/logo", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Admin only" });
    const ts = Date.now();
    const publicId = `logo_${ts}`;
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "logo", publicId, "image");
    res.json({ url: result.secure_url, path: result.public_id });
  } catch (err) {
    console.error("Upload logo error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Generic image upload (for flexibility)
router.post("/image", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const folder = req.body.folder || "misc";
    const ts = Date.now();
    const publicId = `${req.user._id}_${ts}`;
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder, publicId, "image");
    res.json({ url: result.secure_url, path: result.public_id });
  } catch (err) {
    console.error("Upload image error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

export default router;
