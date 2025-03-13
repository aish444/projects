// Initialize Prescription Database for Doctor
function initializePrescriptionDB() {
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('prescriptions')) {
            const prescriptionStore = db.createObjectStore('prescriptions', { keyPath: 'pres_id', autoIncrement: true });
            prescriptionStore.createIndex('status', 'status', { unique: false });
        }
    };

    request.onsuccess = function () {
        console.log('CareWellClinicDB initialized for doctor.');
        displayPrescriptionRequests(); // Display prescriptions specific to the doctor
        displayApprovedPrescriptions(); // Display approved prescriptions
        updatePendingPrescriptionCount(); // Update the pending prescription count
    };

    request.onerror = function (event) {
        console.error('Error initializing CareWellClinicDB:', event.target.error);
    };
}

// Display Prescription Requests for the Doctor
async function displayPrescriptionRequests() {
    const loggedInDoctorId = parseInt(localStorage.getItem('loggedInDoctorId'));
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = async function (event) {
        const db = event.target.result;
        const transaction = db.transaction('prescriptions', 'readonly');
        const store = transaction.objectStore('prescriptions');
        const getAllPrescriptions = store.getAll();

        getAllPrescriptions.onsuccess = async function () {
            const prescriptions = getAllPrescriptions.result;
            const prescriptionsContainer = document.getElementById('prescription-tbody');
            prescriptionsContainer.innerHTML = ""; // Clear existing rows

            // Filter prescriptions for the logged-in doctor that are pending (not approved or rejected)
            const doctorPrescriptions = prescriptions.filter(prescription =>
                prescription.doctor_id === loggedInDoctorId && prescription.status === 'Pending'
            );

            if (doctorPrescriptions.length === 0) {
                prescriptionsContainer.innerHTML = "<tr><td colspan='4'>No prescription requests available.</td></tr>";
            } else {
                for (const prescription of doctorPrescriptions) {
                    const patientName = await getPatientName(prescription.patient_id, db);
                    const decryptedDrugName = decryptMedicalHistoryData(prescription.drug_name); // Decrypt drug name

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <a href="doctor_patient_details.html?id=${prescription.patient_id}" target="_blank">${patientName}</a>
                        </td>
                        <td>${prescription.reason || "Not Specified"}</td>
                        <td>${decryptedDrugName}</td> <!-- Use decrypted drug name -->
                        <td>
                            <button class="accept-btn">Approve</button>
                            <button class="reject-btn"><i class="fas fa-trash"></i></button>
                        </td>
                    `;

                    // Add event listeners to the buttons
                    const approveButton = row.querySelector('.accept-btn');
                    const rejectButton = row.querySelector('.reject-btn');

                    approveButton.addEventListener('click', () => {
                        updatePrescriptionStatus(prescription.id, 'Approved');
                    });

                    rejectButton.addEventListener('click', () => {
                        confirmRejectPrescription(prescription.id);
                    });

                    prescriptionsContainer.appendChild(row);
                }
            }
        };
    };
}


// Retrieve Patient Name from Patients Object Store
function getPatientName(patient_id, db) {
    return new Promise((resolve) => {
        const transaction = db.transaction('patients', 'readonly');
        const store = transaction.objectStore('patients');
        const request = store.get(patient_id);

        request.onsuccess = function () {
            const patient = request.result;
            if (patient) {
                resolve(`${patient.firstname} ${patient.lastname}`);
            } else {
                resolve("Unknown Patient");
            }
        };

        request.onerror = function () {
            console.error("Failed to retrieve patient information.");
            resolve("Unknown Patient");
        };
    });
}

// Display Approved Prescriptions
async function displayApprovedPrescriptions() {
    const loggedInDoctorId = parseInt(localStorage.getItem('loggedInDoctorId'));
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = async function (event) {
        const db = event.target.result;
        const transaction = db.transaction('prescriptions', 'readonly');
        const store = transaction.objectStore('prescriptions');
        const getAllPrescriptions = store.getAll();

        getAllPrescriptions.onsuccess = async function () {
            const prescriptions = getAllPrescriptions.result;
            const approvedContainer = document.getElementById('approved-prescriptions').querySelector('.prescription-list');
            approvedContainer.innerHTML = ""; // Clear existing approved prescriptions

            // Filter approved prescriptions for the logged-in doctor
            const approvedPrescriptions = prescriptions.filter(prescription =>
                prescription.doctor_id === loggedInDoctorId && prescription.status === 'Approved'
            );

            if (approvedPrescriptions.length === 0) {
                approvedContainer.innerHTML = "<p>No approved prescriptions available.</p>";
            } else {
                for (const prescription of approvedPrescriptions) {
                    const patientName = await getPatientName(prescription.patient_id, db);
                    const decryptedDrugName = decryptMedicalHistoryData(prescription.drug_name); // Decrypt drug name

                    const prescriptionElement = document.createElement('div');
                    prescriptionElement.classList.add('appointment'); // Reuse "appointment" class for styling
                    prescriptionElement.innerHTML = `
                        <img src="/assets/gifs/patientprof.gif" alt="Patient Image" class="patient-img">
                        <div>
                            <p><strong>${patientName}</strong></p>
                            <p><strong>Medicine:</strong> <span class="circle-background">${decryptedDrugName}</span></p> <!-- Use decrypted drug name -->
                            <p><strong>Reason:</strong> ${prescription.reason || "Not Specified"}</p>
                        </div>
                    `;
                    approvedContainer.appendChild(prescriptionElement);
                }
            }
        };
    };
}


// Function to confirm and update prescription status to "Rejected" with SweetAlert
function confirmRejectPrescription(pres_id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to reject this prescription request?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, reject it!'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePrescriptionStatus(pres_id, "Rejected")
                .then(() => {
                    displayPrescriptionRequests(); // Refresh the prescription requests list after rejection
                    updatePendingPrescriptionCount(); // Update pending count
                })
                .catch(error => {
                    console.error("Failed to reject the prescription:", error);
                });
        }
    });
}

// Update Prescription Status and Refresh Lists
function updatePrescriptionStatus(pres_id, newStatus) {
    return new Promise((resolve, reject) => {
        if (!pres_id) {
            console.error("Prescription ID is undefined or null.");
            reject("Prescription ID is required");
            return;
        }

        const request = indexedDB.open('CareWellClinicDB', 1);

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction('prescriptions', 'readwrite');
            const store = transaction.objectStore('prescriptions');

            const getRequest = store.get(pres_id);

            getRequest.onsuccess = function (event) {
                const prescription = event.target.result;
                if (prescription) {
                    prescription.status = newStatus;
                    const updateRequest = store.put(prescription);

                    updateRequest.onsuccess = function () {
                        console.log(`Prescription ${pres_id} updated to ${newStatus}`);

                        // Refresh the lists and provide feedback
                        displayPrescriptionRequests();
                        displayApprovedPrescriptions();
                        updatePendingPrescriptionCount();

                        // Show success notification
                        Swal.fire({
                            icon: newStatus === 'Approved' ? 'success' : 'error',
                            title: newStatus === 'Approved' ? 'Approved!' : 'Rejected',
                            text: `The prescription request has been ${newStatus.toLowerCase()}.`,
                            confirmButtonColor: newStatus === 'Approved' ? '#00A8F0' : '#f44336'
                        });

                        resolve(); // Confirm status update
                    };

                    updateRequest.onerror = function () {
                        console.error("Error updating prescription status.");
                        reject("Failed to update prescription status");
                    };
                } else {
                    reject("Prescription not found");
                }
            };

            getRequest.onerror = function () {
                console.error("Error fetching prescription to update status.");
                reject("Error fetching prescription");
            };
        };

        request.onerror = function (event) {
            console.error('Error opening CareWellClinicDB:', event.target.error);
            reject("Database error");
        };
    });
}



// Update Pending Prescription Count
function updatePendingPrescriptionCount() {
    const loggedInDoctorId = parseInt(localStorage.getItem('loggedInDoctorId'));
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('prescriptions', 'readonly');
        const store = transaction.objectStore('prescriptions');
        const getAllPrescriptions = store.getAll();

        getAllPrescriptions.onsuccess = function () {
            const prescriptions = getAllPrescriptions.result;

            // Filter prescriptions for the logged-in doctor that are pending
            const pendingPrescriptions = prescriptions.filter(prescription =>
                prescription.doctor_id === loggedInDoctorId && prescription.status === 'Pending'
            );

            // Update the stats box with the count
            document.getElementById('prescription-pending-count').textContent = pendingPrescriptions.length;
        };
    };
}

// Initialize the Prescription DB on page load
document.addEventListener("DOMContentLoaded", () => {
    initializePrescriptionDB();
});
