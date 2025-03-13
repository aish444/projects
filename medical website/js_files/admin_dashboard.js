let db;
let dbPatients;
let currentMaxId = 0;
let genderChart;
let doctorsAvailabilityChart;

// Connect to IndexedDB and initialize
const request = indexedDB.open('CareWellClinicDB', 1);

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Connected to CareWellClinicDB.");
    initializeDatabaseAndCharts();
    loadDoctorsData();
};

request.onerror = function () {
    console.error("Failed to open CareWellClinicDB connection.");
};

// Function to update the welcome message with the logged-in admin's name
document.addEventListener("DOMContentLoaded", function () {
    const adminUsername = localStorage.getItem('loggedInAdmin');
    if (adminUsername) {
        const welcomeMessageElement = document.querySelector('.welcome-message');
        welcomeMessageElement.textContent = `Welcome, ${adminUsername}`;
    } else {
        console.warn("Admin username not found in localStorage.");
    }
});


// Load doctor data and update max ID
function loadDoctorsData() {
    const transaction = db.transaction("doctors", "readonly");
    const objectStore = transaction.objectStore("doctors");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function () {
        const doctors = getAllRequest.result;
        if (doctors.length > 0) {
            currentMaxId = Math.max(...doctors.map(doctor => doctor.id)) || 0;
            displayDoctors(doctors);
            updateDoctorCount();
        } else {
            console.log("No doctors found in the database.");
        }
    };

    getAllRequest.onerror = function () {
        console.error("Failed to fetch doctors from IndexedDB.");
    };
}

