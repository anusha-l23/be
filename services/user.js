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
    } = user;
    
    const passwordHash = await bcrypt.hashSync(password, 10);
    const result = await models.User.create({
      firstName,
      lastName,
      email,
     password: passwordHash
    });

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
          const token = jwt.sign({ sub: user.id }, process.env.secret, {
            expiresIn: "7d",
          });

          return {
            user,
            token,
            statusCode: 200,
            message:"User login successfully"
          };
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
  updatePicture
};
