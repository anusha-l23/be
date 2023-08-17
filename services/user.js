const models = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendingMail } = require("../nodemailer/mailing");
const config = require("../config/config.json")[process.env.NODE_ENV];
const { Op, where } = require('sequelize');
Date.prototype.add15minutes = function () {
  return this.setMinutes(this.getMinutes() + 15);
};

async function register(user) {
  try {
    const userExists = await models.User.findOne({
      where: { email: user.email },
    });
    const {
      email,
      firstName,
      lastName,
      password,
      bio,
      company,
      business,
      role,
      isEmailVerified,
    } = user;
    if (userExists) {
      throw new Error("User already registered");
    }
    const passwordHash = await bcrypt.hashSync(password, 10);

    const result = await models.User.create({
      firstName,
      lastName,
      email,
      bio,
      company,
      business,
      role,
      password: passwordHash,
      isEmailVerified,
    });
    if (result) {

      let setCode = await models.UserVerification.create({
        userId: result.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiry: new Date().add15minutes(),
      });

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

      return {
        ...omitPassword(result.get()),
      };
    } else {
      return res.status(409).send("Details are not correct");
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

function omitPassword(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
    const userverification = await models.UserVerification.findOne({ where: { userId: user.id }, order: [['createdAt', 'DESC']], LIMIT: 1 })

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
      let resendToken = await models.UserVerification.create({
        userId: user.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiry: new Date().add15minutes(),
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
            ...omitPassword(user.get()),
            token,
          };
        } else {
          return {
            statusCode: 401,
            message: "User not verified",
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

async function validateToken(token) {
  const data = jwt.verify(token, process.env.secret, function (err, decoded) {
    if (err) {
      return err;
    } else {
      return decoded;
    }
  });
  console.log(data);
  return data;
}

async function forgotPassword({ email }) {
  try {
    const user = await models.User.findOne({
      where: { email },
    });
    if (user && !user.isEmailVerified) {
      return {
        statusCode: 400,
        message: 'Email is not confirmed. Check your email'
      }
    }
    if (user) {
      let setToken = await models.ForgotPasswordToken.create({
        userId: user.id,
        code: Math.floor(100000 + Math.random() * 900000),
        expiryDate: new Date().add15minutes()
      });

      if (setToken) {
        sendingMail({
          from: process.env.EMAIL_USER,
          to: `${email}`,
          subject: "Reset Password Link",
          html: `Hi, ${user.firstName}, below is your verification code for resetting the password
          <br/>
          verification code: ${setToken.code}.
          <br/>
      Please click the link to reset your password of your email id ${user.email}, the link will be valid for 15 minutes:
      <a href="http://localhost:3000/reset-password-with-token?email=${user.email}&code=${setToken.code}">Reset</a>`
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

async function resetPasswordWithToken(code, password, email) {
  try {
    const user = await models.User.findOne({
      where: { email },
    });
    if (!user) {
      throw new Error("User not found");
    }

    var result = await models.ForgotPasswordToken.findOne({ attributes: ['id', 'userId', 'code', 'expiryDate', 'createdAt', 'updatedAt'], where: { userId: user.id }, order: [['createdAt', 'DESC']], LIMIT: 1 })

    if (result && result.code === code) {

      if (result.expiryDate > new Date()) {
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


async function resetPassword(email, oldPassword, newPassword) {
  try {
    const user = await models.User.findOne({
      where: { email },
    });
    if (!user) {
      throw new Error("User not found");
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      const passwordHash = await bcrypt.hashSync(newPassword, 10);
      const result = await models.User.update(
        {
          password: passwordHash,
        },
        { where: { id: user.id } }
      );
    } else {
      throw new Error("Old password is incorrect");
    }

    return {
      id: user.id,
      email: email,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function saveUserBio(user) {
  try {
  } catch (err) { }
}

async function updateProfile(user) {
  try {
    const userExists = await models.User.findOne({
      where: { email: user.email },
    });

    const { firstName, lastName, bio, company, business, role } = user;
    if (!userExists) {
      throw new Error("User not exists");
    }

    const result = await models.User.update(
      {
        firstName,
        lastName,
        bio,
        company,
        business,
        role,
      },
      { where: { id: userExists.id } }
    );

    return {
      id: userExists.id,
      ...user,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updatePicture(user) {
  try {
    const userExists = await models.User.findOne({
      where: { email: user.email },
    });

    const { picture } = user;

    if (!userExists) {
      throw new Error("User not exists");
    }

    const result = await models.User.update(
      {
        picture,
      },
      { where: { id: userExists.id } }
    );

    return {
      id: userExists.id,
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
  resetPassword,
  updateProfile,
  updatePicture,
  saveUserBio,
  validateToken,
  userVerify,
  forgotPassword,
  resetPasswordWithToken,
  resendEmail
};
