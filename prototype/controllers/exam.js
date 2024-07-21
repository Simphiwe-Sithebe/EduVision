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

const Exam = {
  evaluate: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        let { question_id, test_id, question_text, answer } = req.body;
        let response = "Wrong";
        try {
          if (answer !== "" && answer != null) {
            response = await chatGPTResponse(question_text, answer);
          } else {
            answer = "No Answer";
          }
          await saveToDatabase(
            user.user_id,
            question_id,
            test_id,
            answer,
            response
          );

          console.log({
            question_id,
            test_id,
            question_text,
            answer,
            response,
          });
          res.json({ question_id, test_id, question_text, answer, response });
        } catch (error) {
          console.error("Error evaluating answer:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    )(req, res, next);
  },
  result: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        const { testId } = req.params;

        let tests = await selectWithConditionIgnoreCase(
          "tests",
          { test_id: testId },
          1
        );

        let questions = await selectWithConditionIgnoreCase(
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
          let answers = await selectWithConditionIgnoreCase(
            "answer",
            {
              test_id: testId,
              question_id: question.question_id,
              student_id: user.user_id,
            },
            1
          );

          let marks = 0;
          for (let j = 0; j < answers.length; j++) {
            if (answers[j].outcome === "Correct") {
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
            answer: answers[0], // Array of answers for the current question
          });
        }

        let totalMarks = 0;
        for (let index = 0; index < questionsWithAnswers.length; index++) {
          totalMarks += questionsWithAnswers[index].marks;
        }

        console.log("questions", questions);
        console.log("questionsWithAnswers", questionsWithAnswers);

        let percentage = Math.round(
          (totalMarks * 100) / questionsWithAnswers.length
        );

        console.log(" totalMarks : ", percentage, "%");

        return res.render("student/report", {
          testName: tests[0].test_name,
          user: user,
          questions: questionsWithAnswers,
          test: tests[0],
          totalMarks: percentage,
        });
      }
    )(req, res, next);
  },

  // exportFile : async (req, res, next) => {
  //   passport.authenticate(
  //     "jwt",
  //     { session: false },
  //     async (err, user, info) => {

  //       const {testId} = req.params;

  //       let tests = await selectWithConditionIgnoreCase(
  //         "tests",
  //         { test_id: testId },
  //         1
  //       );

  //       let questions = await selectWithConditionIgnoreCase(
  //         "questions",
  //         { test_id: testId },
  //         1
  //       );

  //       // Initialize an array to store questions with answers
  //       let questionsWithAnswers = [];

  //       // Iterate over each question to fetch its answers
  //       for (let i = 0; i < questions.length; i++) {
  //         let question = questions[i];
  //         // Fetch answers for the current question
  //         let answers = await selectWithConditionIgnoreCase(
  //           "answer",
  //           { test_id: testId, question_id: question.question_id , student_id: user.user_id },
  //           1
  //         );

  //         let marks = 0;
  //         for (let j = 0; j < answers.length; j++) {
  //           if (answers[j].outcome === 'Correct') {
  //             marks++;
  //           }
  //           // You may assign different marks for correct vs incorrect answers as needed
  //         }
  //         // Add question details along with answers to the result array
  //         questionsWithAnswers.push({
  //           question_id: question.question_id,
  //           question_text: question.question_text,
  //           test_id: question.test_id,
  //           marks: marks,
  //           answer: answers[0] // Array of answers for the current question
  //         });
  //       }

  //       let totalMarks = 0;
  //       for (let index = 0; index < questionsWithAnswers.length; index++) {
  //           totalMarks += questionsWithAnswers[index].marks;
  //       }

  //       console.log("questions", questions);
  //       console.log("questionsWithAnswers", questionsWithAnswers);

  //       let percentage = Math.round((totalMarks *100) / questionsWithAnswers.length);

  //       console.log(" totalMarks : " , percentage , "%");

  //       return res.render("student/report", {
  //         testName: tests[0].test_name,
  //         user: user,
  //         questions: questionsWithAnswers,
  //         test: tests[0],
  //         totalMarks: percentage
  //       });

  //   }
  //   )(req, res, next);
  // },

  viewStudentPerWrittenExam: async (req, res, next) => {
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
          const { testId } = req.params;

          let answers = await selectWithCondition(
            "answer",
            { test_id: testId },
            1
          );

          let tests = await selectWithCondition(
            "tests",
            { test_id: testId },
            1
          );

          let modules = await selectWithCondition(
            "modules",
            { module_id: tests[0].module_id },
            1
          );

          const studentIdsSet = new Set(
            answers.map((answer) => answer.student_id)
          );
          const studentIds = Array.from(studentIdsSet);

          let userData = [];
          for (const studentId of studentIdsSet) {
            let answers = await selectWithCondition(
              "answer",
              { student_id: studentId },
              1
            );
            let correctCount = 0;

            let total = answers.length;

            console.log("answers.submitted_at ", answers[0]);

            answers.forEach((result) => {
              if (result.outcome === "Correct") {
                correctCount++;
              }
            });

            let percentage = Math.round((correctCount * 100) / total);
            const users = await selectWithConditionIgnoreCase(
              "users",
              { user_id: studentId },
              1
            );
            const userDataWithPercentage = {
              ...users[0],
              percentage: percentage,
              date: formartDate(answers[0].submitted_at),
            };

            userData.push(userDataWithPercentage);
          }

          // console.log(answers);
          console.log("Data Check Date ", userData);

          return res.render("student/outcome", {
            user: user,
            users: userData,
            testName: tests[0].test_name,
            testId: tests[0].test_id,
            moduleName: modules[0].module_name,
            moduleId: modules[0].module_id,
          });
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },

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
        if (user.user_role === ROLES.Lecturer) {
          const { testId } = req.params;

          let answers = await selectWithCondition(
            "answer",
            { test_id: testId },
            1
          );

          let tests = await selectWithCondition(
            "tests",
            { test_id: testId },
            1
          );

          let modules = await selectWithCondition(
            "modules",
            { module_id: tests[0].module_id },
            1
          );

          const studentIdsSet = new Set(
            answers.map((answer) => answer.student_id)
          );
          const studentIds = Array.from(studentIdsSet);

          let userData = [];
          for (const studentId of studentIdsSet) {
            let answers = await selectWithCondition(
              "answer",
              { student_id: studentId },
              1
            );
            let correctCount = 0;

            let total = answers.length;

            console.log("answers.submitted_at ", answers[0]);

            answers.forEach((result) => {
              if (result.outcome === "Correct") {
                correctCount++;
              }
            });

            let percentage = Math.round((correctCount * 100) / total);
            const users = await selectWithConditionIgnoreCase(
              "users",
              { user_id: studentId },
              1
            );
            const userDataWithPercentage = {
              ...users[0],
              percentage: percentage,
              date: formartDate(answers[0].submitted_at),
            };

            userData.push(userDataWithPercentage);
          }

          console.log(userData);

          let sampleData = [];

          userData.forEach((userD) => {
            let status = "Fail";

            if (userD.percentage >= 50) {
              status = "Pass";
            }

            if (userD.percentage >= 75) {
              status = "Pass With Distinction";
            }

            const currentUserData = {
              'StudentNo': userD.identification_number,
            'FirstName' : userD.first_name,
            'LastName' :  userD.last_name,
            'ModuleName' : modules[0].module_name,
            'ModuleCode' :  modules[0].module_code,
            'TestName' : tests[0].test_name,
            'Marks' : userD.percentage,
            'status' : status,
            'Date' :  userD.date,
            }

            sampleData.push(currentUserData);
          });

          // const dataJsonFormat = JSON.parse(JSON.stringify(sampleData));

          // To CSV

          let fileHeader = [
            'Student No',
            'FirstName',
            'LastName',
            'Module Name',
            'Module Code',
            'Test Name',
            'Marks',
            'status',
            'Date',
          ];

          let workbook = new exceljs.Workbook()

          const sheet = workbook.addWorksheet("report")
          sheet.columns = [
            {header: "Student No", key:"StudentNo" , width: 25},
            {header: "Name", key:"FirstName" , width: 25},
            {header: "Surname", key:"LastName" , width: 25},
            {header: "Module Name", key:"ModuleName" , width: 25},
            {header: "Module Code", key:"ModuleCode" , width: 25},
            {header: "Test Name", key:"TestName" , width: 25},
            {header: "Marks", key:"Marks" , width: 25},
            {header: "status", key:"status" , width: 25},
            {header: "Date", key:"Date" , width: 25},
          ]

          await sampleData.map((value, index) =>{
            sheet.addRow(value)
          })



          // let json_data = new data_exporter({ fileHeader });
          // let csv_data = json_data.parse(sampleData);

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

  viewStudentPerWrittenExamTest: async (req, res, next) => {
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
          const { testId } = req.params;

          try {
            // Get answers for the given test ID
            let answers = await selectWithCondition(
              "answer",
              { test_id: testId },
              1
            );

            let userData = [];
            // Group answers by student ID
            const answersByStudentId = answers.reduce((acc, answer) => {
              acc[answer.student_id] = acc[answer.student_id] || [];
              acc[answer.student_id].push(answer);
              return acc;
            }, {});

            // Calculate percentage for each student
            for (const studentId in answersByStudentId) {
              const studentAnswers = answersByStudentId[studentId];
              let correctCount = studentAnswers.reduce((count, answer) => {
                if (answer.response === "Correct") {
                  count++;
                }
                return count;
              }, 0);
              let total = studentAnswers.length;
              let percentage = Math.round((correctCount * 100) / total);

              // Get user data for the student ID
              const users = await selectWithConditionIgnoreCase(
                "users",
                { user_id: studentId },
                1
              );

              // Add percentage to user data
              if (users.length > 0) {
                const userDataWithPercentage = {
                  ...users[0],
                  percentage: percentage,
                };
                userData.push(userDataWithPercentage);
              }
            }

            console.log(userData);

            return res.render("student/outcome", {
              userData: userData,
              errors: [],
            });
          } catch (error) {
            console.error("Error:", error.message);
            return res.status(500).render("error/server");
          }
        } else {
          res.redirect("/");
        }
      }
    )(req, res, next);
  },
};

