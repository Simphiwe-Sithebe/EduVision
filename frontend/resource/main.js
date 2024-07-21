let hasGreeted = false;
function greetUser() {
    if (!hasGreeted) {
        hasGreeted = true;
        var msg = new SpeechSynthesisUtterance();
        msg.text = "Hello, welcome to EduVision, a platform for visually impaired students through innovative AI technology. To login say , login. To create an account say , sign up ";
        window.speechSynthesis.speak(msg);
        recognition.start();
    }
}
let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;
recognition.onresult = function(event) {
    let last = event.results.length - 1;
    let command = event.results[last][0].transcript;
    document.querySelector('.out_text').textContent = 'Voice input: ' + command; // Display the user's response
    if(command.toLowerCase() === 'login') {
        window.location.href = '../login.html'; // Replace with your login page URL
    } else if(command.toLowerCase() === 'create account') {
        window.location.href = '/signup'; // Replace with your signup page URL
    }
};
recognition.onspeechend = function() {
    recognition.stop();
};