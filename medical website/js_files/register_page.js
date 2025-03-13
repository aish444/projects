var db; // Global database variable

var myText1 = "Hello, I’m Joe! I’m here to help you with the registration form. Please share your title, first name, last name, gender, and date of birth with me.";
var i = 0;

var layer1 = document.getElementById('layer1'),
    layer2 = document.getElementById('layer2'),
    layer3 = document.getElementById('layer3'),
    layer4 = document.getElementById('layer4'),
    btn1Container = document.getElementById('btn1-container'),
    btn2Container = document.getElementById('btn2-container'),
    btn3Container = document.getElementById('btn3-container'),
    btn4Container = document.getElementById('btn4-container');
    videoElement = document.getElementById('welcomeVideo'),
    dobInput = document.getElementById('dob');

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    // Display the greeting message when the page is first loaded
    var typeWriter = setInterval(function() {
        document.getElementById('text').textContent += myText1[i];
        i++;
        if (i > myText1.length - 1) {
            clearInterval(typeWriter);
        }
    }, 50);

    // Restrict inputs to letters only for First Name and Last Name
    document.getElementById('fName').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z ]/g, '');
    });

    document.getElementById('lName').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z ]/g, '');
    });

    // Restrict input to numbers only for NHS
    document.getElementById('nhs').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Restrict input to numbers, spaces, and '+' for Telephone
    document.getElementById('telephone').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9+ ]/g, '');
    });

     // Restrict input to numbers only for Height and Weight
     document.getElementById('height').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    document.getElementById('weight').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Set the max date for DOB to today
    const today = new Date().toISOString().split('T')[0];
    dobInput.setAttribute('max', today);
});

// Function to open or initialize the existing CareWellClinicDB
async function initializeRegistrationDatabase() { 
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CareWellClinicDB', 1); // Increment version to force onupgradeneeded

        request.onupgradeneeded = function (event) {
            db = event.target.result;

            if (!db.objectStoreNames.contains('patients')) {
                const objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('NHS', 'NHS', { unique: true });
                objectStore.createIndex('Name', ['First', 'Last'], { unique: true }); // Composite index for First and Last name
                console.log("Object store 'patients' created with indexes 'NHS' and 'Name'.");
            } else {
                // Check if indexes already exist, recreate if necessary
                const objectStore = event.target.transaction.objectStore('patients');
                if (!objectStore.indexNames.contains('NHS')) {
                    objectStore.createIndex('NHS', 'NHS', { unique: true });
                    console.log("Index 'NHS' created.");
                }
                if (!objectStore.indexNames.contains('Name')) {
                    objectStore.createIndex('Name', ['First', 'Last'], { unique: true });
                    console.log("Index 'Name' created.");
                }
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log('Connected to CareWellClinicDB successfully.');
            resolve(db);
        };

        request.onerror = function (event) {
            console.error('Database error:', event.target.errorCode);
            reject('Database error: ' + event.target.errorCode);
        };
    });
}


// Function to check for duplicate names by comparing firstname and lastname individually, case-insensitively
async function checkDuplicateName(fName, lName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("patients", "readonly");
        const objectStore = transaction.objectStore("patients");

        // Convert input names to lowercase for case-insensitive comparison
        const firstNameLower = fName.toLowerCase();
        const lastNameLower = lName.toLowerCase();

        // Use a cursor to iterate through records and check firstname and lastname
        const request = objectStore.openCursor();
        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;
                
                // Convert record names to lowercase for case-insensitive comparison
                if (
                    record.firstname.toLowerCase() === firstNameLower &&
                    record.lastname.toLowerCase() === lastNameLower
                ) {
                    resolve(true); // Duplicate found
                    return;
                }
                cursor.continue(); // Continue to next record
            } else {
                resolve(false); // No duplicate found after iterating all records
            }
        };

        request.onerror = function() {
            console.error("Error checking for duplicates.");
            reject();
        };
    });
}


