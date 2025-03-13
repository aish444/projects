// Function to initialize CareWellClinicDB if prescriptions object store needs an upgrade
function initializeCareWellClinicDB() {
    const request = indexedDB.open('CareWellClinicDB', 1); // Use version 1 if already created

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('prescriptions')) {
            const prescriptionStore = db.createObjectStore('prescriptions', { keyPath: 'pres_id', autoIncrement: true });
            prescriptionStore.createIndex('drug_id', 'drug_id', { unique: false });
            prescriptionStore.createIndex('drug_name', 'drug_name', { unique: false });
            prescriptionStore.createIndex('patient_id', 'patient_id', { unique: false });
            prescriptionStore.createIndex('doctor_id', 'doctor_id', { unique: false });
            prescriptionStore.createIndex('status', 'status', { unique: false });
            prescriptionStore.createIndex('reason', 'reason', { unique: false }); // Add reason index
        }
    };

    request.onsuccess = function (event) {
        console.log('CareWellClinicDB initialized successfully.');
        populatePrescriptionDropdown(); // Populate the prescription dropdown
        populateReasonDropdown(); // Populate the reason dropdown
        displayPrescriptionCards(); // Display the prescriptions
    };

    request.onerror = function (event) {
        console.error('Error initializing CareWellClinicDB:', event.target.error);
    };
}

// Populate Prescription Dropdown from CareWellClinicDB's medicines store
function populatePrescriptionDropdown() {
    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('medicines', 'readonly');
        const store = transaction.objectStore('medicines');
        const getAllMedicines = store.getAll();

        getAllMedicines.onsuccess = function () {
            const medicines = getAllMedicines.result;
            const prescriptionSelect = document.getElementById('prescription-name');
            prescriptionSelect.innerHTML = '<option value="" disabled selected>-- Select Prescription --</option>'; // Clear and add default option

            medicines.forEach(medicine => {
                const option = document.createElement('option');
                option.value = medicine.id;
                option.textContent = decryptMedicalHistoryData(medicine.drug_name); // Decrypt drug_name before display
                prescriptionSelect.appendChild(option);
            });
        };

        getAllMedicines.onerror = function () {
            console.error("Failed to retrieve medicines from CareWellClinicDB.");
        };
    };

    request.onerror = function (event) {
        console.error('Error opening CareWellClinicDB for medicines dropdown:', event.target.error);
    };
}


// Function to populate the Reason dropdown with static options
function populateReasonDropdown() {
    const reasons = [
        "Headache", "Stomach Ache", "Back Pain", "Muscle Pain", "Fever", "Cold", "Cough", 
        "Allergies", "Asthma", "High Blood Pressure", "Heart Ache", "Insomnia", "Eczema", 
        "Depression", "Anxiety", "Skin Rash", "Eye Infection", "Ear Infection", "Toothache", "Other"
    ];

    const reasonSelect = document.getElementById('reason');
    reasonSelect.innerHTML = '<option value="" disabled selected>-- Select Reason --</option>';

    reasons.forEach(reason => {
        const option = document.createElement('option');
        option.value = reason;
        option.textContent = reason;
        reasonSelect.appendChild(option);
    });
}

// Function to add a prescription
function addPrescription() {
    const drugSelect = document.getElementById('prescription-name');
    const reasonSelect = document.getElementById('reason');
    const doctorSelect = document.getElementById('doctor-prescription'); // Get doctor dropdown
    const patientId = localStorage.getItem('loggedInPatientId'); // Retrieved from localStorage

    const drug_id = drugSelect.value;
    const drug_name = drugSelect.options[drugSelect.selectedIndex]?.text || "";
    const reason = reasonSelect.value;
    const doctor_id = Number(doctorSelect.value); // Get selected doctor_id

    // Check if all required fields are selected
    if (!patientId || !drug_id || !reason || !doctor_id) {
        alert("Please select all fields.");
        return;
    }

    const request = indexedDB.open('CareWellClinicDB', 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('prescriptions', 'readwrite');
        const store = transaction.objectStore('prescriptions');

        store.add({
            drug_id: parseInt(drug_id),
            drug_name: encryptMedicalHistoryData(drug_name), // Encrypt drug_name before storing
            patient_id: parseInt(patientId),
            doctor_id: doctor_id, // Save the selected doctor_id
            reason: reason,
            status: "Pending"
        });

        transaction.oncomplete = () => {
            Swal.fire({
                icon: 'success',
                title: 'Prescription Sent',
                text: 'Your prescription has been successfully sent.',
                confirmButtonColor: '#6ba8e9'
            });

            // Reset dropdowns to default values
            reasonSelect.selectedIndex = 0;
            drugSelect.selectedIndex = 0;
            doctorSelect.selectedIndex = 0;

            displayPrescriptionCards(); // Update the displayed list
        };

        transaction.onerror = (event) => {
            console.error("Error sending prescription:", event.target.error);
        };
    };
}

