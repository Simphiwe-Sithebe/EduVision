const {
  createData,
  deleteData,
  updateData,
  selectWithConditionIgnoreCase,
} = require("../config/dbFunctions");
const { ROLES } = require("../constants/");

const Module = {
  create: async (req, res, next) => {
    try {
      const { module_name, module_code, course_id } = req.body;
      if (!module_name || !module_code || !course_id) {
        return res.status(400).json({
          status: false,
          message: "Module name and module code are required.",
        });
      }

      const newModule = {
        module_name: module_name.toLowerCase(),
        module_code,
        course_id,
      };
      await createData("modules", newModule);
      res
        .status(201)
        .json({ status: true, message: "Module created successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Internal server error." });
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { module_name, module_code } = req.body;

      // Validation: At least one of module_name or module_code should be provided
      if (!module_name && !module_code) {
        return res.status(400).json({
          status: false,
          message:
            "At least one of module_name or module_code is required for update.",
        });
      }

      const updatedModule = {
        module_name,
        module_code,
      };

      await updateData("modules", id, updatedModule);

      res
        .status(200)
        .json({ status: true, message: "Module updated successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Internal server error." });
    }
  },

  delete: async (req, res, next) => {
    try {
      const { moduleID } = req.params;

      let modules = await selectWithConditionIgnoreCase(
        "modules",
        { module_id: moduleID },
        1
      );
      const users = await selectWithConditionIgnoreCase(
        "users",
        { course_id: modules[0].course_id, user_role: ROLES.Student },
        1
      );

      if (users && users.length > 0) {
        return res.status(403).json({
          status: false,
          message:
            "Cannot delete this module. It has been registered by one or more students.",
        });
      }
      await deleteData("modules", "module_id", moduleID);
      res
        .status(200)
        .json({ status: true, message: "Module deleted successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Internal server error." });
    }
  },
};

module.exports = Module;
