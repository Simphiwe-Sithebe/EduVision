const passport = require("passport");
const { ROLES } = require("../constants/");
const {
  createData,
  selectWithCondition,
  selectWithConditionIgnoreCase,
} = require("../config/dbFunctions");
const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

let data_exporter = require("json2csv").Parser;
const exceljs = require("exceljs")

const File = {

  exportFile: async (req, res, next) => {
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

            const { user_role } = req.body;
    
        const users = await selectWithConditionIgnoreCase(
            "users",
            { user_role: user_role },
                1
        );


        const processUser = async (innerUser) => {
            const courses = await selectWithConditionIgnoreCase(
              "courses",
              { course_id : innerUser.course_id }, 
              1
            );
            innerUser.courseName = courses[0].course_name;
            innerUser.courseCode = courses[0].course_code;

          };

          await Promise.all(users.map(processUser));
          let workbook = new exceljs.Workbook()

          const sheet = workbook.addWorksheet("users_data")
          sheet.columns = [
            {header: "Student No", key:"identification_number" , width: 25},
            {header: "Name", key:"first_name" , width: 25},
            {header: "Surname", key:"last_name" , width: 25},
            {header: "Email", key:"email" , width: 25},
            {header: "ID Number", key:"rsa_id" , width: 25},
            {header: "Phone Number", key:"phone_number" , width: 25},
            {header: "Residence Address", key:"user_address" , width: 25},
            {header: "Course Name", key:"courseName" , width: 40},
            {header: "Course Code", key:"courseCode" , width: 25},
            {header: "Registered Date", key:"created_at" , width: 25},
          ]

          await users.map((value, index) =>{
            sheet.addRow(value)
          })

          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=report_data.xlsx"
          );
          workbook.xlsx.write(res);
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },



};



module.exports = File;
