const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Note = require("../models/Note");
const auth = require("../middleware/auth");

const uploadsDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".png";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const buildImageData = (req) => {
  if (!req.file) {
    return {};
  }

  return {
    imageUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    imagePath: req.file.path
  };
};

// CREATE
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();
    const pinned = body.pinned === "true";

    if (!title) {
      deleteFileIfExists(req.file?.path);
      return res.status(400).json({ message: "Title is required" });
    }

    const note = await Note.create({
      userId: req.user.id,
      title,
      content,
      pinned,
      ...buildImageData(req)
    });

    res.json(note);
  } catch (error) {
    deleteFileIfExists(req.file?.path);
    res.status(500).json({ message: "Could not create note" });
  }
});

// READ
router.get("/", auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Could not load notes" });
  }
});

// UPDATE
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();
    const removeImage = body.removeImage === "true";
    const pinned = body.pinned === "true";

    if (!title) {
      deleteFileIfExists(req.file?.path);
      return res.status(400).json({ message: "Title is required" });
    }

    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      deleteFileIfExists(req.file?.path);
      return res.status(404).json({ message: "Note not found" });
    }

    note.title = title;
    note.content = content;
    note.pinned = pinned;

    if (removeImage) {
      deleteFileIfExists(note.imagePath);
      note.imagePath = "";
      note.imageUrl = "";
    }

    if (req.file) {
      deleteFileIfExists(note.imagePath);
      note.imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      note.imagePath = req.file.path;
    }

    await note.save();
    res.json(note);
  } catch (error) {
    deleteFileIfExists(req.file?.path);
    res.status(500).json({ message: "Could not update note" });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    deleteFileIfExists(note.imagePath);
    await Note.deleteOne({ _id: note._id });
    res.json({ msg: "deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete note" });
  }
});

module.exports = router;
