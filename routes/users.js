var express = require("express");
var router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePicture,
  updateProfile,
} = require("../services/user");

const AWS = require("aws-sdk");
const multer = require("multer");

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

router.post("/update-profile", async(req, res, next)=>{
try {
const data = req.body;
const result = await updateProfile(data);
res.send(result);
} catch (error) {
  res.status(400).send({error: error.message})
}

})


const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const s3Client = new AWS.S3({
//  accessKeyId: "AKIA4OJLAZKOQH7ZZIKR",
//  secretAccessKey: "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",
});

router.post("/fileUpload", upload.single("file"), (req, res) => {
  let params = {
    // Bucket: "smarketify-assets",
    // Key: "jpg",
    Body: "file",
  };
  try {
    s3Client.upload(params, (err, data) => {
      if (err) {
        res.status(500).send({error: err.message});
      }
      updatePicture(data.Location);
      res.send({
        message: "File uploaded successfully",
        location: data.Location,
      });
      console.log(data.Location);
    });
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});

module.exports = router;
