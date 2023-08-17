var express = require("express");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook");
var router = express.Router();
const request = require("request");
const {
  register,
  login,
  resetPassword,
  //validateToken,
  updateProfile,
  saveUserBio,
  userVerify,
  forgotPassword,
  updatePicture,
  resetPasswordWithToken,
  resendEmail
} = require("../services/user");
const AWS = require("aws-sdk");
//const { fb_get_long_token, fb_get_pages_url } = require("./url_helper");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "fbimageuploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const s3Client = new AWS.S3({
  accessKeyId: "AKIA4OJLAZKOQH7ZZIKR",
  secretAccessKey: "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",
});

router.post("/fileUpload", upload.single("file"), (req, res) => {
  let params = {
    Bucket: "smarketify-assets",
    Key: "jpg",
    Body: "file",
  };
  try {
    s3Client.upload(params, (err, data) => {
      if (err) {
        res.status(500).json({ error: "Error -> " + err });
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

router.get("/userVerification", async (req, res, next) => {
  try {
    const data = req.query;
    const result = await userVerify(data);

    return res.status(result.statusCode).send(result);

  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/resend-email-verify", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await resendEmail(data);
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

router.post("/reset-password-with-token", async (req, res, next) => {
  try {
    const result = await resetPasswordWithToken(req.body.code, req.body.password, req.body.email);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await resetPassword(
      req.body.email,
      req.body.oldPassword,
      req.body.newPassword
    );
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALL_BACK_URL,
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(accessToken, refreshToken, profile, cb);
      const url = fb_get_long_token(accessToken);
      request(url, (error, response, body) => {
        // Printing the error if occurred
        if (error) console.log(error);
        // Printing status code
        console.log(response.headers);
        // Printing body
        console.log(body);
      });
      return cb(null, { accessToken: accessToken, profile: profile });
    }
  )
);

router.get("/auth/facebook", passport.authenticate("facebook"));

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    session: false,
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect(process.env.Home_url);
  }
);

router.post("/update-profile", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await updateProfile(data);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});

router.post("/single", async (req, res, next) => {
  try {
    const data = req.body;
    const result = await updateProfile(data);
    res.send(result);
  } catch (err) {
    res.statusCode = 400;
    res.send({
      error: err.message,
    });
  }
});

module.exports = router;
