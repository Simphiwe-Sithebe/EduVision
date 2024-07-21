const passport = require("passport");
const cookie = require("cookie");
const { ROLES } = require("../constants/");

const {
  createData,
  deleteData,
  updateData,
  updateWithCondition,
} = require("../config/dbFunctions");

const Test = {
  create: async (req, res, next) => {
    try {
      const { test_name, module_id } = req.body;
      await createData("tests", { test_name, module_id });
      res
        .status(201)
        .json({ status: true, message: "Test created successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Internal server error." });
    }
  },
  createTest: async (req, res, next) => {
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
        if (user.user_role === ROLES.Lecturer) {
          try {
            const { test_name, module_id } = req.body;
            await createData("tests", {
              test_name,
              module_id,
              user_id: user.user_id,
            });
            return res
              .status(201)
              .json({ status: true, message: "Test created successfully." });
          } catch (error) {
            console.error(error);
            return res
              .status(500)
              .json({ status: false, message: "Internal server error." });
          }
        }
        return res.redirect("./");
      }
    )(req, res, next);
  },

  update: async (req, res, next) => {
    try {
      const { testID, moduleID } = req.params;
      const { test_name } = req.body;
      await updateWithCondition(
        "tests",
        {
          test_name: test_name,
        },
        { test_id: testID }
      );
      res.redirect(`/test/view/${moduleID}`);
    } catch (error) {
      console.log(error);
      res.redirect(`/test/view/${moduleID}`);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { testId, moduleId } = req.params;
      await deleteData("tests", "test_id", testId);
      res.redirect(`/test/view/${moduleId}`);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Internal server error." });
    }
  },
};

module.exports = Test;