async function chatGPTResponse(question, userAnswer) {
  try {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Here is the question and answer. only respond with correct or wrong. 
                                            Question : ${question}. Answer : ${userAnswer}`,
          },
        ],
        max_tokens: 100,
      }),
    };
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    const data = await response.json();
    console.log(data.choices[0].message);
    return data.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
}
async function saveToDatabase(user_id, question_id, test_id, answer, response) {
  try {
    const UserResponse = {
      test_id: test_id,
      student_id: user_id,
      question_id: question_id,
      answer_text: answer,
      outcome: response,
    };
    await createData("answer", UserResponse);
  } catch (error) {
    console.log(error);
  }
}

function formartDate(submittedAt) {
  const dateObject = new Date(submittedAt);

  // Extract date components
  const year = dateObject.getFullYear();
  const month = ("0" + (dateObject.getMonth() + 1)).slice(-2); // Months are zero based, so we add 1
  const day = ("0" + dateObject.getDate()).slice(-2); // Get the day and pad with leading zero if necessary
  const hours = ("0" + dateObject.getHours()).slice(-2); // Get the hours and pad with leading zero if necessary
  const minutes = "00"; // Always set minutes to '00' as per your requirement

  // Formatted date string in YYYY-MM-DD 00H00 format

  return `${year}-${month}-${day} ${hours}H${minutes}`;
}

module.exports = Exam;