// Function to check for duplicate NHS
async function checkDuplicateNHS(nhs) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("patients", "readonly");
        const objectStore = transaction.objectStore("patients");
        
        const request = objectStore.openCursor();
        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;
                if (record.nhs === nhs) {
                    // Duplicate found
                    displayErrorInText('A patient with this NHS number already exists. Please use a unique NHS number.');
                    playErrorVideo();
                    resolve(true);
                    return;
                }
                cursor.continue(); // Continue to next record
            } else {
                resolve(false); // No duplicate found
            }
        };

        request.onerror = function() {
            console.error("Error checking for NHS duplicates.");
            reject();
        };
    });
}

function playErrorVideo() {
    videoElement.src = "/assets/videos/doctor_error.mp4";
    videoElement.play();
}

function playFinishVideo() {
    videoElement.src = "/assets/videos/doctor_good.mp4";
    videoElement.play();
}

function displayErrorInText(message) {
    document.getElementById('text').textContent = message;
    playErrorVideo();
}

function clearErrors() {
    var errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(function(error) {
        error.style.display = 'none';
    });
}

function validateFields(fields) {
    clearErrors();
    let isValid = true;

    fields.forEach(function(field) {
        const input = document.getElementById(field);

        if (field === 'nhs' && !/^\d{10}$/.test(input.value)) {
            displayErrorInText("NHS number must be 10 digits.");
            isValid = false;
        } else if (input.value.trim() === "" || (input.tagName === "SELECT" && input.selectedIndex === 0)) {
            displayErrorInText("Please fill in all the fields.");
            isValid = false;
        }
    });

    console.log("Validation result:", isValid); // Log final validation result
    return isValid;
}


async function to2() {
    'use strict';
    console.log("to2 function called"); // Log to check if the function is called

    const fName = document.getElementById('fName').value.trim();
    const lName = document.getElementById('lName').value.trim();

    // Validate required fields
    if (validateFields(['title', 'fName', 'lName', 'gender', 'dob'])) {
        console.log("Fields validated successfully"); // Log for successful validation

        try {
            const isDuplicateName = await checkDuplicateName(fName, lName);
            console.log("Duplicate name check result:", isDuplicateName); // Log result of duplicate check

            if (isDuplicateName) {
                displayErrorInText('A patient with this name already exists. Please use a unique name.');
                return;
            }

            // If no duplicate, proceed to next layer
            videoElement.src = "/assets/videos/doctor_takingnotes.mp4"; 
            var myText2 = 'Thank you, ' + fName + ". Please enter your NHS number.";

            layer1.style.display = "none";
            layer2.style.display = "block";
            btn1Container.style.display = "none";
            btn2Container.style.display = "flex";
            document.getElementById('text').textContent = "";
            var e = 0;

            var typeWriter2 = setInterval(function() {
                document.getElementById('text').textContent += myText2[e];
                e++;
                if (e > myText2.length - 1) {
                    clearInterval(typeWriter2);
                }
            }, 50);

        } catch (error) {
            console.error("Error during duplicate name check:", error); // Log any errors during duplicate check
            displayErrorInText("An error occurred. Please try again.");
        }
    } else {
        console.log("Validation failed. Required fields are missing."); // Log if validation fails
    }
}



async function to3() {
    'use strict';
    const nhs = document.getElementById('nhs').value.trim();

    if (validateFields(['nhs'])) {
        try {
            const isDuplicateNHS = await checkDuplicateNHS(nhs);
            if (isDuplicateNHS) {
                // Duplicate found; error message and video handled in checkDuplicateNHS
                return;
            }

            videoElement.src = "/assets/videos/doctor_takingnotes.mp4"; 
            var myText3 = 'Got it. Now, please provide your address, email, and telephone number.';
            
            layer2.style.display = "none";
            layer3.style.display = "block";
            btn2Container.style.display = "none";
            btn3Container.style.display = "flex";

            document.getElementById('text').textContent = "";
            var x = 0;
            var typeWriter3 = setInterval(function() {
                document.getElementById('text').textContent += myText3[x];
                x++;
                if (x > myText3.length - 1) {
                    clearInterval(typeWriter3);
                }
            }, 50);

        } catch (error) {
            console.error("Error during duplicate NHS check:", error);
            displayErrorInText("An error occurred. Please try again.");
        }
    }
}

