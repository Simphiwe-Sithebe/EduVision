document.getElementById('register-form').addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const form = document.getElementById('register-form');
    const formData = new FormData(form);

    const jsonFormData = {};
    formData.forEach((value, key) => {
        jsonFormData[key] = value;
    });

    const additionalData = {
        user_role: document.querySelector('#register-form select[name="user_role"]').value,
        course_id: document.querySelector('#register-form select[name="course_id"]').value
    };

    const postData = { ...jsonFormData, ...additionalData };


    
    fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle the response data
            console.log(data);
            alert('Registration successful!');
        })
        .catch(error => {
            // Handle errors
            document.querySelector('#server-error').textContent =
                'There was a problem with the register operation: try again';
        });
});

function validateForm() {
    const first_name = document.querySelector('#register-form input[name="first_name"]').value;
    const last_name = document.querySelector('#register-form input[name="last_name"]').value;
    const rsaId = document.querySelector('#register-form input[name="rsa_id"]').value;
    const email = document.querySelector('#register-form input[name="email"]').value;
    const password = document.querySelector('#register-form input[name="password_hash"]').value;
    const confirmPassword = document.querySelector('#register-form input[name="userrepass"]').value;
    const user_role = document.querySelector('#register-form select[name="user_role"]').value;
    const course_id = document.querySelector('#register-form select[name="course_id"]').value;

    document.querySelectorAll('.oq-error').forEach(errorSpan => {
        errorSpan.textContent = '';
    });

    let isValid = true;

    if (!first_name.match(/^[a-zA-Z\s]+$/)) {
        document.querySelector('#nameerror').textContent = 'Invalid name (only letters and spaces allowed)';
        isValid = false;
    }

    if (!last_name.match(/^[a-zA-Z\s]+$/)) {
        document.querySelector('#adderror').textContent = 'Invalid surname (only letters and spaces allowed)';
        isValid = false;
    }

    if (!rsaId.match(/^\d{13}$/)) {
        document.querySelector('#cityerror').textContent = 'Invalid ID Number (13 digits required)';
        isValid = false;
    }

     // Extract components from the ID number
    const year = parseInt(rsaId.substring(0, 2), 10);
    const month = parseInt(rsaId.substring(2, 4), 10);
    const day = parseInt(rsaId.substring(4, 6), 10);
    const genderCode = parseInt(rsaId.substring(6, 10), 10);
    const citizenCode = parseInt(rsaId.substring(10, 11), 10);
    const checksum = parseInt(rsaId.substring(12), 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        document.querySelector('#cityerror').textContent = "Invalid date format in ID number. Please check month and day.";
        isValid = false;
    }

    const currentYear = new Date().getFullYear();
    const validYear = (year < 100) ? (year + 2000) : (year + 1900);
    if (validYear > currentYear) {
        document.querySelector('#cityerror').textContent = "Invalid birth year in ID number. Year cannot be in the future.";
        isValid = false;
    }

    // Validate gender code
    if (genderCode < 0 || genderCode > 9999) {
        document.querySelector('#cityerror').textContent = "Invalid gender code in ID number.";
        isValid = false;
    } else if (genderCode < 5000) {
        // Female - check if day is between 01 and 31
        if (day > 31) {
            document.querySelector('#cityerror').textContent = "Invalid day for female in ID number. Day should be between 01 and 31.";
            isValid = false;
        }
    } else {
        // Male - check if day is between 01 and 30
        if (day > 30) {
            document.querySelector('#cityerror').textContent = "Invalid day for male in ID number. Day should be between 01 and 30.";
            isValid = false;
        }
    }

    // Validate citizen code (0 - SA citizen, 1 - Permanent resident)
    if (citizenCode !== 0 && citizenCode !== 1) {
        document.querySelector('#cityerror').textContent = "Invalid citizen code in ID number. Must be 0 or 1.";
        isValid = false;
    }

        // Luhn Algorithm for checksum validation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(idNumber.charAt(i), 10);
        if ((i % 2) === 0) {
        sum += digit * 2;
        } else {
        sum += digit;
        }
    }

    const checkDigit = (10 - (sum % 10)) % 10;

    if (checkDigit !== checksum) {
        document.querySelector('#cityerror').textContent = "Invalid checksum digit in ID number.";
        isValid = false;
    }



    if (!email.match(/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/)) {
        document.querySelector('#phoneerror').textContent = 'Invalid email address';
        isValid = false;
    }

    if (password.length < 6) {
        document.querySelector('#passerror').textContent = 'Password must be at least 6 characters long';
        isValid = false;
    }

    if (password !== confirmPassword) {
        document.querySelector('#repasserror').textContent = 'Passwords do not match';
        isValid = false;
    }

    if (user_role === '') {
        alert('Please select a role');
        isValid = false;
    }

    if (course_id === '') {
        alert('Please select a course');
        isValid = false;
    }

    return isValid;
}
