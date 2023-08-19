var express = require("express");
var router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../services/user");

const AWS = require("aws-sdk");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "fbimageuploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await register(data);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});


router.post("/login", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await login(data);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});
router.post("/forgot-password", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await forgotPassword(data);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }

});

router.post("/reset-password/:code", async (req, res, next) => {
  try {
    const result = await resetPassword(req.body.code, req.body.password, req.body.email);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});



module.exports = router;