// Sanitize input to prevent XSS
function sanitizeInput(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

// Enroll new doctor
document.getElementById('enrollForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const firstName = sanitizeInput(document.getElementById('newFirstName').value);
    const lastName = sanitizeInput(document.getElementById('newLastName').value);

    // Generate and encrypt the password
    const generatedPassword = `${firstName.toLowerCase()}123`;
    const encryptedPassword = encryptDoctorData(generatedPassword);

    // Encrypt other sensitive fields
    const encryptedEmail = encryptDoctorData(sanitizeInput(document.getElementById('newEmail').value));
    const encryptedAddress = encryptDoctorData(sanitizeInput(document.getElementById('newAddress').value));
    const encryptedTelephone = encryptDoctorData(sanitizeInput(document.getElementById('newTelephone').value));

    const newDoctor = {
        id: currentMaxId + 1, // Incremented ID only if enrollment succeeds
        address: encryptedAddress,       // Store encrypted address
        email: encryptedEmail,           // Store encrypted email
        firstLogin: true,
        firstname: firstName,
        gender: sanitizeInput(document.getElementById('newGender').value),
        lastname: lastName,
        password: encryptedPassword,     // Store encrypted password
        telephone: encryptedTelephone,   // Store encrypted telephone
    };

    // Check for uniqueness with encrypted fields
    const duplicateField = await checkDoctorUniqueness(newDoctor);
    if (duplicateField) {
        let errorMessage = duplicateField === 'name' 
            ? 'A doctor with this name is already enrolled.' 
            : duplicateField === 'email' 
            ? 'This email is already associated with another doctor.' 
            : 'This telephone number is already associated with another doctor.';

        Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return;
    }

    // Add doctor to the database
    const addTransaction = db.transaction("doctors", "readwrite");
    const addObjectStore = addTransaction.objectStore("doctors");
    const addRequest = addObjectStore.add(newDoctor);

    addRequest.onsuccess = function () {
        currentMaxId++;
        Swal.fire({
            title: 'Success!',
            text: 'New doctor enrolled successfully!',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00A8F0',
        });
        loadDoctorsData();
        document.getElementById('enrollForm').reset();
    };

    addRequest.onerror = function (event) {
        console.error("Error adding new doctor:", event.target.error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to enroll new doctor. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
    };
});

// Check uniqueness for doctor details
function checkDoctorUniqueness(newDoctor, excludeId = null) {
    return new Promise((resolve) => {
        const transaction = db.transaction("doctors", "readonly");
        const objectStore = transaction.objectStore("doctors");
        const request = objectStore.getAll();

        request.onsuccess = function () {
            const doctors = request.result;
            let duplicateField = null;

            doctors.some(doctor => {
                if (excludeId && doctor.id === excludeId) return false;

                // Check for duplicate full name
                const nameMatch = `${doctor.firstname} ${doctor.lastname}`.toLowerCase() === `${newDoctor.firstname} ${newDoctor.lastname}`.toLowerCase();
                if (nameMatch) {
                    duplicateField = 'name';
                    return true;
                }

                // Decrypt stored values for email and telephone
                const decryptedEmail = decryptDoctorData(doctor.email);
                const decryptedTelephone = decryptDoctorData(doctor.telephone);
                
                // Check for duplicate email
                const newEmailDecrypted = decryptDoctorData(newDoctor.email);
                if (decryptedEmail === newEmailDecrypted) {
                    duplicateField = 'email';
                    return true;
                }

                // Check for duplicate telephone
                const newTelephoneDecrypted = decryptDoctorData(newDoctor.telephone);
                if (decryptedTelephone === newTelephoneDecrypted) {
                    duplicateField = 'telephone';
                    return true;
                }

                return false;
            });

            resolve(duplicateField);
        };

        request.onerror = function () {
            console.error("Error checking doctor uniqueness.");
            resolve(false);
        };
    });
}

// Display doctors
function displayDoctors(doctors = [], searchTerm = "") {
    const doctorList = document.getElementById("doctor-list");
    const noResultsMessage = document.getElementById("no-results-message");
    doctorList.innerHTML = ""; // Clear previous entries
    let hasResults = false;

    // Loop through doctors to display those matching the search term
    doctors.forEach(doctor => {
        const fullName = `${doctor.firstname} ${doctor.lastname}`.toLowerCase();
        if (searchTerm === "" || fullName.includes(searchTerm.toLowerCase())) {
            hasResults = true;
            createDoctorCard(doctor);
        }
    });

    // Show or hide the "No doctors found" message based on results
    if (!hasResults && searchTerm) {
        noResultsMessage.style.display = "block"; // Show message if no matches found
    } else {
        noResultsMessage.style.display = "none"; // Hide message if there are matches or search is empty
    }
}

function createDoctorCard(doctor) {
    const doctorList = document.getElementById("doctor-list");
    const doctorCard = document.createElement("div");
    doctorCard.className = "doctor-card";

    // Decrypt sensitive fields
    const decryptedEmail = decryptDoctorData(doctor.email);
    const decryptedAddress = decryptDoctorData(doctor.address);
    const decryptedTelephone = decryptDoctorData(doctor.telephone);

    doctorCard.innerHTML = `
        <h3>${sanitizeInput(doctor.firstname)} ${sanitizeInput(doctor.lastname)}</h3>
        <p><strong>ID:</strong> ${sanitizeInput(doctor.id)}</p>
        <p><strong>Email:</strong> ${sanitizeInput(decryptedEmail)}</p> <!-- Use decrypted email -->
        <p><strong>Gender:</strong> ${sanitizeInput(doctor.gender)}</p>
        <p><strong>Address:</strong> ${sanitizeInput(decryptedAddress)}</p> <!-- Use decrypted address -->
        <p><strong>Telephone:</strong> ${sanitizeInput(decryptedTelephone)}</p> <!-- Use decrypted telephone -->
        <button class="edit-btn" onclick="editDoctor(${doctor.id})">Edit</button>
        <button class="delete-btn" onclick="deleteDoctor(${doctor.id})">Delete</button>
    `;
    doctorList.appendChild(doctorCard);
}

// Edit doctor details
function editDoctor(id) {
    const transaction = db.transaction("doctors", "readonly");
    const objectStore = transaction.objectStore("doctors");
    const request = objectStore.get(id);

    request.onsuccess = function (event) {
        const doctor = event.target.result;
        openModal(doctor);
    };
}

function openModal(doctor) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    // Decrypt sensitive fields
    const decryptedEmail = decryptDoctorData(doctor.email);
    const decryptedAddress = decryptDoctorData(doctor.address);
    const decryptedTelephone = decryptDoctorData(doctor.telephone);

    modal.style.display = 'block';
    document.getElementById('editDoctorId').value = doctor.id;
    document.getElementById('editFirstName').value = sanitizeInput(doctor.firstname);
    document.getElementById('editLastName').value = sanitizeInput(doctor.lastname);
    document.getElementById('editEmail').value = decryptedEmail; // Use decrypted email
    document.getElementById('editAddress').value = decryptedAddress; // Use decrypted address
    document.getElementById('editTelephone').value = decryptedTelephone; // Use decrypted telephone
}


