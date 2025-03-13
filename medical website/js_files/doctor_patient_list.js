// Function to open CareWellClinicDB and set the global `db` variable if not already initialized
async function initializeDB() {
    if (!db) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("CareWellClinicDB", 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("patients")) {
                    db.createObjectStore("patients", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("appointments")) {
                    db.createObjectStore("appointments", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("prescriptions")) {
                    db.createObjectStore("prescriptions", { keyPath: "pres_id", autoIncrement: true });
                }
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("CareWellClinicDB initialized.");
                resolve();
            };
            request.onerror = (event) => {
                console.error("Failed to open CareWellClinicDB:", event.target.error);
                reject("Failed to open CareWellClinicDB");
            };
        });
    }
    return Promise.resolve();
}

// Display only patients who have accepted appointments or approved prescriptions with the logged-in doctor
async function displayAcceptedPatientCards() {
    const patientContainer = document.querySelector(".patient-container");
    patientContainer.innerHTML = ""; // Clear any existing patient cards

    const acceptedPatients = await getAcceptedPatientsWithDoctor();

    if (acceptedPatients.length === 0) {
        patientContainer.innerHTML = "<p>No patients with accepted appointments or prescriptions.</p>";
        return;
    }

    // Create patient cards for each accepted patient
    acceptedPatients.forEach(patient => {
        const patientCard = document.createElement("div");
        patientCard.classList.add("patient-card");
        patientCard.innerHTML = `
            <img src="/assets/gifs/patientprof.gif" alt="Patient Image" class="patient-img">
            <p><strong>${patient.firstname} ${patient.lastname}</strong></p>
        `;

        // Add click event to navigate to the detailed view
        patientCard.addEventListener("click", () => {
            window.location.href = `doctor_patient_details.html?id=${patient.id}`;
        });

        patientContainer.appendChild(patientCard);
    });
}

// Get patients with accepted appointments or approved prescriptions for the logged-in doctor
async function getAcceptedPatientsWithDoctor() {
    const acceptedPatientIds = new Set();
    const doctorId = Number(localStorage.getItem("loggedInDoctorId")); // Retrieve logged-in doctor ID

    // Get patients with accepted appointments for the logged-in doctor
    const appointmentsTransaction = db.transaction("appointments", "readonly");
    const appointmentsStore = appointmentsTransaction.objectStore("appointments");
    await new Promise(resolve => {
        appointmentsStore.openCursor().onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const appointment = cursor.value;
                // Check if the appointment is accepted and matches the logged-in doctor
                if (appointment.status === "Accepted" && appointment.doctor_id === doctorId) {
                    acceptedPatientIds.add(appointment.patient_id);
                }
                cursor.continue();
            } else {
                resolve();
            }
        };
    });

    // Get patients with approved prescriptions for the logged-in doctor
    const prescriptionsTransaction = db.transaction("prescriptions", "readonly");
    const prescriptionsStore = prescriptionsTransaction.objectStore("prescriptions");
    await new Promise(resolve => {
        prescriptionsStore.openCursor().onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const prescription = cursor.value;
                // Check if the prescription is approved and matches the logged-in doctor
                if (prescription.status === "Approved" && prescription.doctor_id === doctorId) {
                    acceptedPatientIds.add(prescription.patient_id);
                }
                cursor.continue();
            } else {
                resolve();
            }
        };
    });

    // Fetch patient details based on the accepted patient IDs
    const patients = [];
    const patientTransaction = db.transaction("patients", "readonly");
    const patientStore = patientTransaction.objectStore("patients");
    for (const patientId of acceptedPatientIds) {
        const patientData = await new Promise((resolve, reject) => {
            const request = patientStore.get(patientId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error retrieving patient data");
        });
        if (patientData) patients.push(patientData);
    }

    return patients;
}

// Initialize databases and display patient cards on page load
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeDB();
        displayAcceptedPatientCards();
    } catch (error) {
        console.error("Error displaying accepted patient cards:", error);
    }
});