let db; // Global database variable

// Initialize the database and display patients on page load
window.onload = async function () {
    try {
        await initDatabase(); // Initialize the database
        displayPatients(); // Display all patients initially
        setMaxDOBDate(); // Set max date for DOB fields
    } catch (error) {
        console.error('Error initializing the database:', error);
    }
};

// Function to initialize the IndexedDB database
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CareWellClinicDB', 1);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains('patients')) {
                const objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('NHS', 'nhs', { unique: true });
                objectStore.createIndex('Name', ['firstname', 'lastname'], { unique: false });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log('Database initialized');
            resolve(db);
        };

        request.onerror = function (event) {
            console.error('Database error:', event.target.errorCode);
            reject('Database error: ' + event.target.errorCode);
        };
    });
}

// Update displayPatients to hide "No Patients Found" message initially
function displayPatients() {
    document.getElementById("no-results-message").style.display = "none"; // Hide "No Patients Found" message initially
    const transaction = db.transaction('patients', 'readonly');
    const objectStore = transaction.objectStore('patients');
    const patientsList = document.getElementById("patients-list");
    patientsList.innerHTML = ""; // Clear previous entries

    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const patient = cursor.value;
            const card = createPatientCard(patient);
            patientsList.appendChild(card);
            cursor.continue();
        }
    };
}

// Function to check if a patient with the same NHS or name already exists
async function checkPatientUniqueness(firstname, lastname, nhs, excludeId = null) {
    return new Promise((resolve) => {
        const transaction = db.transaction("patients", "readonly");
        const objectStore = transaction.objectStore("patients");
        const request = objectStore.getAll();

        request.onsuccess = function () {
            const patients = request.result;
            let duplicateField = null; // Track which field is duplicated

            patients.some(patient => {
                if (excludeId && patient.id === excludeId) return false; // Skip if editing the same record

                // Check for duplicate NHS
                if (patient.nhs === nhs) {
                    duplicateField = 'nhs';
                    return true;
                }

                // Check for duplicate Name (firstname and lastname combination)
                const nameMatch = patient.firstname.toLowerCase() === firstname.toLowerCase() &&
                                  patient.lastname.toLowerCase() === lastname.toLowerCase();
                if (nameMatch) {
                    duplicateField = 'name';
                    return true;
                }

                return false;
            });

            resolve(duplicateField); // Resolve with 'nhs', 'name', or null if unique
        };

        request.onerror = function () {
            console.error("Error checking patient uniqueness.");
            resolve(null);
        };
    });
}


// Function to format a date to dd/mm/yyyy
function formatDateToDDMMYYYY(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "N/A"; // Return "N/A" if the date is invalid
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function setMaxDOBDate() {
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0]; // Format as yyyy-mm-dd
    document.getElementById("newDOB").setAttribute("max", maxDate);
    document.getElementById("editDOB").setAttribute("max", maxDate);
}