// Update doctor details after editing
document.getElementById('editForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = Number(document.getElementById('editDoctorId').value);
    const firstName = sanitizeInput(document.getElementById('editFirstName').value);
    const lastName = sanitizeInput(document.getElementById('editLastName').value);

    // Sanitize and encrypt sensitive fields
    const email = encryptDoctorData(sanitizeInput(document.getElementById('editEmail').value));
    const address = encryptDoctorData(sanitizeInput(document.getElementById('editAddress').value));
    const telephone = encryptDoctorData(sanitizeInput(document.getElementById('editTelephone').value));

    const updatedDoctor = { id, firstname: firstName, lastname: lastName, email, address, telephone };

    const duplicateField = await checkDoctorUniqueness(updatedDoctor, id);
    if (duplicateField) {
        let errorMessage = '';

        // Set a specific error message based on which field is duplicated
        if (duplicateField === 'name') {
            errorMessage = 'A doctor with this name is already enrolled.';
        } else if (duplicateField === 'email') {
            errorMessage = 'This email is already associated with another doctor.';
        } else if (duplicateField === 'telephone') {
            errorMessage = 'This telephone number is already associated with another doctor.';
        }

        Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
        });
        return; // Exit the function to prevent adding a duplicate
    }

    const transaction = db.transaction("doctors", "readwrite");
    const objectStore = transaction.objectStore("doctors");
    const request = objectStore.get(id);

    request.onsuccess = function () {
        const doctor = request.result;
        doctor.firstname = firstName;
        doctor.lastname = lastName;
        doctor.email = email; // Use encrypted email
        doctor.address = address; // Use encrypted address
        doctor.telephone = telephone; // Use encrypted telephone

        const updateRequest = objectStore.put(doctor);

        updateRequest.onsuccess = function () {
            Swal.fire({
                title: 'Success!',
                text: 'Doctor updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
            });
            closeModal();
            loadDoctorsData();
        };
    };
});

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Delete doctor with confirmation
function deleteDoctor(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you really want to delete this doctor? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const transaction = db.transaction("doctors", "readwrite");
            const objectStore = transaction.objectStore("doctors");
            const request = objectStore.delete(id);

            request.onsuccess = function () {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The doctor has been deleted successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#00A8F0',
                });
                loadDoctorsData();
            };
        }
    });
}

// Generate Gender Chart
function generateGenderChart(doctors) {
    const genderCounts = { Male: 0, Female: 0 };
    doctors.forEach(doctor => {
        if (doctor.gender === "Male") genderCounts.Male++;
        if (doctor.gender === "Female") genderCounts.Female++;
    });

    const genderCtx = document.getElementById('genderChart').getContext('2d');
    if (genderChart) genderChart.destroy();

    genderChart = new Chart(genderCtx, {
        type: 'pie',
        data: {
            labels: ['Male', 'Female'],
            datasets: [{
                data: [genderCounts.Male, genderCounts.Female],
                backgroundColor: ['#0f2c40', '#85b4da'],
                hoverOffset: 4
            }]
        },
        options: { plugins: { legend: { display: true, position: 'top' } } }
    });
}

// Initialize Database and Charts
async function initializeDatabaseAndCharts() {
    const transaction = db.transaction("doctors", "readonly");
    const objectStore = transaction.objectStore("doctors");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function () {
        const doctors = getAllRequest.result;
        if (doctors.length > 0) {
            generateGenderChart(doctors); // Generate the gender distribution chart
        }
        generateDoctorsAvailabilityChart(); // Generate the doctors' availability chart
    };

    // Call updatePatientCount to show enrolled patients
    updatePatientCount();
}

