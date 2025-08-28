// Load environment variables
require('dotenv').config();

console.log("🔍 AWS Config:");
console.log("AWS_REGION =", JSON.stringify(process.env.AWS_REGION));
console.log("AWS_ACCESS_KEY_ID =", process.env.AWS_ACCESS_KEY_ID ? "SET" : "MISSING");
console.log("AWS_SECRET_ACCESS_KEY =", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "MISSING");
console.log("AWS_BUCKET_NAME =", JSON.stringify(process.env.AWS_BUCKET_NAME));

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const { listImages, getPresignedUrl, deleteObject, s3 } = require('./s3');

const app = express();

// ✅ Allow only your frontend domain
app.use(cors({
  origin: ["https://imag-r.onrender.com"],  // your frontend Render URL
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const PORT = process.env.PORT || 4000;
const BUCKET = process.env.AWS_BUCKET_NAME;

if (!BUCKET) {
  console.error("❌ Missing AWS_BUCKET_NAME in .env");
  process.exit(1);
}

// ✅ Upload endpoint
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const key = `${Date.now()}-${uuidv4()}-${req.file.originalname}`;
    console.log(`⬆️ Uploading file to bucket "${BUCKET}" with key "${key}"`);

    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    res.json({ message: "File uploaded successfully", key });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ List images
app.get('/images', async (req, res) => {
  try {
    const items = await listImages('');
    res.json(items.reverse());
  } catch (err) {
    console.error("❌ List error:", err);
    res.status(500).json({ error: 'Could not list images' });
  }
});

// ✅ Delete an image
app.delete('/images', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    await deleteObject(key);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