// Function to create a patient card element
function createPatientCard(patient) {
    const { id, nhs, title, firstname, lastname, DOB, gender, bloodtype } = patient;

    // Decrypt sensitive fields
    const email = decryptpatient_info(patient.email);
    const telephone = decryptpatient_info(patient.telephone);
    const averageheartrate = decryptpatient_info(patient.averageheartrate);
    const address = decryptpatient_info(patient.address);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h2>${title} ${firstname} ${lastname}</h2>
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>NHS:</strong> ${nhs}</p>
        <p><strong>Date of Birth:</strong> ${DOB}</p>
        <p><strong>Email:</strong> ${email}</p>               <!-- Decrypted email -->
        <p><strong>Gender:</strong> ${gender}</p>
        <p><strong>Address:</strong> ${address}</p>           <!-- Decrypted address -->
        <p><strong>Telephone:</strong> ${telephone}</p>       <!-- Decrypted telephone -->
        <p><strong>Average Heart Rate:</strong> ${averageheartrate}</p> <!-- Decrypted average heart rate -->
        <p><strong>Height:</strong> ${patient.height}</p>
        <p><strong>Weight:</strong> ${patient.weight}</p>
        <p><strong>Blood Type:</strong> ${bloodtype}</p>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
    `;
    card.querySelector(".edit").onclick = () => openEditModal(patient);
    card.querySelector(".delete").onclick = () => deletePatient(patient.id);
    return card;
}


// Function to open the edit modal with patient details
function openEditModal(patient) {
    const modal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");

    // Decrypt sensitive fields for display in the edit form
    const decryptedEmail = decryptpatient_info(patient.email);
    const decryptedTelephone = decryptpatient_info(patient.telephone);
    const decryptedAverageHeartRate = decryptpatient_info(patient.averageheartrate);
    const decryptedAddress = decryptpatient_info(patient.address);

    // Directly use the DOB from the database without formatting
    const dobFromDB = patient.DOB || ""; // Use empty string if DOB is missing or undefined

    // Populate the form with patient data, using decrypted values for sensitive fields
    document.getElementById("editId").value = patient.id;
    document.getElementById("editNHS").value = patient.nhs;
    document.getElementById("editTitle").value = patient.title;
    document.getElementById("editFirst").value = patient.firstname;
    document.getElementById("editLast").value = patient.lastname;
    document.getElementById("editDOB").value = dobFromDB; // Directly display DOB from database
    document.getElementById("editDOB").type = "text"; // Set input type to text
    document.getElementById("editEmail").value = decryptedEmail; // Display decrypted email
    document.getElementById("editGender").value = patient.gender;
    document.getElementById("editAddress").value = decryptedAddress; // Display decrypted address
    document.getElementById("editTelephone").value = decryptedTelephone; // Display decrypted telephone
    document.getElementById("editHeartRate").value = decryptedAverageHeartRate || "N/A"; // Display decrypted average heart rate
    document.getElementById("editHeight").value = patient.height || "N/A";
    document.getElementById("editWeight").value = patient.weight || "N/A";
    document.getElementById("editBloodType").value = patient.bloodtype || "N/A";

    // Show the modal
    modal.style.display = "block";

    // Set up the form submission event to save changes
    editForm.onsubmit = savePatientChanges;

    // Event to close the modal
    document.querySelector(".close").onclick = function () {
        modal.style.display = "none";
    };

    // Close modal when clicking outside it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}


// Helper function to format date as 'dd/mm/yyyy'
function formatDateToDDMMYYYY(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return "N/A"; // Return "N/A" if the date is invalid

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// Function to validate and format DOB input
function validateDOB(dob) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dob);
}

// Function to save the changes made to the patient
async function savePatientChanges(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById("editId").value, 10);
    const nhs = document.getElementById("editNHS").value;
    const firstname = document.getElementById("editFirst").value;
    const lastname = document.getElementById("editLast").value;
    const dobInput = document.getElementById("editDOB").value;

    // Validate NHS length
    if (nhs.length !== 10) {
        Swal.fire({
            title: 'Invalid NHS Number!',
            text: 'The NHS number must be exactly 10 digits.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return;
    }

    // Check for uniqueness of NHS and name, excluding the current patient's ID
    const duplicateField = await checkPatientUniqueness(firstname, lastname, nhs, id);
    if (duplicateField) {
        let errorMessage = duplicateField === 'nhs' 
            ? 'A patient with this NHS number already exists.' 
            : 'A patient with this name already exists.';
        Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return;
    }

    // Retrieve the existing patient data to preserve fields like password and first_login
    const transaction = db.transaction("patients", "readonly");
    const objectStore = transaction.objectStore("patients");
    const getRequest = objectStore.get(id);

    getRequest.onsuccess = function (event) {
        const existingPatient = getRequest.result;

        // Encrypt sensitive fields
        const encryptedEmail = encryptpatient_info(document.getElementById("editEmail").value);
        const encryptedTelephone = encryptpatient_info(document.getElementById("editTelephone").value);
        const encryptedAverageHeartRate = encryptpatient_info(document.getElementById("editHeartRate").value || "N/A");
        const encryptedAddress = encryptpatient_info(document.getElementById("editAddress").value);
        const encryptedPassword = existingPatient.password; // Preserve existing encrypted password

        // Format DOB
        const formattedDOB = formatDateToDDMMYYYY(dobInput);

        // Construct the updated patient object with encrypted fields
        const updatedPatient = {
            id: id,
            nhs: nhs,
            title: document.getElementById("editTitle").value,
            firstname: firstname,
            lastname: lastname,
            DOB: formattedDOB,
            email: encryptedEmail,
            gender: document.getElementById("editGender").value,
            address: encryptedAddress,
            telephone: encryptedTelephone,
            averageheartrate: encryptedAverageHeartRate,
            height: document.getElementById("editHeight").value || "N/A",
            weight: document.getElementById("editWeight").value || "N/A",
            bloodtype: document.getElementById("editBloodType").value || "N/A",
            password: encryptedPassword,
            first_login: existingPatient.first_login !== undefined ? existingPatient.first_login : true
        };

        // Update the patient data in the database
        const writeTransaction = db.transaction("patients", "readwrite");
        const writeObjectStore = writeTransaction.objectStore("patients");
        const updateRequest = writeObjectStore.put(updatedPatient);

        updateRequest.onsuccess = function () {
            Swal.fire({
                title: 'Success!',
                text: 'Patient details have been successfully updated.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#00A8F0',
            }).then(() => {
                displayPatients();
                document.getElementById("editModal").style.display = "none"; // Close the modal
            });
        };

        updateRequest.onerror = function (event) {
            console.error("Error updating patient:", event.target.error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to update the patient details. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
            });
        };
    };

    getRequest.onerror = function () {
        console.error("Error fetching existing patient data.");
    };
}



// Function to enroll a new patient with auto-incremented ID
async function enrollPatient(event) {
    event.preventDefault();

    const nhs = document.getElementById("newNHS").value;
    const firstname = document.getElementById("newFirst").value;
    const lastname = document.getElementById("newLast").value;

    if (nhs.length !== 10) {
        Swal.fire({
            title: 'Invalid NHS Number!',
            text: 'The NHS number must be exactly 10 digits.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return;
    }

    const duplicateField = await checkPatientUniqueness(firstname, lastname, nhs);
    if (duplicateField) {
        let errorMessage = duplicateField === 'nhs'
            ? 'A patient with this NHS number already exists.'
            : 'A patient with this name already exists.';
        Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return;
    }

    const dobInput = document.getElementById("newDOB").value;
    const formattedDOB = formatDateToDDMMYYYY(dobInput);

    // Encrypt sensitive fields
    const encryptedEmail = encryptpatient_info(document.getElementById("newEmail").value);
    const encryptedTelephone = encryptpatient_info(document.getElementById("newTelephone").value);
    const encryptedAverageHeartRate = encryptpatient_info(document.getElementById("newHeartRate").value || "N/A");
    const encryptedAddress = encryptpatient_info(document.getElementById("newAddress").value);
    const encryptedPassword = encryptpatient_info(`${firstname}2024!`); // Encrypt the generated password

    const newPatient = {
        nhs: nhs,
        title: document.getElementById("newTitle").value,
        firstname: firstname,
        lastname: lastname,
        DOB: formattedDOB,
        email: encryptedEmail,
        gender: document.getElementById("newGender").value,
        address: encryptedAddress,
        telephone: encryptedTelephone,
        averageheartrate: encryptedAverageHeartRate,
        height: document.getElementById("newHeight").value || "N/A",
        weight: document.getElementById("newWeight").value || "N/A",
        bloodtype: document.getElementById("newBloodType").value || "N/A",
        password: encryptedPassword,
        first_login: true
    };

    const transaction = db.transaction("patients", "readwrite");
    const objectStore = transaction.objectStore("patients");

    // Add the patient to the database
    const request = objectStore.add(newPatient);

    request.onsuccess = function (event) {
        const patientId = event.target.result; // Retrieve the auto-generated `id`
        console.log("New patient enrolled with ID:", patientId);

        // Update patient data with `id` explicitly and replace it in the database
        const patientWithId = { id: patientId, ...newPatient };
        const updateRequest = objectStore.put(patientWithId);

        updateRequest.onsuccess = function () {
            Swal.fire({
                title: 'Success!',
                text: 'The patient has been enrolled successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#00A8F0',
            }).then(() => {
                document.getElementById("enrollForm").reset();
                displayPatients(); // Refresh the display to show the correct ID order
            });
        };

        updateRequest.onerror = function (event) {
            console.error("Error updating patient with ID:", event.target.error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to finalize the patient enrollment. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
            });
        };
    };

    request.onerror = function (event) {
        console.error("Error enrolling new patient:", event.target.error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to enroll the patient. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
    };
}


// Function to delete a patient card with confirmation
function deletePatient(patientId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you really want to delete this patient record?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Proceed with deletion
            const transaction = db.transaction("patients", "readwrite");
            const objectStore = transaction.objectStore("patients");
            const request = objectStore.delete(patientId);

            request.onsuccess = function () {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The patient record has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6'
                }).then(() => {
                    displayPatients(); // Refresh the list to remove the deleted card from view
                });
            };

            request.onerror = function (event) {
                console.error("Error deleting patient:", event.target.error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete the patient record. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#f44336'
                });
            };
        }
    });
}

// Event listener for search input
document.getElementById("search").addEventListener("input", function() {
    const query = this.value.trim().toLowerCase();
    searchPatients(query);
});

// Search patients by name and display results
function searchPatients(query) {
    const transaction = db.transaction('patients', 'readonly');
    const objectStore = transaction.objectStore('patients');
    const patientsList = document.getElementById("patients-list");
    patientsList.innerHTML = ""; // Clear previous entries

    let found = false; // Flag to track if any patients match the search query

    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const patient = cursor.value;
            const fullName = `${patient.firstname} ${patient.lastname}`.toLowerCase();

            if (fullName.includes(query)) {
                const card = createPatientCard(patient);
                patientsList.appendChild(card);
                found = true; // At least one patient found
            }
            cursor.continue();
        } else {
            // Display the "No Patients Found" message if no match is found
            const noResultsMessage = document.getElementById("no-results-message");
            noResultsMessage.style.display = found ? "none" : "block";
        }
    };
}


// Event listener for enrolling new patients
document.getElementById("enrollForm").addEventListener("submit", enrollPatient);

// NHS Field Validation for Enrollment and Edit Sections
function validateNHSInput(event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
    if (event.target.value.length > 10) {
        event.target.value = event.target.value.slice(0, 10); // Limit to 10 digits
    }
}

// Add NHS validation for enrollment form
document.getElementById("newNHS").addEventListener("input", validateNHSInput);

// Add NHS validation for edit form
document.getElementById("editNHS").addEventListener("input", validateNHSInput);

// Function to allow only letters for first name and last name fields
function validateNameInput(event) {
    event.target.value = event.target.value.replace(/[^a-zA-Z\s]/g, ''); // Allow only letters and spaces
}

// Apply name validation for first and last name fields in the enrollment and edit sections
document.getElementById("newFirst").addEventListener("input", validateNameInput);
document.getElementById("newLast").addEventListener("input", validateNameInput);
document.getElementById("editFirst").addEventListener("input", validateNameInput);
document.getElementById("editLast").addEventListener("input", validateNameInput);

// Function to validate telephone input format
function validateTelephoneInput(event) {
    event.target.value = event.target.value.replace(/[^0-9+\s]/g, ''); // Allow only numbers, +, and spaces

    // Enforce max length of 17 characters (including spaces)
    if (event.target.value.length > 17) {
        event.target.value = event.target.value.slice(0, 17);
    }
}

// Apply telephone validation for enrollment and edit sections
document.getElementById("newTelephone").addEventListener("input", validateTelephoneInput);
document.getElementById("editTelephone").addEventListener("input", validateTelephoneInput);

// Function to allow only numbers in specific fields
function validateNumberInput(event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, ''); // Allow only numbers (0-9)
}

// Apply number-only validation for Average Heart Rate, Height, and Weight fields in enrollment and edit sections
document.getElementById("newHeartRate").addEventListener("input", validateNumberInput);
document.getElementById("newHeight").addEventListener("input", validateNumberInput);
document.getElementById("newWeight").addEventListener("input", validateNumberInput);

document.getElementById("editHeartRate").addEventListener("input", validateNumberInput);
document.getElementById("editHeight").addEventListener("input", validateNumberInput);
document.getElementById("editWeight").addEventListener("input", validateNumberInput);

// Function to validate blood type input
function validateBloodTypeInput(event) {
    const validBloodTypes = ["A", "B", "A-", "A+", "B-", "B+", "O", "O-", "O+", "AB", "AB-", "AB+"];
    const value = event.target.value.toUpperCase();

    // Allow input only if it matches a valid blood type in the array
    if (!validBloodTypes.some(type => type.startsWith(value))) {
        event.target.value = event.target.value.slice(0, -1); // Remove the last character if invalid
        event.target.setCustomValidity("Acceptable values are: A, B, A-, A+, B-, B+, O, O-, O+, AB, AB-, AB+");
    } else if (validBloodTypes.includes(value)) {
        event.target.setCustomValidity(""); // Clear the error message if input is valid
    } else {
        event.target.setCustomValidity("Acceptable values are: A, B, A-, A+, B-, B+, O, O-, O+, AB, AB-, AB+");
    }
}

// Add blood type validation for enrollment and edit forms
document.getElementById("newBloodType").addEventListener("input", validateBloodTypeInput);
document.getElementById("editBloodType").addEventListener("input", validateBloodTypeInput); 