function updateDoctorCount() {
    const transaction = db.transaction("doctors", "readonly");
    const objectStore = transaction.objectStore("doctors");
    const countRequest = objectStore.count();

    countRequest.onsuccess = function () {
        const doctorCountElement = document.querySelector('.doctor-count');
        doctorCountElement.setAttribute('data-target', countRequest.result);
        animateStats();
    };
}

function updatePatientCount() {
    const transaction = db.transaction("patients", "readonly");
    const objectStore = transaction.objectStore("patients");
    const countRequest = objectStore.count();

    countRequest.onsuccess = function () {
        const patientCount = countRequest.result;
        const patientCountElement = document.querySelector('.patient-count');
        patientCountElement.setAttribute('data-target', patientCount); // Set target for animation
        animateStats(); // Call animation function to update the displayed count
    };

    countRequest.onerror = function () {
        console.error("Failed to count patients in the database.");
    };
}


function animateStats() {
    const statNums = document.querySelectorAll('.stat-num');
    statNums.forEach(stat => {
        const target = +stat.getAttribute('data-target');
        const increment = target / 100;

        function updateCount() {
            const currentValue = +stat.innerText;
            if (currentValue < target) {
                stat.innerText = Math.ceil(currentValue + increment);
                setTimeout(updateCount, 20);
            } else {
                stat.innerText = target;
            }
        }
        updateCount();
    });
}

// Generate a bar chart showing doctors' availability
function generateDoctorsAvailabilityChart() {
    console.log("Generating Doctors Availability Chart...");

    const doctorsCtx = document.getElementById('doctorsChart').getContext('2d');

    // Destroy the existing chart instance if it exists to prevent duplication
    if (doctorsAvailabilityChart) {
        doctorsAvailabilityChart.destroy();
    }

    try {
        // Create a new chart instance with sample data
        doctorsAvailabilityChart = new Chart(doctorsCtx, {
            type: 'bar',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                datasets: [{
                    label: 'Available Doctors',
                    data: [5, 10, 6, 8, 9, 4, 3], // Replace this with actual data for availability if available
                    backgroundColor: '#b2d4f0',
                    borderRadius: 5,
                    barThickness: 30
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 3 // Set step size for the y-axis as required
                        }
                    }
                }
            }
        });
        console.log("Doctors Availability Chart successfully created.");
    } catch (error) {
        console.error("Error generating doctors availability chart:", error);
    }
}

// Function to search for doctors based on the input in the search bar
document.getElementById("doctorSearch").addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();

    // Retrieve all doctors from IndexedDB and filter them based on the search term
    const transaction = db.transaction("doctors", "readonly");
    const objectStore = transaction.objectStore("doctors");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function () {
        const doctors = getAllRequest.result;
        const filteredDoctors = doctors.filter(doctor => {
            const fullName = `${doctor.firstname} ${doctor.lastname}`.toLowerCase();
            return fullName.includes(searchTerm);
        });

        // Call displayDoctors with filtered doctors and search term
        displayDoctors(filteredDoctors, searchTerm);
    };

    getAllRequest.onerror = function () {
        console.error("Failed to search doctors.");
    };
});

// Allow only letters for first name and last name fields
function allowOnlyLetters(event) {
    event.target.value = event.target.value.replace(/[^a-zA-Z\s]/g, ""); // Remove any character that is not a letter or space
}

document.getElementById("newFirstName").addEventListener("input", allowOnlyLetters);
document.getElementById("newLastName").addEventListener("input", allowOnlyLetters);
document.getElementById("editFirstName").addEventListener("input", allowOnlyLetters);
document.getElementById("editLastName").addEventListener("input", allowOnlyLetters);

// Format telephone input with the pattern 123-456-7890
function formatTelephoneInput(event) {
    let value = event.target.value.replace(/\D/g, ""); // Remove any non-digit characters

    // Limit the value to a maximum of 10 digits
    if (value.length > 10) {
        value = value.slice(0, 10);
    }

    // Format the value with hyphens at the 4th and 7th positions
    if (value.length > 3 && value.length <= 6) {
        value = value.replace(/(\d{3})(\d+)/, "$1-$2");
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    }

    event.target.value = value; // Update the field with formatted value
}

document.getElementById("newTelephone").addEventListener("input", formatTelephoneInput);
document.getElementById("editTelephone").addEventListener("input", formatTelephoneInput);
