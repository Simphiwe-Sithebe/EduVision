const passport = require("passport");
const { ROLES } = require("../constants/");
const {
  createData,
  selectWithCondition,
  selectWithConditionIgnoreCase,
} = require("../config/dbFunctions");
const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];
const LANGUAGE = process.env["TRANSLATE_TO"];

const Translation = {
  translate: async (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        let { question_id, question_text } = req.body;
        try {
          const response = await chatGPTResponse(question_text);

          res.json({ question_id, question_text, response });
        } catch (error) {
          console.error("Error translating the sentence ", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    )(req, res, next);
  },
};

async function chatGPTResponse(question) {
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
            content: `Translate this Sentence "${question}" in ${LANGUAGE} and only return translated sentence`,
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

// async function saveToDatabase(user_id, question_id, test_id, answer, response) {
//   try {
//     const UserResponse = {
//       test_id: test_id,
//       student_id: user_id,
//       question_id: question_id,
//       answer_text: answer,
//       outcome: response,
//     };
//     await createData("answer", UserResponse);
//   } catch (error) {
//     console.log(error);
//   }
// }

module.exports = Translation;
