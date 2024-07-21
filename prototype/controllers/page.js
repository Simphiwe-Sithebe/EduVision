const passport = require("passport");
const cookie = require("cookie");
const { ROLES } = require("../constants/");
const dbFunctions = require("../config/dbFunctions");
const json = require("body-parser/lib/types/json");

const LANGUAGE = process.env["TRANSLATE_TO"];

const Page = {
  viewModuleTest: async (req, res, next) => {
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
        if (user.user_role === ROLES.Student) {
          const { testId } = req.params;
          
          let tests = await dbFunctions.selectWithConditionIgnoreCase(
            "tests",
            { test_id: testId },
            1
          );
          let questions = await dbFunctions.selectWithConditionIgnoreCase(
            "questions",
            { test_id: testId },
            1
          );
          let modules = await dbFunctions.selectWithConditionIgnoreCase(
            "modules",
            { module_id: tests[0].module_id },
            1
          );

          console.log(questions);

          return res.render("student/test", {
            language: LANGUAGE,
            user: user,
            questions: questions ? questions : [],
            test_name: tests ? tests[0].test_name : "",
            module_name: modules ? modules[0].module_name : "",
            module_id: modules ? modules[0].module_id : "",
          });
        }
        res.redirect("./");
      }
    )(req, res, next);
  },

  viewReport: async (req, res, next) => {
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

          const {studentId , moduleId, testId } = req.params;
 
          let users = await dbFunctions.selectWithConditionIgnoreCase(
            "users",
            { user_id: studentId },
            1
          );

          let modules = await dbFunctions.selectWithConditionIgnoreCase(
            "modules",
            { module_id: moduleId },
            1
          );
          
          let tests = await dbFunctions.selectWithConditionIgnoreCase(
            "tests",
            { test_id: testId },
            1
          );
          let questions = await dbFunctions.selectWithConditionIgnoreCase(
            "questions",
            { test_id: testId },
            1
          );

          // Initialize an array to store questions with answers
          let questionsWithAnswers = [];

          // Iterate over each question to fetch its answers
          for (let i = 0; i < questions.length; i++) {
            let question = questions[i];
            // Fetch answers for the current question
            let answers = await dbFunctions.selectWithConditionIgnoreCase(
              "answer",
              { test_id: testId, question_id: question.question_id , student_id: studentId },
              1 
            );

            let marks = 0;
            for (let j = 0; j < answers.length; j++) {
              if (answers[j].outcome === 'Correct') {
                marks++;
              }
              // You may assign different marks for correct vs incorrect answers as needed
            }
            // Add question details along with answers to the result array
            questionsWithAnswers.push({
              question_id: question.question_id,
              question_text: question.question_text,
              test_id: question.test_id,
              marks: marks,
              answer: answers[0] // Array of answers for the current question
            });
          }

          let totalMarks = 0;
          for (let index = 0; index < questionsWithAnswers.length; index++) {
              totalMarks += questionsWithAnswers[index].marks;
          }

          console.log("questions", questions);
          console.log("questionsWithAnswers", questionsWithAnswers);


          let percentage = Math.round((totalMarks *100) / questionsWithAnswers.length);

          console.log(" totalMarks : " , percentage , "%");

          return res.render("lecturer/report", {
            moduleName: modules[0].module_name,
            moduleCode: modules[0].module_code,
            testName: tests[0].test_name,
            user: users[0],
            questions: questionsWithAnswers,
            test: tests[0],
            totalMarks: percentage
          });
        }
        res.redirect("./");
      }
    )(req, res, next);
  },

  viewModules: async (req, res, next) => {
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

        if (user.user_role === ROLES.Student) {
          const modules = await dbFunctions.selectWithCondition(
            "modules",
            { course_id: user.course_id },
            1
          );
          return res.render("student/modules", {
            user: user,
            modules: modules ? modules : [],
          });
        }

        res.redirect("/");
      }
    )(req, res, next);
  },

  viewModule: async (req, res, next) => {
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
        if (user.user_role === ROLES.Student) {
          const { moduleName } = req.params;
          const decodedModuleName = moduleName.replace(/%20/g, " ");

          let modules = await dbFunctions.selectWithConditionIgnoreCase(
            "modules",
            { module_code: decodedModuleName, course_id: user.course_id },
            1
          );
          let tests = [];

          if (modules && modules.length > 0) {
            const module_id = modules[0].module_id;
            tests = await dbFunctions.selectWithCondition(
              "tests",
              { module_id: module_id },
              1
            );

            console.log("tests [] ", tests);

            const testIds = tests.map(test => test.test_id);
            for (let i = 0; i < testIds.length; i++) {
              const answers = await dbFunctions.selectWithConditionIgnoreCase(
                "answer",
                { test_id: testIds[i] , student_id: user.user_id },
                1
              );

              const questions = await dbFunctions.selectWithConditionIgnoreCase(
                "questions",
                { test_id: testIds[i] },
                1
              );

              if(questions.length == 0){
                tests = tests.filter((test) => test.test_id !== testIds[i]);
              }

              if(answers.length > 0){
                tests = tests.filter((test) => test.test_id !== testIds[i]);
              }
            }

          }

          return res.render("student/module", {
            user: user,
            module_name: modules ? modules.module_name : "",
            tests: tests ? tests : [],
          });
        }
        res.redirect("/");
      }
    )(req, res, next);
  },
  viewModuleTesting: async (req, res, next) => {
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
          const { moduleName } = req.params;
          const decodedModuleName = moduleName.replace(/%20/g, " ");

          let modules = await dbFunctions.selectWithConditionIgnoreCase(
            "modules",
            { module_code: decodedModuleName, course_id: user.course_id },
            1
          );
          let tests = [];

          if (modules && modules.length > 0) {
            const module_id = modules[0].module_id;
            tests = await dbFunctions.selectWithCondition(
              "tests",
              { module_id: module_id },
              1
            );

            console.log("tests [] ", tests);

            const testIds = tests.map(test => test.test_id);
            for (let i = 0; i < testIds.length; i++) {

              console.log(testIds[i]);

              const answers = await dbFunctions.selectWithConditionIgnoreCase(
                "answer",
                { test_id: testIds[i] },
                1
              );

              const questions = await dbFunctions.selectWithConditionIgnoreCase(
                "questions",
                { test_id: testIds[i] },
                1
              );

              if(questions.length == 0){
                tests = tests.filter((test) => test.test_id !== testIds[i]);
              }

              if(answers.length > 0){
                tests = tests.filter((test) => test.test_id !== testIds[i]);
              }
            }




           

          }

          return res.render("student/module", {
            user: user,
            module_name: modules ? modules.module_name : "",
            tests: tests ? tests : [],
          });
      }
    )(req, res, next);
  },

  viewTest: async (req, res) => {
    const { module_id } = req.params;

    const tests = await dbFunctions.selectWithCondition(
      "tests",
      { module_id },
      1
    );
    const modules = await dbFunctions.selectWithCondition(
      "modules",
      { module_id },
      1
    );

    const testIdS = new Set(tests.map((test) => test.test_id));
    const testids = Array.from(testIdS);


    for (const test of tests) {
      const answers = await dbFunctions.selectWithCondition(
        "answer",
        { test_id: test.test_id },
        1
      );
      // Add a property to the test object indicating whether it has answers
      test.hasAnswers = answers.length > 0;
    }

    console.log("modules ", modules);
    res.render("lecturer/test", {
      tests: tests ? tests : [],
      module_id: module_id ? module_id : 0,
      module: modules[0],
    });
  },

  viewWrittenTest: async (req, res, next) => {
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
        const { test_id } = req.params;
        const responses = await selectWithCondition("responses", { test_id: test_id });
        const tests = await selectWithCondition("tests", { test_id: test_id });
        const studentIds = responses.map(response => response.student_id);
        const students = await selectWithCondition("users", { user_id: studentIds });

        console.log("students ", students);
          res.render("lecturer/writtenTests", {
            test: tests[0],
            students: students ? students : [],
          });
        }
        res.redirect("/");
      }
    )(req, res, next);
  },

  viewQuestion: async (req, res) => {
    const testId = req.query.test; // Get the value of the 'test' query parameter
    try {
      const pageNumber = 1;
      const questions = await dbFunctions.selectWithCondition(
        "questions",
        { test_id: testId },
        1
      );
      const tests = await dbFunctions.selectWithCondition(
        "tests",
        { test_id: testId },
        1
      );

      console.log("tests ", tests);

      return res.render("lecturer/question", {
        questions: questions ? questions : [],
        testId: testId,
        test: tests[0],
      });
    } catch (error) {
      console.log(error);
    }
  },

  register: async (req, res) => {
    try {
      const pageNumber = 1;
      const courses = await dbFunctions.selectDataWithPagination(
        "courses",
        pageNumber
      );
      res.render("register", { courses });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).send("Internal Server Error");
    }
  },
  login: (req, res) => {
    res.render("index");
  },
  homePage: (req, res, next) => {
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
          return res.render("admin/menu");
        } else if (user.user_role === ROLES.Lecturer) {
          try {
            const pageNumber = 1;
            const modules = await dbFunctions.selectWithCondition(
              "modules",
              { course_id: user.course_id },
              1
            );
            console.log(modules);
            return res.render("lecturer/menu", {
              user: user,
              modules: modules ? modules : [],
            });
          } catch (error) {
            console.log(error);
          }
        } else if (user.user_role === ROLES.Student) {
          const courses = await dbFunctions.selectWithCondition(
            "courses",
            { course_id: user.course_id },
            1
          );

          return res.render("student/menu", {
            user: user,
            course_name: courses[0].course_name,
          });
        }
        res.render("index");
      }
    )(req, res, next);
  },
};

module.exports = Page;