// Display prescriptions with doctor name fallback
function displayPrescriptionCards() {
    const request = indexedDB.open('CareWellClinicDB', 1);
    const loggedInPatientId = parseInt(localStorage.getItem('loggedInPatientId'), 10);
    const loggedInDoctorId = parseInt(localStorage.getItem('loggedInDoctorId'), 10);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('prescriptions', 'readonly');
        const store = transaction.objectStore('prescriptions');
        const getAllPrescriptions = store.getAll();

        getAllPrescriptions.onsuccess = function () {
            const prescriptions = getAllPrescriptions.result;
            const prescriptionsContainer = document.getElementById('prescriptions-container');
            prescriptionsContainer.innerHTML = "";

            const filteredPrescriptions = prescriptions.filter(prescription => {
                if (loggedInPatientId) {
                    return prescription.patient_id === loggedInPatientId;
                } else if (loggedInDoctorId) {
                    return prescription.doctor_id === loggedInDoctorId;
                }
                return false;
            });

            if (filteredPrescriptions.length === 0) {
                prescriptionsContainer.innerHTML = "<p>No prescriptions available.</p>";
            } else {
                filteredPrescriptions.forEach(prescription => {
                    const doctorRequest = indexedDB.open("CareWellClinicDB", 1);

                    doctorRequest.onsuccess = function (event) {
                        const doctorDB = event.target.result;
                        const doctorTransaction = doctorDB.transaction("doctors", "readonly");
                        const doctorStore = doctorTransaction.objectStore("doctors");

                        const doctorLookup = doctorStore.get(prescription.doctor_id);

                        doctorLookup.onsuccess = function (event) {
                            const doctor = event.target.result;
                            const doctorName = doctor ? `Dr. ${doctor.firstname} ${doctor.lastname}` : "Doctor Not Found";

                            const prescriptionCard = document.createElement('div');
                            prescriptionCard.classList.add('prescription-card');
                            prescriptionCard.innerHTML = `
                                <h4>Drug Name: ${decryptMedicalHistoryData(prescription.drug_name)}</h4> <!-- Decrypt drug_name here -->
                                <p>Doctor: ${doctorName}</p>
                                <p>Reason: ${prescription.reason}</p>
                                <p>Status: ${prescription.status}</p>
                            `;

                            prescriptionsContainer.appendChild(prescriptionCard);
                        };

                        doctorLookup.onerror = function () {
                            console.error("Failed to retrieve doctor information for doctor_id:", prescription.doctor_id);
                        };
                    };

                    doctorRequest.onerror = function () {
                        console.error("Failed to open CareWellClinicDB for doctor lookup.");
                    };
                });
            }
        };

        getAllPrescriptions.onerror = function () {
            console.error("Failed to retrieve prescriptions from CareWellClinicDB.");
        };
    };

    request.onerror = function (event) {
        console.error('Error opening CareWellClinicDB for prescriptions display:', event.target.error);
    };
}


// Event listener for prescription form submission
document.getElementById("prescriptionForm").addEventListener("submit", function (e) {
    e.preventDefault();
    addPrescription();
});

// Call initializeCareWellClinicDB on page load
document.addEventListener("DOMContentLoaded", () => {
    initializeCareWellClinicDB();
});
