const models = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendingMail } = require("../nodemailer/mailing");




async function register(user) {
  try {
    const userExists = await models.User.findOne({
      where: { email: user.email },
    });

    if (userExists) {
      throw new Error("User already registered");
    }
    const {
      email,
      firstName,
      lastName,
      password,
      isEmailVerified
    } = user;

    const passwordHash = await bcrypt.hashSync(password, 10);
    const result = await models.User.create({
      firstName,
      lastName,
      email,
      isEmailVerified,
      password: passwordHash
    });

    if (result) {
      let setCode = await models.emailVerify.create({
        userId: result.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiry: new Date(Date.now() + 3600000)
      })

      console.log(setCode, "email")
      if (setCode) {
        sendingMail({
          from: process.env.EMAIL_USER,
          to: `${email}`,
          subject: "Account Verification Link",
          html: `Hi ${firstName},
      Below is the verification code to verify your email id ${user.email}.
      <br/>
      verification code: ${setCode.code}.
    <br/>
        Alternatively, Please click on the link to verify the account.
          <a href="http://localhost:3000/userVerification?email=${user.email}&code=${setCode.code}"> Verify </a>`,
        });
      } else {
        return res.status(400).send("token not created");
      }
    }
    else {
      return res.status(409).send("Details are not correct");
    }
    return {
      result,
      statusCode: 200,
      message: "user registered successfully..."
    };

  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function userVerify(data) {
  try {
    const code = data.code;
    const email = data.email;

    const user = await models.User.findOne({
      where: { email: email },
    });

    if (!user) {
      return {
        statusCode: 401,
        message:
          "We were unable to find a user for this verification. Please SignUp!",
      };
    }

    const userId = user.id;
    const userverification = await models.emailVerify.findOne({ where: { userId: user.id }, order: [['createdAt', 'DESC']], LIMIT: 1 })

    console.log(userverification, "latest")
    console.log(code, email)

    if (user.isEmailVerified) {
      return {
        statusCode: 400,
        message: "User has been already verified. Please Login https://www.smarketify.ai",
      };
    }

    if (userverification && userverification.code === code) {
      const currentDate = new Date();
      if (userverification.expiry > currentDate) {
        const updated = await models.User.update(
          { isEmailVerified: true },
          {
            where: {
              id: userverification.userId,
            },
          }
        );
        console.log(updated, "updated");

        if (updated) {
          return {
            statusCode: 200,
            expiry: false,
            message: `Your account has been successfully verified. Please click <a href="https://www.smarketify.ai">here</a> to redirect to the website.`,
          };
        } else {
          return {
            statusCode: 500,
            message: "Verification code doesn't match",
          };
        }

      } else {
        return {
          statusCode: 400,
          message:
            "Your verification code expired. Please resend verification email and try again.",
        };
      }

    } else {
      return {
        statusCode: 400,
        message:
          "Invalid token",
      };
    }

  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function resendEmail({ email }) {
  try {
    const user = await models.User.findOne({
      where: { email },
    });
    console.log(user.email, "email")
    if (user) {
      let resendToken = await models.emailVerify.create({
        userId: user.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiry: new Date(Date.now() + 3600000),
      });

      if (resendToken) {
        sendingMail({
          from: process.env.EMAIL_USER,
          to: `${email}`,
          subject: "Email Verification Link",
          html: `Hi, ${user.firstName}, below is your verification code for email verification.
   <br/>
   verification code: ${resendToken.code}.
          <br/>
      Alternatively, Please click the link to verify your email id ${user.email}, the link will be valid for 15 minutes:
      <a href="http://localhost:3000/userVerification?email=${user.email}&code=${resendToken.code}">Verify</a>`
        });

        return {
          statusCode: 200,
          message: "Email resend successfully for email verification"
        };

      }
      else {
        return {
          status: false,
          message: 'Token not created',
        };
      }
    }
    else {
      return {
        status: false,
        message: 'Email not found',
      };
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function login({ email, password }) {
  try {
    console.log(email, password);
    const user = await models.User.findOne({ where: { email: email } });

    console.log(user, "user");

    if (!user) {
      throw new Error("Email not found");
    }
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        if (user.isEmailVerified) {
          const token = jwt.sign({ sub: user.id }, process.env.secret, {
            expiresIn: "7d",
          });

          return {
            user,
            token,
            statusCode: 200,
            message: "User login successfully"
          };

        }
        else {
          return {
            statusCode: 401,
            message: "User not verified, please check your mail for verification link",
          };
        }
      } else {
        return {
          statusCode: 401,
          message: "Authentication failed",
        };
      }
    } else {
      return {
        statusCode: 401,
        message: "Authentication failed",
      };
    }
  } catch (error) {
    console.log(error);
  }
}

async function forgotPassword({ email }) {
  try {
    const user = await models.User.findOne({
      where: { email },
    });

    if (user) {
      let token = await models.ForgotPassword.create({
        userId: user.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiry: new Date(Date.now() + 3600000)
      });

      if (token) {
        sendingMail({
          from: 'anusha.lakkakula2022@gmail.com',
          to: `${email}`,
          subject: "Reset Password Link",
          html: `Click the following link to reset your password:
      <a href="http://localhost:3000/reset-password/${token.code}">Reset</a>`
        });

        return {
          statusCode: 200,
          message: "Email sent successfully..."
        };

      }
      else {
        return {
          status: false,
          message: 'Email not found',
        };
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function resetPassword(code, password, email) {
  try {
    console.log(code, "code")
    const user = await models.User.findOne({
      where: { email },
    });
    if (!user) {
      throw new Error("User not found");
    }

    var result = await models.ForgotPassword.findOne({ where: { userId: user.id }, order: [['createdAt', 'DESC']], LIMIT: 1 })
    if (result && result.code === code) {

      if (result.expiry > new Date()) {
        const passwordHash = await bcrypt.hashSync(password, 10);
        await models.User.update(
          {
            password: passwordHash,
          },
          {
            where:
              { id: result.userId }
          }
        );
      }
      else {
        throw new Error("Expired token");
      }
    } else {
      throw new Error("Invalid token");
    }
    return {
      statusCode: 200,
      message: "Password reset successfully"
    }

  } catch (err) {
    console.log(err);
    throw err;
  }
}


async function updateProfile(user) {
  try {
    const userExist = await models.User.findOne({
      where: { email: user.email },
    });

    const { firstName, lastName, picture } = user;
    if (!user) {
      throw new Error("User not exists");
    }

    const result = await models.User.update(
      {
        firstName,
        lastName,
        picture
      },
      { where: { id: userExist.id } }
    );

    return {
      id: userExist.id,
      ...user,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updatePicture(user) {
  try {

    const { picture } = user;

    const result = await models.User.update(
      {
        picture,
      },
      { where: {} }
    );

    return {
      ...user,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePicture,
  userVerify,
  resendEmail
};
