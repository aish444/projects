document.addEventListener("DOMContentLoaded", async () => {
    try {
        await openDatabases();
        displayDoctorName(); // Display doctor's name in the header// Load appointment requests for the doctor
        checkFirstLogin(); // Check if the doctor needs to change the password
    } catch (error) {
        console.error("Error initializing doctor dashboard:", error);
    }
});


// Open existing Patient and Appointment databases without creating them
function openDatabases() {
    return Promise.all([
        new Promise((resolve, reject) => {
            const request = indexedDB.open("CareWellClinicDB", 1);
            request.onsuccess = (event) => {
                const db = event.target.result;
                patientDB = db;
                appointmentDB = db;
                resolve();
            };
            request.onerror = () => reject("Error opening CareWellClinicDB DB");
        })
    ]);
}

// Function to sort tables by column
function sortTable(tableId, columnIndex) {
    const table = document.querySelector(`#${tableId} table`);
    const rows = Array.from(table.rows).slice(1); // Exclude the header row
    const isAscending = table.dataset.sortOrder === 'asc';

    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[columnIndex].textContent.trim();
        const cellB = rowB.cells[columnIndex].textContent.trim();

        // Compare as numbers if both are numeric, otherwise as text
        const comparison = isNaN(cellA) || isNaN(cellB)
            ? cellA.localeCompare(cellB)
            : parseFloat(cellA) - parseFloat(cellB);

        return isAscending ? comparison : -comparison;
    });

    // Reattach rows in sorted order
    rows.forEach(row => table.appendChild(row));
    table.dataset.sortOrder = isAscending ? 'desc' : 'asc';
}


// Chart.js for Patient Analysis
const ctx = document.getElementById('patientAnalysisChart').getContext('2d');
const patientChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], // Months from Jan to Nov
        datasets: [{
            label: 'Patients',
            data: [5, 15, 7, 12, 17, 25, 15, 23, 27, 35, 40].map(value => Math.min(value, 45)), 
            borderColor: 'rgba(0, 168, 240, 1)',
            backgroundColor: 'rgba(0, 168, 240, 0.1)',
            fill: true,
            tension: 0.4,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // Ensure the chart adapts properly
        plugins: {
            legend: {
                display: true,
                position: 'bottom', // Move the legend to the bottom
                labels: {
                    boxWidth: 20, 
                    padding: 10,
                }
            }
        },
        layout: {
            padding: {
                bottom: 20, // Add padding to the bottom to fit x-axis labels
            }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: false, // Ensure all labels are shown
                    maxRotation: 0,  // Keep labels horizontal
                    minRotation: 0,
                }
            },
            y: {
                beginAtZero: true,
            }
        }
    }
});


function displayDoctorName() {
    console.log("Opening CareWellClinicDB to retrieve doctor information...");

    const request = indexedDB.open("CareWellClinicDB", 1);  // Open CareWellClinicDB

    request.onsuccess = (event) => {
        console.log("Database opened successfully.");
        
        const db = event.target.result;
        const transaction = db.transaction("doctors", "readonly");  // Access doctors object store
        const store = transaction.objectStore("doctors");

        // Retrieve the logged-in doctor's first and last name from localStorage
        const loggedInDoctorFirstName = localStorage.getItem("loggedInDoctorFirstName");
        const loggedInDoctorLastName = localStorage.getItem("loggedInDoctorLastName");
        console.log("Retrieved doctor name from localStorage:", loggedInDoctorFirstName, loggedInDoctorLastName);

        // Check if localStorage values are set correctly
        if (!loggedInDoctorFirstName || !loggedInDoctorLastName) {
            console.error("Doctor's first or last name not found in localStorage.");
            return;
        }

        // Open a cursor to search for the specific doctor
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const doctor = cursor.value;
                console.log("Checking doctor record in database:", doctor);

                // Compare the stored first and last name
                if (doctor.firstname === loggedInDoctorFirstName && doctor.lastname === loggedInDoctorLastName) {
                    // Update the header with the doctor's name
                    console.log("Doctor match found. Displaying name in header.");
                    document.getElementById('doctor-welcome').textContent = `Welcome Dr. ${doctor.firstname} ${doctor.lastname}`;
                    return; // Exit the function once the match is found
                }
                cursor.continue(); // Move to the next entry
            } else {
                // No match found
                console.error("Doctor not found in database. Ensure that the first and last names in localStorage match a doctor entry in the database.");
            }
        };

        cursorRequest.onerror = (event) => {
            console.error("Error fetching doctor information:", event.target.error);
        };
    };

    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
}

