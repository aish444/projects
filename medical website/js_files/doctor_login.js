// Encrypt password before storing a new doctor
function addDoctor(email, password, firstname, lastname) {
    initDoctorIndexedDB().then(db => {
        const transaction = db.transaction(['doctors'], 'readwrite');
        const doctorStore = transaction.objectStore('doctors');

        // Encrypt the password before storing
        const encryptedPassword = encryptDoctorData(password);
        console.log("Storing encrypted password:", encryptedPassword); // Debugging line

        doctorStore.put({
            email: email, // Store email in plain text
            password: encryptedPassword, // Store encrypted password
            firstname: firstname,
            lastname: lastname
        });
    }).catch(error => {
        console.error("Error adding doctor:", error);
    });
}

// Initialize IndexedDB for doctors from CareWellClinicDB
function initDoctorIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CareWellClinicDB', 1); // Updated database name and version

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            console.error("Error opening IndexedDB for doctors:", event);
            reject("Error opening IndexedDB");
        };
    });
}

// Function to check doctor login credentials with password decryption
function checkDoctorCredentials(inputEmail, inputPassword) {
    return new Promise((resolve, reject) => {
        initDoctorIndexedDB().then(db => {
            const transaction = db.transaction("doctors", "readonly");
            const objectStore = transaction.objectStore("doctors");
            const request = objectStore.getAll();

            request.onsuccess = function (event) {
                const doctors = event.target.result;

                // Find the doctor with matching email and decrypted password
                const validDoctor = doctors.find(doctor => {
                    const decryptedEmail = decryptDoctorData(doctor.email); // Decrypt stored email
                    const decryptedPassword = decryptDoctorData(doctor.password); // Decrypt stored password
                    
                    const inputEmailTrimmed = inputEmail.trim().toLowerCase();
                    const storedEmailTrimmed = decryptedEmail.trim().toLowerCase();

                    console.log("Decrypted Email from DB:", decryptedEmail); // Debugging line
                    console.log("Input Email:", inputEmailTrimmed); // Debugging line
                    console.log("Decrypted Password from DB:", decryptedPassword); // Debugging line
                    console.log("Input Password:", inputPassword); // Debugging line

                    // Compare emails and decrypted password
                    return storedEmailTrimmed === inputEmailTrimmed && decryptedPassword === inputPassword;
                });

                console.log("Valid Doctor Found:", validDoctor); // Debugging line
                resolve(validDoctor || null); // Resolve with doctor if found, otherwise null
            };

            request.onerror = function () {
                reject("Error accessing IndexedDB");
            };
        }).catch(error => {
            console.error("Error initializing IndexedDB:", error);
            reject(error);
        });
    });
}

// Handle doctor login form submission
document.getElementById("doctor-login-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("doctor-email").value.trim();
    const password = document.getElementById("doctor-password").value.trim();

    checkDoctorCredentials(email, password).then(doctor => {
        if (doctor) {
            localStorage.setItem("loggedInDoctorId", doctor.id); // Save doctor ID
            localStorage.setItem("loggedInDoctorFirstName", doctor.firstname); // Use `first_name` field
            localStorage.setItem("loggedInDoctorLastName", doctor.lastname); // Use `last_name` field
            localStorage.setItem('userRole', 'doctor');
        
            alert("Login successful! Redirecting...");
            setTimeout(() => {
                window.location.href = "doctor_dashboard.html"; // Redirect to doctor dashboard
            }, 2000);
        } else {
            alert("Invalid email or password!");
        }
    }).catch(error => {
        console.error("Error during doctor login:", error);
        alert("An error occurred. Please try again.");
    });
});

// Display doctor's name in the header on the doctor dashboard
document.addEventListener("DOMContentLoaded", () => {
    // Retrieve doctor's first and last name from localStorage
    const firstName = localStorage.getItem("loggedInDoctorFirstName");
    const lastName = localStorage.getItem("loggedInDoctorLastName");

    // Get the welcome message element
    const welcomeElement = document.getElementById("doctor-welcome");

    // Check if both names and the welcome element are available (for dashboard page)
    if (firstName && lastName && welcomeElement) {
        // Update the welcome message
        welcomeElement.textContent = `Welcome Dr. ${firstName} ${lastName}`;
    } else if (!welcomeElement) {
        console.log("This is not the dashboard page or 'doctor-welcome' element not found.");
    }

    // Log out functionality
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            // Clear stored data on logout
            localStorage.removeItem("loggedInDoctorId");
            localStorage.removeItem("loggedInDoctorFirstName");
            localStorage.removeItem("loggedInDoctorLastName");
            localStorage.removeItem("userRole");

            // Redirect to login page
            window.location.href = "login.html";
        });
    } else {
        console.log("This is not the dashboard page or 'logout-button' not found.");
    }
});
