const chalk = require("chalk");
const bcrypt = require("bcrypt");
const { ROLES } = require("../constants/index");
const User = require("../models/user");
const pool = require("./pool");

async function seedDB() {
  const admin = await User.findOne({ roles: ROLES.SuperAdmin });
  console.log(`${chalk.blue("✓")} ${chalk.blue("seed db started")}`);
  if (admin) {
    await cleanUpDB(admin);
  }
  const saltRounds = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(
    process.env.SUPER_ADMIN_PASSWORD,
    saltRounds
  );

  const newSuperAdmin = {
    username: process.env.SUPER_ADMIN_USERNAME,
    email: process.env.SUPER_ADMIN_EMAIL,
    password: hashedPassword,
    quizlimit: 100000,
    roles: ROLES.SuperAdmin,
  };
  try {
    await createData("users", newSuperAdmin);
    console.log(`${chalk.green("✓")} ${chalk.green("seed db finished")}`);
  } catch (error) {
    console.log(
      `${chalk.red("x")} ${chalk.red("error while seeding database")}`
    );
  }
}

async function cleanUpDB(admin) {
  console.log(`${chalk.blue("✓")} ${chalk.blue("cleaning db has started")}`);
  try {
    await deleteData("users", "_id", admin._id);
    console.log(`${chalk.green("✓")} ${chalk.green("cleaning db finished")}`);
  } catch (error) {
    console.log(
      `${chalk.red("x")} ${chalk.red("error while cleaning database")}`
    );
    process.exit(1);
  }
}

module.exports = seedDB;
