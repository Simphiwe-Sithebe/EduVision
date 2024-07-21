const dbFunctions = require("../config/dbFunctions");
const passport = require("passport");
const cookie = require("cookie");
const bcrypt = require("bcrypt");
const { STATUS_CODE } = require("../constants/");
const { ROLES } = require("../constants/");
const { validationResult } = require("express-validator");

const SuperAdmin = {
  viewStudents: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          return res.status(500).render("error/server");
        }
        if (!user) {
          return res.render("index", { isAuthenticated: false });
        }
        if (user.user_role === ROLES.Admin) {
          const { testId } = req.params;
          let students = await dbFunctions.selectWithConditionIgnoreCase(
            "users",
            { user_role: ROLES.Student },
            1
          );
          console.log(students);
          return res.render("admin/students", {
            user: user,
            students: students ? students : [],
          });
        }
        res.redirect("/");
      }
    )(req, res, next);
  },
  viewLecturers: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          return res.status(500).render("error/server");
        }
        if (!user) {
          return res.render("index", { isAuthenticated: false });
        }
        if (user.user_role === ROLES.Admin) {
          let lecturers = await dbFunctions.selectWithConditionIgnoreCase(
            "users",
            { user_role: ROLES.Lecturer },
            1
          );
          console.log(lecturers);
          return res.render("admin/lecturers", {
            user: user,
            lecturers: lecturers ? lecturers : [],
          });
        }
        res.redirect("/");
      }
    )(req, res, next);
  },

  viewEditUser: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          return res.status(500).render("error/server");
        }
        if (!user) {
          return res.render("index", { isAuthenticated: false });
        }
        if (user.user_role === ROLES.Admin) {
          const userId = req.params.userId;

          let userData = await dbFunctions.selectWithConditionIgnoreCase(
            "users",
            { user_id: userId },
            1
          );
          return res.render("admin/edit_user", {
            userData: userData[0],
            errors: [],
          });
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },

  editUser: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          return res.status(500).render("error/server");
        }
        if (!user) {
          return res.render("index", { isAuthenticated: false });
        }
        if (user.user_role === ROLES.Admin) {
          const {
            user_id,
            first_name,
            last_name,
            email,
            password,
            password_retyped,
            rsa_id,
            phone_number,
            user_address,
          } = req.body;
          const errors = validationResult(req);

          // Remove password-related errors if passwords are empty
          if (!password && !password_retyped) {
            errors.errors = errors.errors.filter(
              (error) =>
                error.param !== "password" && error.param !== "password_retyped"
            );
          }

          if (!errors.isEmpty()) {
            return res.status(400).render("edit_user", {
              errors: errors.array(),
              userData: req.body,
            });
          }

          let hashedPassword;
          if (password) {
            if (password !== password_retyped) {
              errors.push({ msg: "Passwords do not match" });
              return res.render("edit_user", {
                errors,
                userData: req.body,
              });
            }
            // Hash the password
            const salt = bcrypt.genSaltSync(10);
            hashedPassword = await bcrypt.hash(password, salt);
          }

          const newUser = {
            first_name,
            last_name,
            email,
            ...(password && { password_hash: hashedPassword }),
            rsa_id,
            phone_number,
            user_address,
          };
          await dbFunctions.updateWithCondition("users", newUser, {
            user_id: user_id,
          });
          res.render("admin/success_page", {
            message: "User updated successfully",
          });
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },
  deleteUser: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          return res.status(500).render("error/server");
        }
        if (!user) {
          return res.render("index", { isAuthenticated: false });
        }
        if (user.user_role === ROLES.Admin) {
          const { user_id, user_role } = req.body;
          await dbFunctions.deleteData("users", "user_id", user_id);
          console.log("Student has been deleted.");
          res.render("admin/success_del", {
            message: "User deleted successfully",
            user_role: user_role.toLowerCase(),
          });
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },
  updateUser: async (req, res) => {
    try {
      const userId = req.params.userId;
      const updateFields = req.body; // Assuming the updated fields are in the request body
      await dbFunctions.updateData("users", userId, updateFields);
      res.status(STATUS_CODE.Success).json("User updated successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  toggleUserBlockStatus: async (req, res, isBlocked) => {
    try {
      const userId = req.params.userId;
      const updateFields = { isBlocked }; // Assuming there's a field 'isBlocked' in your users table
      await dbFunctions.updateData("users", userId, updateFields);
      res
        .status(STATUS_CODE.Success)
        .json(`User ${isBlocked ? "blocked" : "unblocked"} successfully`);
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  blockUser: async (req, res) => {
    try {
      const userId = req.params.userId;
      await SuperAdmin.toggleUserBlockStatus(req, res, true);
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  unBlockUser: async (req, res) => {
    try {
      const userId = req.params.userId;
      await SuperAdmin.toggleUserBlockStatus(req, res, false);
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  createModule: async (req, res) => {
    try {
      const moduleData = req.body; // Assuming module data is in the request body
      await dbFunctions.createData("modules", moduleData);
      res.status(STATUS_CODE.Created).json("Module created successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  createTest: async (req, res) => {
    try {
      const testData = req.body; // Assuming test data is in the request body
      await dbFunctions.createData("tests", testData);
      res.status(STATUS_CODE.Created).json("Test created successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  createQuestion: async (req, res) => {
    try {
      const questionData = req.body; // Assuming question data is in the request body
      await dbFunctions.createData("questions", questionData);
      res.status(STATUS_CODE.Created).json("Question created successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  updateModule: async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      const updateFields = req.body; // Assuming the updated fields are in the request body
      await dbFunctions.updateData("modules", moduleId, updateFields);
      res.status(STATUS_CODE.Success).json("Module updated successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  updateTest: async (req, res) => {
    try {
      const testId = req.params.testId;
      const updateFields = req.body; // Assuming the updated fields are in the request body
      await dbFunctions.updateData("tests", testId, updateFields);
      res.status(STATUS_CODE.Success).json("Test updated successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  updateQuestion: async (req, res) => {
    try {
      const questionId = req.params.questionId;
      const updateFields = req.body; // Assuming the updated fields are in the request body
      await dbFunctions.updateData("questions", questionId, updateFields);
      res.status(STATUS_CODE.Success).json("Question updated successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  deleteModule: async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      await dbFunctions.deleteData("modules", moduleId);
      res.status(STATUS_CODE.Success).json("Module deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  deleteTest: async (req, res) => {
    try {
      const testId = req.params.testId;
      await dbFunctions.deleteData("tests", testId);
      res.status(STATUS_CODE.Success).json("Test deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },

  deleteQuestion: async (req, res) => {
    try {
      const questionId = req.params.questionId;
      await dbFunctions.deleteData("questions", questionId);
      res.status(STATUS_CODE.Success).json("Question deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.Internal).json("Internal Server Error");
    }
  },
};

module.exports = SuperAdmin;
