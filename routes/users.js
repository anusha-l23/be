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
const path = require("path");
const fs = require("fs");
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
  destination: "uploadsimages/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
const s3Client = new AWS.S3({
accessKeyId: "AKIAZI5MCZIFLLONLSQC",
secretAccessKey: "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",
});

router.post("/fileUpload", upload.single("picture"), async(req, res) => {
console.log(req.file, "file")
if (req.file == null) {
  return res.status(400).json({ 'message': 'Please choose the file' })
}
const file = req.file;
  let params = {
    Bucket: "lean-ai-web",
    Key: file.filename,
    Body: fs.createReadStream(file.path),
   // acl:"public-read"
  };
  try {
    s3Client.upload(params, async(err, data) => {
      if (err) {
        res.status(500).send({error: err.message});
      }
      console.log(data,"data")
      await updatePicture(data.Location);
      res.send({
        message: "Profile picture uploaded to S3 and user profile updated successfully!",
        location: data.Location,
      });
      console.log(data.Location, "location");
 
    });

 } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
})

module.exports = router;