// Enhanced Pie Chart for Online vs In-Person Patients
const ctxPie = document.getElementById('patientTypeChart').getContext('2d');

const patientTypeChart = new Chart(ctxPie, {
    type: 'pie',
    data: {
        labels: ['Online Patients', 'In-Person Patients'],
        datasets: [{
            data: [60, 40],
            backgroundColor: ['#85b4da', '#0f2c40'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true, // Ensure the aspect ratio is respected
        plugins: {
            legend: {
                position: 'right', // Keep the legend to the right
                labels: {
                    font: {
                        size: 12, 
                    },
                    color: '#333',
                    padding: 10, 
                }
            },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        const value = tooltipItem.raw;
                        const total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1) + '%';
                        return `${tooltipItem.label}: ${percentage}`;
                    }
                }
            }
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                right: 10, // Ensure no part of the chart is cut off
            }
        }
    }
});


// Utility function to display error messages
function displayError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// Utility function to hide all error messages
function hideAllErrors() {
  document.querySelectorAll('.error-message').forEach(error => {
      error.style.display = 'none';
  });
}

// Function to check if the doctor needs to change the password on first login
function checkFirstLogin() {
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('doctors', 'readonly');
        const store = transaction.objectStore('doctors');

        // Retrieve the logged-in doctor's first and last name from localStorage
        const loggedInDoctorFirstName = localStorage.getItem("loggedInDoctorFirstName");
        const loggedInDoctorLastName = localStorage.getItem("loggedInDoctorLastName");

        if (!loggedInDoctorFirstName || !loggedInDoctorLastName) {
            console.error("Doctor's first or last name not found in localStorage.");
            return;
        }

        console.log("Checking first login status for:", loggedInDoctorFirstName, loggedInDoctorLastName);

        // Open a cursor to search for the specific doctor
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const doctor = cursor.value;

                // Check if the cursor entry matches the logged-in doctor
                if (doctor.firstname === loggedInDoctorFirstName && doctor.lastname === loggedInDoctorLastName) {
                    console.log("Doctor record found:", doctor);

                    // Check the firstLogin field
                    if (doctor.firstLogin) {
                        console.log("First login is true. Showing password change popup.");
                        showPasswordChangePopup(doctor.id); // Show the popup if firstLogin is true
                    } else {
                        console.log("First login is false. No need for password change.");
                    }
                    return; // Exit once the match is found
                }
                cursor.continue(); // Move to the next entry if not matched
            } else {
                console.error("No matching doctor found in the database.");
            }
        };

        cursorRequest.onerror = (event) => {
            console.error("Error fetching doctor information:", event.target.error);
        };
    };

    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
}


// Function to display the password change popup
function showPasswordChangePopup(doctorId) {
  const popup = document.createElement("div");
  popup.id = "password-change-popup";
  popup.innerHTML = `
      <div class="popup-content">
          <h2>Change Your Password</h2>
          <p>For security reasons, please update your password.</p>
          <div class="password-container">
              <input type="password" id="new-password" placeholder="New Password" />
              <i class="fas fa-eye" onclick="togglePasswordVisibility('new-password', this)"></i>
              <div id="new-password-error" class="error-text"></div>
          </div>
          <div class="password-container">
              <input type="password" id="confirm-password" placeholder="Confirm Password" />
              <i class="fas fa-eye" onclick="togglePasswordVisibility('confirm-password', this)"></i>
              <div id="confirm-password-error" class="error-text"></div>
          </div>
          <button onclick="changePassword(${doctorId})">Change Password</button>
      </div>
  `;
  document.body.appendChild(popup);
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
  } else {
      input.type = "password";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
  }
}


