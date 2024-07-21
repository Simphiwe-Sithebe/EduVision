const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const dbFunctions = require("../config/dbFunctions");
//const {sendMessage} = require("../utils/nodemailer");
const { STATUS_CODE, ROLES } = require("../constants/");
const { sendMessage } = require("../utils/nodemailer");

const Auth = {
  register: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        password_hash,
        rsa_id,
        user_role,
        phone_number,
        user_address,
        course_id,
      } = req.body;

      // Check if all required fields are provided
      if (
        !first_name ||
        !last_name ||
        !email ||
        !password_hash ||
        !rsa_id ||
        !user_role ||
        !phone_number ||
        !user_address ||
        !course_id
      ) {
        return res
          .status(STATUS_CODE.Bad_Request)
          .json({ status: false, message: "Fill in all the required fields" });
      }
      // Check if the email is already taken
      let userExist = await dbFunctions.selectByEmail("users", email);
      if (userExist) {
        return res.status(STATUS_CODE.Bad_Request).json({
          status: false,
          message: "That email address is already in use.",
        });
      }
      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password_hash, salt);

      // Generate identification number
      let identification_number = generateIdentificationNumber();

      while (identification_number == userExist?.userExist) {
        identification_number = generateIdentificationNumber();
      }

      if (rsa_id == userExist?.rsa_id) {
        return res
          .status(STATUS_CODE.Bad_Request)
          .json({ status: false, message: "RSA ID is already in used." });
      }
      // Create user object
      const newUser = {
        identification_number,
        first_name,
        last_name,
        email,
        password_hash: hashedPassword,
        rsa_id,
        user_role,
        phone_number,
        user_address,
        registration_date: new Date(),
        course_id,
        created_at: new Date(),
      };

      // Create user in the database
      await dbFunctions.createData("users", newUser);

      // Send registration confirmation email asynchronously
      sendMessage(
        first_name,
        last_name,
        identification_number,
        email,
        user_role,
        "Registration Confirmation"
      )
        .then((emailStatus) => {
          console.log("Email sent successfully.");
        })
        .catch((error) => {
          console.error("Failed to send email:", error);
        });

      // Respond to the client
      res.status(201).json({
        status: true,
        message: "User registered successfully.",
        user: { first_name, last_name, email },
      });
    } catch (error) {
      console.error("Registration failed:", error);
      res.status(STATUS_CODE.Internal).json({
        status: false,
        message: "Something went wrong, try again...",
        error,
      });
    }
  },

  login: async (req, res) => {
    const { identification_number, password, user_role } = req.body;
    try {
      let userExist = "";

      if (!identification_number) {
        userExist = await dbFunctions.selectWithCondition(
          "users",
          { email: process.env.ADMIN_EMAIL },
          1
        );
      } else {
        userExist = await dbFunctions.selectWithCondition(
          "users",
          { identification_number: identification_number },
          1
        );
      }

      let errorMessage = `Incorrect ${tooLowerCase(
            user_role
          )} number or password... Enter correct credentials`;

      if(user_role == 'ADMIN'){
        errorMessage = 'Enter correct password'
      }


      if (!userExist) {
        return res.status(STATUS_CODE.Bad_Request).json({
          status: false,
          message: errorMessage
        });
      }

      userExist = userExist[0];

      if(userExist == undefined){
        return res.status(STATUS_CODE.Bad_Request).json({
          status: false,
          message: errorMessage
        });
      }

      const isMatched = await bcrypt.compare(password, userExist.password_hash);
      if (!isMatched || user_role !== userExist.user_role) {
        return res.status(STATUS_CODE.Bad_Request).json({
          status: false,
          message: errorMessage
        });
      }
      const payload = {
        id: userExist.user_id,
        email: userExist.email,
      };
      const secretOrPrivateKey = process.env.SECRET_PRIVATE_KEY;
      const token = jwt.sign(payload, secretOrPrivateKey, { expiresIn: "1d" });
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", token, {
          httpOnly: true,
          maxAge: 86400, // Expires in 1 day (1d * 24h * 60m * 60s)
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        })
      );
      res.status(STATUS_CODE.Success).json({
        status: true,
        message: "User has been successfully logged in.",
      });
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json({
        status: false,
        message: "Something went wrong, try again...",
        error,
      });
    }
  },

  logout: (req, res) => {
    res.clearCookie("token");
    console.log("Logging out the user");
    res.redirect("/");
  },
  resetPassword: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(STATUS_CODE.Bad_Request).json({
        status: false,
        message: "Please provide your email address.",
      });
    }

    try {
      // Check if the user with the provided email exists
      const user = await dbFunctions.selectById("users", email);

      if (!user) {
        return res.status(STATUS_CODE.Not_Found).json({
          status: false,
          message: "User with this email address does not exist.",
        });
      }

      // Generate a unique token for password reset
      const resetToken = generateResetToken();

      // Save the reset token and expiration time in the database
      const resetData = {
        email: user.email,
        resetToken: resetToken,
        resetExpires: Date.now() + 3600000, // Token expires in 1 hour
      };
      await dbFunctions.createData("password_resets", resetData);

      // Send the password reset email with the reset link
      const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      nodemailer.sendMessage(
        user.username,
        user.email,
        "Password Reset",
        `Click the following link to reset your password: ${resetLink}`
      );

      return res.status(STATUS_CODE.Success).json({
        status: true,
        message: `Password reset link has been sent to ${email}. Check your email.`,
      });
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODE.Internal).json({
        status: false,
        message: "Something went wrong, try again later.",
        error: error.message,
      });
    }
  },

  createNewPassword: async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(STATUS_CODE.Bad_Request).json({
        status: false,
        message: "Reset token and new password are required.",
      });
    }

    try {
      // Check if there is a matching reset token in the database
      const resetData = await dbFunctions.selectById(
        "password_resets",
        "resetToken",
        resetToken
      );

      if (!resetData || resetData.resetExpires < Date.now()) {
        return res.status(STATUS_CODE.Bad_Request).json({
          status: false,
          message: "Invalid or expired reset token.",
        });
      }

      // Update the user's password in the database
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      await dbFunctions.updateData("users", resetData.email, {
        password: hashedPassword,
      });

      // Delete the used reset token from the database
      await dbFunctions.deleteData("password_resets", resetData.id);

      return res.status(STATUS_CODE.Success).json({
        status: true,
        message: "Password updated successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODE.Internal).json({
        status: false,
        message: "Something went wrong, try again later.",
        error: error.message,
      });
    }
  },
};

function generateResetToken() {
  const token = require("crypto").randomBytes(20).toString("hex");
  return token;
}

function generateIdentificationNumber() {
  // Generate a random 6-digit number
  const randomNumber = Math.floor(100000 + Math.random() * 900000);

  // Append "22" to the random number
  const studentNumber = `22${randomNumber}`;

  return studentNumber;
}

function tooLowerCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = Auth;
