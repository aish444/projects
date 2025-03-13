let db; // Global database variable

// Function to open the existing IndexedDB without creating a new one
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CareWellClinicDB", 1);

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function () {
      reject("Error opening IndexedDB");
    };
  });
}

// Function to retrieve patient data by first and last name
function getPatientDataFromDB(firstName, lastName) {
  return new Promise((resolve, reject) => {
    console.log("Looking for patient:", firstName, lastName);

    const transaction = db.transaction("patients", "readonly");
    const objectStore = transaction.objectStore("patients");
    const cursorRequest = objectStore.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const patient = cursor.value;
        console.log("Checking patient record:", patient.firstname, patient.lastname);

        if (patient.firstname === firstName && patient.lastname === lastName) {
          console.log("Patient found:", patient);
          resolve(patient);
        } else {
          cursor.continue();
        }
      } else {
        console.log("No matching patient found.");
        reject("Patient not found");
      }
    };

    cursorRequest.onerror = () => {
      console.error("Error retrieving patient data");
      reject("Error retrieving patient data");
    };
  });
}

// Function to check if the patient needs to change the password on first login
function checkFirstLoginForPatient() {
  console.log("Starting checkFirstLoginForPatient");

  const request = indexedDB.open("CareWellClinicDB", 1);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction("patients", "readonly");
    const store = transaction.objectStore("patients");

    const loggedInPatientFirstName = localStorage.getItem("loggedInPatientFirstName");
    const loggedInPatientLastName = localStorage.getItem("loggedInPatientLastName");

    console.log("Logged in patient:", loggedInPatientFirstName, loggedInPatientLastName);

    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const patient = cursor.value;
        console.log("Checking patient:", patient.firstname, patient.lastname, "first_login:", patient.first_login);

        if (patient.firstname === loggedInPatientFirstName && patient.lastname === loggedInPatientLastName) {
          if (patient.first_login === true) {
            console.log("First login is true, showing password change popup.");
            showPasswordChangePopupForPatient(patient.id);
          } else {
            console.log("Patient has already changed the password.");
          }
          return;
        }
        cursor.continue();
      } else {
        console.log("No matching patient found in the database.");
      }
    };

    cursorRequest.onerror = (event) => {
      console.error("Error fetching patient information:", event.target.error);
    };
  };

  request.onerror = (event) => {
    console.error("Database error:", event.target.error);
  };
}

// Load patient metrics on the dashboard and check if it's the first login
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await openDatabase();

    const firstName = localStorage.getItem("loggedInPatientFirstName");
    const lastName = localStorage.getItem("loggedInPatientLastName");

    if (firstName && lastName) {
      document.getElementById("patientName").textContent = `${firstName} ${lastName}`;

      const patientData = await getPatientDataFromDB(firstName, lastName);

      // Decrypt sensitive data
      const decryptedHeartRate = decryptpatient_info(patientData.averageheartrate);

      // Display patient metrics with decrypted heart rate
      document.getElementById("patientHeartRate").textContent = decryptedHeartRate || "Not Set";
      document.getElementById("patientHeight").textContent = patientData.height || "Not Set";
      document.getElementById("patientWeight").textContent = patientData.weight || "Not Set";
      document.getElementById("patientBloodType").textContent = patientData.bloodtype || "Not Set";

      // Check if the patient is logging in for the first time
      checkFirstLoginForPatient();
    } else {
      console.error("No patient name found in local storage.");
    }
  } catch (error) {
    console.error("Error retrieving patient data:", error);
  }
});