// Function to validate and change the password
function changePassword(doctorId) {
    console.log("Change Password button clicked"); // Debug log
  
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const newPasswordError = document.getElementById("new-password-error");
    const confirmPasswordError = document.getElementById("confirm-password-error");
  
    // Clear previous errors
    newPasswordError.textContent = "";
    confirmPasswordError.textContent = "";
    newPasswordError.style.display = "none";
    confirmPasswordError.style.display = "none";
  
    // Validate the new password
    const validationError = validatePassword(newPassword);
    if (validationError) {
        displayError("new-password-error", validationError);
        console.log("Password validation failed:", validationError); // Debug log
        return;
    }
  
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        displayError("confirm-password-error", "Passwords do not match!");
        console.log("Passwords do not match"); // Debug log
        return;
    }
  
    // Immediately hide the popup to avoid overlapping with Swal
    document.getElementById("password-change-popup").style.display = "none";
  
    const request = indexedDB.open('CareWellClinicDB', 1);
  
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('doctors', 'readwrite');
        const store = transaction.objectStore('doctors');
  
        const getRequest = store.get(doctorId);
  
        getRequest.onsuccess = (event) => {
            const doctor = event.target.result;
            if (doctor) {
                // Encrypt the new password before storing
                doctor.password = encryptDoctorData(newPassword); // Encrypt the new password
                doctor.firstLogin = false; // Set `firstLogin` to false after changing the password
  
                const updateRequest = store.put(doctor);
                updateRequest.onsuccess = () => {
                    console.log("Password updated successfully"); // Debug log
                    Swal.fire({
                        icon: 'success',
                        title: 'Password Changed',
                        text: 'Your password has been successfully updated!',
                        confirmButtonColor: '#00A8F0',
                        customClass: { popup: 'swal-popup-zindex' }
                    }).then(() => {
                        document.getElementById("password-change-popup").remove(); // Ensure popup is fully removed
                    });
                };
  
                updateRequest.onerror = () => {
                    console.error("Failed to update password"); // Debug log
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: 'Failed to update the password. Please try again.',
                        confirmButtonColor: '#f44336',
                        customClass: { popup: 'swal-popup-zindex' }
                    });
                    // Re-display the popup if needed
                    document.getElementById("password-change-popup").style.display = "flex";
                };
            }
        };
  
        getRequest.onerror = () => {
            console.error("Failed to retrieve doctor information"); // Debug log
            Swal.fire({
                icon: 'error',
                title: 'Database Error',
                text: 'Failed to retrieve doctor information. Please try again.',
                confirmButtonColor: '#f44336',
                customClass: { popup: 'swal-popup-zindex' }
            });
            // Re-display the popup if needed
            document.getElementById("password-change-popup").style.display = "flex";
        };
    };
  
    request.onerror = (event) => {
        console.error("Database error:", event.target.error); // Debug log
        Swal.fire({
            icon: 'error',
            title: 'Database Error',
            text: 'Failed to connect to the database. Please try again.',
            confirmButtonColor: '#f44336',
            customClass: { popup: 'swal-popup-zindex' }
        });
        // Re-display the popup if needed
        document.getElementById("password-change-popup").style.display = "flex";
    };
  }
  

// Function to validate password criteria
function validatePassword(password) {
  if (password.length < 10) {
      return "Password should be at least 10 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
      return "Password should include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
      return "Password should include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
      return "Password should include at least one number.";
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      return "Password should include at least one special character.";
  }
  return null; // No errors
}