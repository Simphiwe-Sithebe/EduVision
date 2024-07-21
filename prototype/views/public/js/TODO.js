
const extractedQuestionsAnswers = extractQuestionsWithAnswersFromHTML();


const evaluationPromises = extractedQuestionsAnswers.map(question => {
    return fetch('/exam/evaluate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        return result; // Return the evaluation result
    })
    .catch(error => console.error('Error:', error));
});

Promise.all(evaluationPromises)
.then(() => {
    // Redirect to another URL after evaluation is complete
    window.location.href = '/another-url';
})
.catch(error => console.error('Error:', error));



// evaluationPromises is an array of promises, where each promise corresponds to the evaluation of a question.
// We use Promise.all() to wait for all evaluation promises to resolve.
// Once all evaluations are complete, we use window.location.href to redirect the user to another URL. Replace '/another-url' with the URL you want to redirect to.