// Function to display the password change popup for patients
function showPasswordChangePopupForPatient(patientId) {
  console.log("Attempting to show password change popup for patient ID:", patientId);

  // Create and style the popup
  const popup = document.createElement("div");
  popup.id = "password-change-popup";
  popup.innerHTML = `
    <div class="popup-overlay">
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
        <button onclick="changePasswordForPatient(${patientId})">Change Password</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // CSS for styling the popup and overlay
  const style = document.createElement("style");
  style.innerHTML = `
    #password-change-popup {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000; /* Make sure it appears above all other elements */
    }
    .popup-content {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      width: 300px;
      max-width: 90%;
      text-align: center;
    }
    .popup-content h2 {
      margin-top: 0;
    }
    .password-container {
      position: relative;
      margin-top: 10px;
    }
    .password-container input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .password-container .fas {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
    }
    .error-text {
      color: red;
      font-size: 0.8em;
      margin-top: 5px;
      display: none;
    }
  `;
  document.head.appendChild(style);
}

function changePasswordForPatient(patientId) {
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const newPasswordError = document.getElementById("new-password-error");
  const confirmPasswordError = document.getElementById("confirm-password-error");

  // Clear previous errors
  newPasswordError.textContent = "";
  confirmPasswordError.textContent = "";

  // Validate the new password
  const validationError = validatePassword(newPassword);
  if (validationError) {
      newPasswordError.textContent = validationError;
      newPasswordError.style.display = "block";
      return;
  }

  // Check if passwords match
  if (newPassword !== confirmPassword) {
      confirmPasswordError.textContent = "Passwords do not match!";
      confirmPasswordError.style.display = "block";
      return;
  }

  const request = indexedDB.open('CareWellClinicDB', 1);

  request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('patients', 'readwrite');
      const store = transaction.objectStore('patients');

      const getRequest = store.get(patientId);

      getRequest.onsuccess = (event) => {
          const patient = event.target.result;
          if (patient) {
              // Encrypt the new password before storing it
              const encryptedPassword = encryptpatient_info(newPassword);
              patient.password = encryptedPassword;
              patient.first_login = false; // Set `first_login` to false after changing the password

              const updateRequest = store.put(patient);
              updateRequest.onsuccess = () => {
                  Swal.fire({
                      icon: 'success',
                      title: 'Password Changed',
                      text: 'Your password has been successfully updated!',
                      confirmButtonColor: '#00A8F0',
                      customClass: { popup: 'swal-popup-zindex' }
                  }).then(() => {
                      document.getElementById("password-change-popup").remove(); // Remove the popup
                  });
              };

              updateRequest.onerror = () => {
                  Swal.fire({
                      icon: 'error',
                      title: 'Update Failed',
                      text: 'Failed to update the password. Please try again.',
                      confirmButtonColor: '#f44336',
                      customClass: { popup: 'swal-popup-zindex' }
                  });
              };
          }
      };

      getRequest.onerror = () => {
          Swal.fire({
              icon: 'error',
              title: 'Database Error',
              text: 'Failed to retrieve patient information.',
              confirmButtonColor: '#f44336',
              customClass: { popup: 'swal-popup-zindex' }
          });
      };
  };

  request.onerror = () => {
      Swal.fire({
          icon: 'error',
          title: 'Database Error',
          text: 'Failed to connect to the database.',
          confirmButtonColor: '#f44336',
          customClass: { popup: 'swal-popup-zindex' }
      });
  };
}

// Utility function to validate password criteria
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

// Example Line Chart for Visit Frequency with whole numbers on Y-axis
const ctx = document.getElementById('visitChart').getContext('2d');
const visitChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['2021', '2023', '2024'], // Years
    datasets: [{
      label: 'Number of Visits',
      data: [1, 1, 3], // Number of visits in each year
      backgroundColor: 'rgba(133, 180, 218, 0.2)',
      borderColor: '#85b4da',
      borderWidth: 2,
      fill: true, // Fill under the line
      tension: 0.3 // Smooth curves
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        stepSize: 1, // Enforce whole numbers
        ticks: {
          precision: 0, // Display only whole numbers
        },
        title: {
          display: true,
          text: 'Number of Visits' // Y-axis title
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year' // X-axis title
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Visit Frequency Over Time' // Chart title
      }
    }
  }
});