async function to4() {
    'use strict';
    if (validateFields(['address', 'email', 'telephone'])) {
        videoElement.src = "/assets/videos/doctor_takingnotes.mp4"; 
        videoElement.play();
        
        const myText4 = 'Almost done! Please enter your height, weight, blood type, and average heart rate. If you do not know blood type and average heart rate, please type "Not Set".';

        // Hide layer3, show layer4, and update button container visibility
        layer3.style.display = "none";
        layer4.style.display = "block";
        btn3Container.style.display = "none";
        btn4Container.style.display = "flex";

        // Clear previous text and typewriter intervals, if any
        clearInterval(window.typeWriterInterval);
        document.getElementById('text').textContent = "";

        // Start the typewriter effect for myText4
        let y = 0;
        window.typeWriterInterval = setInterval(function() {
            document.getElementById('text').textContent += myText4[y];
            y++;
            if (y > myText4.length - 1) {
                clearInterval(window.typeWriterInterval); // Stop the interval when done
            }
        }, 50);
    }
}


function to5() {
    'use strict';
    console.log("Executing to5 function...");
    
    if (validateFields(['height', 'weight', 'bloodType', 'averageHeartRate'])) {
        playFinishVideo(); // Play finish video

        // Collect user information for summary
        var title = document.getElementById('title').value;
        var fName = document.getElementById('fName').value;
        var lName = document.getElementById('lName').value;
        var gender = document.getElementById('gender').value;
        var dob = document.getElementById('dob').value;
        var nhs = document.getElementById('nhs').value;
        var address = document.getElementById('address').value;
        var email = document.getElementById('email').value;
        var telephone = document.getElementById('telephone').value;
        var height = document.getElementById('height').value || "Not Set";
        var weight = document.getElementById('weight').value || "Not Set";
        var bloodType = document.getElementById('bloodType').value || "Not Set";
        var heartRate = document.getElementById('averageHeartRate').value || "Not Set";

        console.log("User Info:", { title, fName, lName, gender, dob, nhs, address, email, telephone, height, weight, bloodType, heartRate });

        // Create summary content
        var summaryHTML = `
            <div class="summary-box">
                <h3>Registration Summary</h3>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>First Name:</strong> ${fName}</p>
                <p><strong>Last Name:</strong> ${lName}</p>
                <p><strong>Gender:</strong> ${gender}</p>
                <p><strong>Date of Birth:</strong> ${dob}</p>
                <p><strong>NHS Number:</strong> ${nhs}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telephone:</strong> ${telephone}</p>
                <p><strong>Height:</strong> ${height}</p>
                <p><strong>Weight:</strong> ${weight}</p>
                <p><strong>Blood Type:</strong> ${bloodType}</p>
                <p><strong>Average Heart Rate:</strong> ${heartRate}</p>
            </div>`;

        layer4.style.display = "none";
        btn4Container.style.display = "none";
        document.querySelector('.speaker').innerHTML = summaryHTML;
        document.querySelector('.speaker').style.display = "block";
        document.querySelector('.speaker').style.backgroundColor = "#ffffff"; 
        document.querySelector('.speaker').style.borderRadius = "15px"; 

        // Display final message with typewriter effect
        var confirmationMessage = "Thank you for registering. You can review your information below and log in. For your first login, use the password: '{firstname}2024!'";
        document.getElementById('text').textContent = ""; 
        var j = 0;
        var typeWriter4 = setInterval(function() {
            document.getElementById('text').textContent += confirmationMessage[j];
            j++;
            if (j > confirmationMessage.length - 1) {
                clearInterval(typeWriter4);
            }
        }, 50);

        // Add to database after the summary is displayed
        addPatientToDB({ title, fName, lName, gender, dob, nhs, address, email, telephone, height, weight, bloodType, heartRate });

        // Show the login button
        const loginButton = document.createElement('button');
        loginButton.textContent = "Login";
        loginButton.className = "btn";
        loginButton.onclick = function() {
            window.location.href = "/html_files/login_page.html"; 
        };
        btn1Container.innerHTML = "";
        btn1Container.style.display = "flex";
        btn1Container.appendChild(loginButton);

    } else {
        console.log("Validation failed. Please fill out all required fields.");
    }
}


