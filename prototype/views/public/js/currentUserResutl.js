
const savedResults = localStorage.getItem('evaluationCurrentResults');
let responsesData = '';

if (savedResults) {
    responsesData = JSON.parse(savedResults);
    console.log(responsesData);
} else {
    console.error("Evaluation results not found in local storage");
}

let correctCount = 0;
let wrongCount = 0;

let total = responsesData.length;
responsesData.forEach(result => {
    if (result.response === "Correct") {
        correctCount++;
    } else if (result.response === "Wrong") {
        wrongCount++;
    }
});

let percentage = Math.round((correctCount *100) / total)

if (percentage >= 50) {
    message = 'Congratulations! You passed the exam. ';
} else {
    message = 'Sorry, you did not pass the exam. ';
}
document.getElementById('correctCount').innerHTML = correctCount
document.getElementById('totalCount').innerHTML = total
document.getElementById('percentage').innerHTML = `${percentage}%`
document.getElementById('feedback').innerHTML = message

































