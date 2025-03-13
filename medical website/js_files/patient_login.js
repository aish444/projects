let db; // Declare the IndexedDB database connection

// Open IndexedDB connection for CareWellClinicDB, version 1
const request = indexedDB.open('CareWellClinicDB', 1);

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("IndexedDB connection successful.");
};

request.onerror = function () {
    console.error("Failed to open IndexedDB connection.");
};

// Function to check patient login credentials with password decryption
function checkPatientCredentials(inputEmail, inputPassword) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized");
            return;
        }

        const transaction = db.transaction("patients", "readonly");
        const objectStore = transaction.objectStore("patients");
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
            const patients = event.target.result;
            let validPatient = null;

            for (const patient of patients) {
                const storedEmail = decryptpatient_info(patient.email);       // Decrypt stored email
                const storedPassword = decryptpatient_info(patient.password); // Decrypt stored password

                // Compare decrypted email and password with input
                if (storedEmail === inputEmail && storedPassword === inputPassword) {
                    validPatient = patient;
                    break;
                }
            }

            if (validPatient) {
                resolve(validPatient);
            } else {
                resolve(null);
            }
        };

        request.onerror = function () {
            reject("Error accessing IndexedDB");
        };
    });
}

// Handle patient login form submission
document.getElementById("patient-login-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("patient-email").value.trim();
    const password = document.getElementById("patient-password").value.trim();

    checkPatientCredentials(email, password).then(patient => {
        if (patient) {
            // Save patient details to localStorage for use on the dashboard
            localStorage.setItem("loggedInPatientId", patient.id);
            localStorage.setItem("loggedInPatientFirstName", patient.firstname);
            localStorage.setItem("loggedInPatientLastName", patient.lastname);
            localStorage.setItem('userRole', 'patient');

            alert("Login successful! Redirecting...");
            setTimeout(() => {
                window.location.href = "patient_dashboard.html"; // Redirect to patient dashboard
            }, 2000);
        } else {
            alert("Invalid email or password!");
        }
    }).catch(error => {
        console.error("Error during patient login:", error);
        alert("An error occurred. Please try again.");
    });
});

// Encrypt and store the patient's data in the database (example function for adding patients)
function addPatient(email, password, firstname, lastname) {
    if (!db) {
        console.error("Database not initialized");
        return;
    }

    const transaction = db.transaction(["patients"], "readwrite");
    const objectStore = transaction.objectStore("patients");

    // Encrypt email and password before storing
    const encryptedEmail = encryptpatient_info(email);
    const encryptedPassword = encryptpatient_info(password);

    objectStore.put({
        email: encryptedEmail,             // Store encrypted email
        password: encryptedPassword,       // Store encrypted password
        firstname: firstname,
        lastname: lastname
    });

    transaction.oncomplete = () => {
        console.log("Patient added successfully with encrypted email and password.");
    };

    transaction.onerror = (event) => {
        console.error("Error adding patient:", event.target.error);
    };
}
