const questionForm = document.getElementById("create-question-form");

document
  .getElementById("create-question-btn")
  .addEventListener("click", handleAddQuestion);

function enableBtn() {
  const createBtn = document.getElementById("create-question-btn");
  createBtn.disabled = false;
  createBtn.value = "Create";
}

function errorMessage(message) {
  document.getElementById("question-create-error").textContent = `${message}`;
  enableBtn();
}

async function handleAddQuestion(e) {
  e.preventDefault();
  const form = document.querySelector("#create-question-form");
  const formData = new FormData(form);
  const jsonFormData = {};
  let testNameEmpty = true;

  formData.forEach((value, key) => {
    console.log(value.trim());
    if (key === "question_text") {
      if (value.trim().length <= 9 || value.trim() == "") {
        errorMessage("Please enter valid question with at least 10 characters");
        testNameEmpty = true;
      } else {
        testNameEmpty = false;
      }
    }
    jsonFormData[key] = value.trim();
  });

  if (testNameEmpty) {
    return; // Prevent form submission if test name is empty
  }

  const status = validateInput(
    jsonFormData.question_text,
    jsonFormData.test_id
  );
  console.log(jsonFormData);
  const url = "/question/create";
  if (status) {
    const createBtn = document.getElementById("create-question-btn");
    createBtn.disabled = true;
    createBtn.value = "Create Question...";
    const queryParams = new URLSearchParams(window.location.search);
    const currentQuestionId = queryParams.get("test");
    const currentURL = `/question/view?test=${currentQuestionId}`;

    await sendHttpRequest(url, jsonFormData, currentURL);
  } else {
    console.log("Fill input");
  }
}

async function sendHttpRequest(URL, data, redirect_url = "") {
  try {
    const res = await fetch(URL, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.status) {
      console.log(result);
    }
    enableBtn();
    window.location.href = redirect_url;
  } catch (error) {
    enableBtn();
    console.log(error);
  }
}

function validateInput(...inputFields) {
  for (const field of inputFields) {
    if (!field) {
      displayErrorMessage("All fields are required");
      return false;
    }
  }
  return true;
}

function displayErrorMessage(message) {
  errorMessage.style.display = "block";
  errorMessage.textContent = message;
}

function hideErrorMessage() {
  errorMessage.style.display = "none";
}

function updateUI(isLoading = true) {
  const submitBtn = document.getElementById("submitCategoryBtn");
  if (isLoading) {
    submitBtn.innerHTML =
      'Loading <i class="fa fa-circle-o-notch fa-spin"></i>';
    submitBtn.classList.add("loading");
  } else {
    submitBtn.innerHTML = 'New Category Added <i class="fa fa-check"></i>';
    setTimeout(() => {
      submitBtn.innerHTML = "Submit";
      submitBtn.classList.remove("loading");
    }, 2000);
  }
}
