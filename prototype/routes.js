const express = require("express");
const router = express.Router();
const Page = require("./controllers/page");
const Auth = require("./controllers/auth");
const isUserLoggedIn = require("./utils/checkLogin");
const Module = require("./controllers/module");
const Test = require("./controllers/test");
const Question = require("./controllers/question");
const SuperAdmin = require("./controllers/admin");
const Exam = require("./controllers/exam");
const Translation = require("./controllers/translation");
const File = require("./controllers/generateFile");

// rendering pages - ejs
router.get("/", isUserLoggedIn, Page.homePage);
router.get("/login", Page.login);
router.get("/register", Page.register);

// Admin
router.get("/students", SuperAdmin.viewStudents);
router.get("/lecturers", SuperAdmin.viewLecturers);
router.get("/user/edit/:userId", SuperAdmin.viewEditUser);
router.post("/user/edit", SuperAdmin.editUser);
router.post("/user/delete", SuperAdmin.deleteUser);

// User
router.get("/modules", Page.viewModules);
router.get("/modules/:moduleName", Page.viewModule);
// router.get("/modules/testing/:moduleName", Page.viewModuleTesting);
router.get("/tests/:testId", Page.viewModuleTest);

// Lecturer
router.get("/test/view/:module_id", isUserLoggedIn, Page.viewTest);
router.get("/question/view", Page.viewQuestion);
router.get("/report/view/:studentId/:moduleId/:testId", Page.viewReport);

// AUTH
router.post("/auth/register", Auth.register);
router.post("/auth/login", Auth.login);
router.get("/auth/logout", Auth.logout);

// MODULE
router.post("/module/create", Module.create);
router.delete("/module/delete/:moduleID", Module.delete);

// TEST
router.post("/test/create", Test.createTest);
router.get("/test/delete/:testId/:moduleId", Test.delete);
router.post("/test/update/:testID/:moduleID", Test.update);

// QUESTION
router.post("/question/create", Question.create);
router.get("/question/delete/:questionID/:testId", Question.delete);
router.post("/question/update/:questionID/:testId", Question.update);

// Exam
router.post("/exam/evaluate", Exam.evaluate);
router.get("/exam/outcome", (req, res) => {
  const user = {
    first_name: "Jakaza",
    last_name: "Chauke",
  };
  const responsesData = [
    {
      response_id: 1,
      test_id: 123,
      question_id: 456,
      student_id: 789,
      answer_text: "Lorem ipsum dolor sit amet",
      outcome: "Correct",
      submitted_at: "2024-05-30T12:00:00", // Assuming current timestamp
    },
    {
      response_id: 2,
      test_id: 123,
      question_id: 457,
      student_id: 790,
      answer_text: "Consectetur adipiscing elit",
      outcome: "Wrong",
      submitted_at: "2024-05-30T12:05:00", // Assuming current timestamp
    },
    {
      response_id: 3,
      test_id: 123,
      question_id: 458,
      student_id: 791,
      answer_text: "Sed do eiusmod tempor incididunt",
      outcome: "Correct",
      submitted_at: "2024-05-30T12:10:00", // Assuming current timestamp
    },
    {
      response_id: 4,
      test_id: 123,
      question_id: 459,
      student_id: 792,
      answer_text: "Ut labore et dolore magna aliqua",
      outcome: "Wrong",
      submitted_at: "2024-05-30T12:15:00", // Assuming current timestamp
    },
  ];

  let correctCount = 0;
  let wrongCount = 0;
  let testName = "Final";
  let subject = "Internet Programming";

  responsesData.forEach((response) => {
    if (response.outcome === "Correct") {
      correctCount++;
    } else if (response.outcome === "Wrong") {
      wrongCount++;
    }
  });

  res.render("student/outcome", {
    user: user,
    outcome: responsesData,
    correctCount: correctCount,
    wrongCount: wrongCount,
    testName,
    subject,
  });
});

// Language Translation

// router.post("/translate/question/:questionId", (res, req) => {});

router.post("/translate/question", Translation.translate);

router.get("/exam/result/:testId", Exam.result);

router.get("/export/:testId", Exam.exportFile);

router.post("/export-users", File.exportFile);


// router.get("/exam/writen-test/:testId", Exam.viewStudentPerWrittenExam);
router.get(
  "/writen-test/view/:testId",
  isUserLoggedIn,
  Exam.viewStudentPerWrittenExam
);

module.exports = router;