async function addPatientToDB(patientData) { 
    try {
        const nextId = await getNextPatientId();

        // Encrypt specified sensitive patient data before storing
        const newPatient = {
            id: nextId,
            nhs: patientData.nhs,  // Not encrypted
            title: patientData.title,
            firstname: patientData.fName,
            lastname: patientData.lName,
            gender: patientData.gender,
            DOB: convertToDDMMYYYY(patientData.dob),
            address: encryptpatient_info(patientData.address),           // Encrypt address
            email: encryptpatient_info(patientData.email),               // Encrypt email
            telephone: encryptpatient_info(patientData.telephone),       // Encrypt telephone
            averageheartrate: encryptpatient_info(patientData.heartRate || "Not Set"), // Encrypt average heart rate
            bloodtype: patientData.bloodType || "Not Set",
            height: patientData.height || "Not Set",
            weight: patientData.weight || "Not Set",
            first_login: true,
            password: encryptpatient_info(`${patientData.fName}2024!`)   // Encrypt default password
        };

        const transaction = db.transaction("patients", "readwrite");
        const objectStore = transaction.objectStore("patients");

        const request = objectStore.add(newPatient);
        request.onsuccess = function () {
            console.log("New patient registered:", newPatient);
        };
        request.onerror = function (event) {
            console.error("Error adding patient to database:", event.target.error);
        };

    } catch (error) {
        console.error("Failed to add patient to DB:", error);
    }
}



// Get the next available ID from the patients object store in CareWellClinicDB
function getNextPatientId() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("patients", "readonly");
        const objectStore = transaction.objectStore("patients");
        const request = objectStore.openCursor(null, "prev");

        request.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                resolve(cursor.value.id + 1);
            } else {
                resolve(1);
            }
        };
        request.onerror = function () {
            reject("Failed to get next ID.");
        };
    });
}

function convertToDDMMYYYY(dateString) {
    // Create a Date object from the input string
    const date = new Date(dateString);

    // Format the day, month, and year to ensure they are two-digit numbers
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    // Return the formatted date as "dd/mm/yyyy"
    return `${day}/${month}/${year}`;
}

function backTo1() {
    'use strict';
    layer2.style.display = "none";
    layer1.style.display = "block"; // Show Layer 1
    btn2Container.style.display = "none";
    btn1Container.style.display = "flex"; // Show the buttons for Layer 1
}

function backTo2() {
    'use strict';
    layer3.style.display = "none";
    layer2.style.display = "block"; // Show Layer 2
    btn3Container.style.display = "none";
    btn2Container.style.display = "flex"; // Show the buttons for Layer 2
}

function backTo3() {
    'use strict';
    layer4.style.display = "none";
    layer3.style.display = "block"; // Show Layer 3
    btn4Container.style.display = "none";
    btn3Container.style.display = "flex"; // Show the buttons for Layer 3
}


// Other functions like to4, backTo1, backTo2, playErrorVideo, playFinishVideo, and validateFields remain unchanged.
// Don't forget to call openDatabase() when the page loads.
window.onload = async function () {
    try {
        await initializeRegistrationDatabase();
    } catch (error) {
        console.error('Failed to open the database:', error);
    }
};
