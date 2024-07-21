document.addEventListener("DOMContentLoaded", (event) => {
  const translateButtons = document.querySelectorAll(".translate-button");
  translateButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation(); // Prevent any parent event handlers from being triggered
      const questionId = button.getAttribute("data-question-id");
      const questionText = button.getAttribute("data-question-text");
      const translatedQuestionElement = document.getElementById(
        `translated-${questionId}`
      );
      if (translatedQuestionElement) {
        button.disabled = true;

        try {
          const translatedText = await translateQuestion(
            questionId,
            questionText
          );
          console.log("translatedText : ", translatedText);
          translatedQuestionElement.innerText = `Translated Question: ${translatedText.response}`;
          translatedQuestionElement.style.display = "block";
        } catch (error) {
          console.error("Error:", error);
          // Handle error as needed
        } finally {
          button.disabled = false;
        }
      }
    });
  });


  const textareas = document.querySelectorAll(".user_response");
  textareas.forEach((textarea) => {
    textarea.addEventListener("input", (event) => {
      const translateAnswerButton = textarea.nextElementSibling;
      const translated = translateAnswerButton.nextElementSibling;
      if (textarea.value.trim()) {
        translateAnswerButton.style.display = "inline-block";
      } else {
        translateAnswerButton.style.display = "none";
        translated.style.display = "none";
      }
    });
  });

  const translateAnswerButtons = document.querySelectorAll(".translate-answer-button");
  translateAnswerButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation(); 
      const responseId = button.getAttribute("data-response-id");
      const questionId = responseId.split('-')[1];
      const responseElement = document.getElementById(`response-${questionId}`);
       

      const answerText = responseElement.value;

      const translatedAnswerElement = document.getElementById(
        `translated-answer-${responseId.split('-')[1]}`
      );

      if (translatedAnswerElement) {
        button.disabled = true;

        try {
          const translatedText = await translateQuestion(questionId, answerText);
          console.log("translatedText : ", translatedText);
          translatedAnswerElement.innerText = `Translated Answer: ${translatedText.response}`;
          translatedAnswerElement.style.display = "block";
        } catch (error) {
          console.error("Error:", error);
          // Handle error as needed
        } finally {
          button.disabled = false;
        }
      }
    });
  });




  async function translateQuestion(questionId, questionText) {
    const data = {
      question_id: questionId,
      question_text: questionText,
    };
    try {
      const response = await fetch("/translate/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log(result);
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
});
