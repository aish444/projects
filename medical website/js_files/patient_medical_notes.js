// Open CareWellClinicDB and return the database instance
async function openCareWellClinicDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("CareWellClinicDB", 1);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Failed to open CareWellClinicDB:", event);
            reject("Error opening CareWellClinicDB");
        };
    });
}

// Fetch doctor name based on doctor_id from the CareWellClinicDB
async function fetchDoctorName(doctorId) {
    return new Promise(async (resolve, reject) => {
        const db = await openCareWellClinicDB();
        const transaction = db.transaction("doctors", "readonly");
        const store = transaction.objectStore("doctors");
        const getRequest = store.get(parseInt(doctorId));

        getRequest.onsuccess = (event) => {
            const doctor = event.target.result;
            resolve(doctor ? `Dr. ${doctor.firstname} ${doctor.lastname}` : "Unknown Doctor");
        };

        getRequest.onerror = () => {
            console.error("Error retrieving doctor information.");
            resolve("Unknown Doctor");
        };
    });
}

// Display all medical notes for the logged-in patient
async function displayPatientMedicalNotes() {
    const patientId = parseInt(localStorage.getItem("loggedInPatientId"));
    const medicalNotesSection = document.querySelector(".medical-notes-section .notes");
    medicalNotesSection.innerHTML = ""; // Clear previous notes

    const db = await openCareWellClinicDB();
    const transaction = db.transaction("medicalnotes", "readonly");
    const store = transaction.objectStore("medicalnotes");
    
    // Use getAll() and filter by patient_id directly
    const request = store.getAll();

    request.onsuccess = async (event) => {
        const notes = event.target.result.filter(note => note.patient_id === patientId);
        notes.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

        if (notes.length > 0) {
            for (const note of notes) {
                let doctorName = "";
                if (note.doctor_id !== localStorage.getItem("loggedInDoctorId")) {
                    doctorName = await fetchDoctorName(note.doctor_id);
                }

                medicalNotesSection.innerHTML += `
                    <div class="note">
                        <p><strong>Date:</strong> ${note.date}</p>
                        ${doctorName ? `<p><strong>Doctor:</strong> ${doctorName}</p>` : ""}
                        <p><strong>Content:</strong> ${decryptMedicalNoteContent(note.note_content)}</p>
                    </div>
                    <hr>
                `;
            }
        } else {
            medicalNotesSection.innerHTML = "<p>No medical notes available.</p>";
        }
    };

    request.onerror = () => {
        console.error("Error fetching medical notes.");
        medicalNotesSection.innerHTML = "<p>Error loading medical notes.</p>";
    };
}

// Display all medical history entries for the logged-in patient
async function displayPatientMedicalHistory() {
    const patientId = parseInt(localStorage.getItem("loggedInPatientId"));
    const medicalHistorySection = document.querySelector(".my-history-section .history-timeline");

    if (!medicalHistorySection) {
        console.error("Medical history section not found in DOM.");
        return;
    }

    medicalHistorySection.innerHTML = ""; // Clear previous history entries

    const db = await openCareWellClinicDB();
    const transaction = db.transaction("medicalhistory", "readonly");
    const store = transaction.objectStore("medicalhistory");
    
    // Use getAll() and filter by patient_id directly
    const request = store.getAll();

    request.onsuccess = async (event) => {
        const histories = event.target.result.filter(history => history.patient_id === patientId);
        histories.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

        if (histories.length > 0) {
            for (const history of histories) {
                let doctorName = "";
                if (history.doctor_id !== localStorage.getItem("loggedInDoctorId")) {
                    doctorName = await fetchDoctorName(history.doctor_id);
                }

                medicalHistorySection.innerHTML += `
                    <div class="history-entry">
                        <p><strong>Date:</strong> ${history.date}</p>
                        <p><strong>Type:</strong> ${history.type.charAt(0).toUpperCase() + history.type.slice(1)}</p>
                        ${doctorName ? `<p><strong>Doctor:</strong> ${doctorName}</p>` : ""}
                        <p><strong>Details:</strong> ${decryptMedicalHistoryData(history.content)}</p>
                    </div>
                    <hr>
                `;
            }
        } else {
            medicalHistorySection.innerHTML = "<p>No medical history available.</p>";
        }
    };

    request.onerror = () => {
        console.error("Error fetching medical history.");
        medicalHistorySection.innerHTML = "<p>Error loading medical history.</p>";
    };
}

// Initialize display functions for notes and history on page load
document.addEventListener("DOMContentLoaded", () => {
    displayPatientMedicalNotes();
    displayPatientMedicalHistory();
});
