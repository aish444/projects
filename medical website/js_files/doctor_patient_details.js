// Function to open CareWellClinicDB and create object stores if needed
async function openCareWellClinicDB() {
    if (!window.careWellClinicDB) {
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
                    db.createObjectStore("prescriptions", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("medicalnotes")) {
                    const store = db.createObjectStore("medicalnotes", { keyPath: "id", autoIncrement: true });
                    store.createIndex("patient_id", "patient_id", { unique: false });
                    store.createIndex("doctor_id", "doctor_id", { unique: false });
                    store.createIndex("status", "status", { unique: false });
                }
                if (!db.objectStoreNames.contains("medicalhistory")) {
                    const store = db.createObjectStore("medicalhistory", { keyPath: "id", autoIncrement: true });
                    store.createIndex("patient_id", "patient_id", { unique: false });
                    store.createIndex("doctor_id", "doctor_id", { unique: false });
                    store.createIndex("type", "type", { unique: false });
                }
            };
            request.onsuccess = (event) => {
                window.careWellClinicDB = event.target.result;
                resolve();
            };
            request.onerror = () => reject("Error opening CareWellClinicDB");
        });
    }
    return Promise.resolve();
}

// Function to get patient details by ID
async function getPatientDetails(patientId) {
    await openCareWellClinicDB();
    return new Promise((resolve, reject) => {
        const transaction = careWellClinicDB.transaction("patients", "readonly");
        const store = transaction.objectStore("patients");
        const request = store.get(patientId);

        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject("Error retrieving patient data");
        };
    });
}

// Function to display patient details on the page
async function displayPatientDetails(patientId) {
    await openCareWellClinicDB();

    try {
        const patient = await getPatientDetails(patientId);

        if (!patient) {
            console.error("Patient not found");
            return;
        }

        document.getElementById("patient-title-name").textContent = `${patient.title} ${patient.firstname} ${patient.lastname}`;

        // Decrypt email, telephone, and average heart rate before displaying
        const decryptedEmail = decryptpatient_info(patient.email);
        const decryptedTelephone = decryptpatient_info(patient.telephone);
        const decryptedHeartRate = decryptpatient_info(patient.averageheartrate);

        document.getElementById("patient-info").innerHTML = `
            <p><strong>Email:</strong> ${decryptedEmail}</p>
            <p><strong>Telephone:</strong> ${decryptedTelephone}</p>
            <p><strong>Average Heart Rate:</strong> ${decryptedHeartRate}</p>
            <p><strong>Height:</strong> ${patient.height}</p>
            <p><strong>Weight:</strong> ${patient.weight}</p>
            <p><strong>Blood Type:</strong> ${patient.bloodtype}</p>
            <p><strong>NHS:</strong> ${patient.nhs}</p>
            <p><strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>DOB:</strong> ${patient.DOB}</p>
        `;
    } catch (error) {
        console.error("Error displaying patient details:", error);
    }
}

// Function to add a new medical note
async function addMedicalNote() {
    await openCareWellClinicDB();
    const doctorID = localStorage.getItem("loggedInDoctorId");
    const patientID = parseInt(new URLSearchParams(window.location.search).get("id"));
    const noteContent = document.getElementById("note-content").value.trim();
    const noteStatus = document.getElementById("note-status").value;
    const noteDate = new Date().toLocaleString();
    
    if (!noteContent) {
        alert("Please enter note content.");
        return;
    }

    const transaction = careWellClinicDB.transaction("medicalnotes", "readwrite");
    const store = transaction.objectStore("medicalnotes");
    
    const newNote = {
        doctor_id: doctorID,
        patient_id: patientID,
        note_content: encryptMedicalNoteContent(noteContent), // Encrypt note content
        status: noteStatus,
        date: noteDate
    };    

    store.add(newNote).onsuccess = () => {
        document.getElementById("note-form").reset();
        displayMedicalNotes(); // Refresh notes display
    };
}


// Function to display medical notes
async function displayMedicalNotes() {
    await openCareWellClinicDB();
    const doctorID = localStorage.getItem("loggedInDoctorId");
    const patientID = parseInt(new URLSearchParams(window.location.search).get("id"));
    const transaction = careWellClinicDB.transaction("medicalnotes", "readonly");
    const store = transaction.objectStore("medicalnotes");
    const request = store.openCursor();
    const notesContent = document.getElementById("notes-content");
    notesContent.innerHTML = ""; // Clear previous notes

    let notes = []; // Array to store notes for sorting

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const note = cursor.value;
            if (note.patient_id === patientID && (note.doctor_id === doctorID || note.status === "active")) {
                // Only fetch doctor names for notes added by another doctor with "active" status
                if (note.doctor_id !== doctorID && note.status === "active") {
                    note.needsDoctorName = true; // Mark that this note needs a doctor name
                }
                notes.push(note);
            }
            cursor.continue();
        } else {
            // Sort notes by date in descending order (latest to earliest)
            notes.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Fetch doctor names for notes that need it, then display all notes
            fetchDoctorNamesAndDisplayNotes(notes, notesContent);
        }
    };

    request.onerror = () => {
        console.error("Error fetching medical notes.");
        notesContent.innerHTML = "<p>Error loading medical notes.</p>";
    };
}

// Helper function to fetch doctor names and display notes
async function fetchDoctorNamesAndDisplayNotes(notes, notesContent) {
    await openCareWellClinicDB();
    const transaction = careWellClinicDB.transaction("doctors", "readonly");
    const doctorStore = transaction.objectStore("doctors");

    // Collect promises for fetching doctor names
    const fetchPromises = notes.map(note => {
        if (note.needsDoctorName) {
            // Fetch doctor data for notes that require it
            return new Promise(resolve => {
                const doctorRequest = doctorStore.get(parseInt(note.doctor_id));
                doctorRequest.onsuccess = () => {
                    const doctor = doctorRequest.result;
                    // Ensure firstname and lastname fields are not undefined
                    if (doctor && doctor.firstname && doctor.lastname) {
                        note.doctorName =`DR. ${doctor.firstname} ${doctor.lastname}`;
                    } else {
                        note.doctorName = "Unknown Doctor";
                    }
                    resolve();
                };
                doctorRequest.onerror = () => {
                    note.doctorName = "Unknown Doctor";
                    resolve();
                };
            });
        } else {
            // No need to fetch doctor name for this note
            note.doctorName = ""; 
            return Promise.resolve();
        }
    });

    // Wait until all doctor names are fetched
    await Promise.all(fetchPromises);

    // Display sorted notes after fetching all necessary doctor names
    if (notes.length > 0) {
        notes.forEach(note => {
            notesContent.innerHTML += 
                `<div class="note">
                    <p><strong>Date:</strong> ${note.date}</p>
                    <p><strong>Content:</strong> ${decryptMedicalNoteContent(note.note_content)}</p>
                    ${note.doctorName ? `<p><strong>Doctor:</strong> ${note.doctorName}</p>` : ""}
                </div>
                <hr>`;
        });
    } else {
        notesContent.innerHTML = "<p>No active medical notes available.</p>";
    }
}

// Event listener for the form submission
document.getElementById("note-form").addEventListener("submit", (event) => {
    event.preventDefault();
    addMedicalNote();
});

document.addEventListener("DOMContentLoaded", () => {
    const patientId = parseInt(new URLSearchParams(window.location.search).get("id"));
    if (patientId) {
        displayPatientDetails(patientId); // Display patient details
        displayMedicalNotes();           // Display medical notes
        displayMedicalHistory();          // Display medical history
    } else {
        console.error("No patient ID provided in the URL");
    }
});

// Function to open Medical History object store within CareWellClinicDB
async function openMedicalHistoryStore() {
    await openCareWellClinicDB();
    return careWellClinicDB.transaction("medicalhistory", "readwrite").objectStore("medicalhistory");
}

// Function to add a new history entry
async function addMedicalHistoryEntry() {
    await openCareWellClinicDB();
    const doctorID = localStorage.getItem("loggedInDoctorId");
    const patientID = parseInt(new URLSearchParams(window.location.search).get("id"));
    const historyContent = document.getElementById("history-content-input").value.trim();
    const historyType = document.getElementById("history-type").value;
    const historyDate = new Date().toLocaleString();

    if (!historyContent) {
        alert("Please enter history details.");
        return;
    }

    const transaction = careWellClinicDB.transaction("medicalhistory", "readwrite");
    const store = transaction.objectStore("medicalhistory");

    const historyEntry = {
        doctor_id: doctorID,
        patient_id: patientID,
        content: encryptMedicalHistoryData(historyContent), // Encrypt history content
        type: historyType,
        date: historyDate
    };    

    store.add(historyEntry).onsuccess = () => {
        document.getElementById("history-form").reset();
        displayMedicalHistory(); // Refresh history display
    };
}

// Function to display medical history entries
async function displayMedicalHistory() {
    await openCareWellClinicDB();
    const patientID = parseInt(new URLSearchParams(window.location.search).get("id"));
    const transaction = careWellClinicDB.transaction("medicalhistory", "readonly");
    const store = transaction.objectStore("medicalhistory");
    const request = store.openCursor();
    const historyContent = document.getElementById("history-content");

    if (!historyContent) {
        console.error("History content element not found.");
        return;
    }

    historyContent.innerHTML = ""; // Clear previous entries
    let histories = []; // Array to store history entries for sorting

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const history = cursor.value;
            if (history.patient_id === patientID) {
                history.needsDoctorName = true; // Mark that this history entry needs a doctor name
                histories.push(history); // Collect entries in array for sorting
            }
            cursor.continue();
        } else {
            // Sort entries by date in descending order (latest to earliest)
            histories.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Fetch doctor names for histories that need it, then display all histories
            fetchDoctorNamesAndDisplayHistories(histories, historyContent);
        }
    };

    request.onerror = () => {
        console.error("Error fetching medical history.");
        historyContent.innerHTML = "<p>Error loading medical history.</p>";
    };
}

// Helper function to fetch doctor names and display history entries
async function fetchDoctorNamesAndDisplayHistories(histories, historyContent) {
    await openCareWellClinicDB();
    const transaction = careWellClinicDB.transaction("doctors", "readonly");
    const doctorStore = transaction.objectStore("doctors");

    const fetchPromises = histories.map(history => {
        if (history.needsDoctorName) {
            return new Promise(resolve => {
                const doctorRequest = doctorStore.get(parseInt(history.doctor_id));
                doctorRequest.onsuccess = () => {
                    const doctor = doctorRequest.result;
                    if (doctor && doctor.firstname && doctor.lastname) {
                        history.doctorName = `Dr. ${doctor.firstname} ${doctor.lastname}`;
                    } else {
                        history.doctorName = "Unknown Doctor";
                    }
                    resolve();
                };
                doctorRequest.onerror = () => {
                    history.doctorName = "Unknown Doctor";
                    resolve();
                };
            });
        } else {
            history.doctorName = ""; 
            return Promise.resolve();
        }
    });

    await Promise.all(fetchPromises);

    if (histories.length > 0) {
        histories.forEach(history => {
            historyContent.innerHTML += `
                <div class="history-entry">
                    <p><strong>Date:</strong> ${history.date}</p>
                    <p><strong>Type:</strong> ${history.type.charAt(0).toUpperCase() + history.type.slice(1)}</p>
                    <p><strong>Details:</strong> ${decryptMedicalHistoryData(history.content)}</p>
                    ${history.doctorName ? `<p><strong>Added by:</strong> ${history.doctorName}</p>` : ""}
                </div>
                <hr>
            `;
        });
    } else {
        historyContent.innerHTML = "<p>No medical history available.</p>";
    }
}


document.getElementById("history-form").addEventListener("submit", (event) => {
    event.preventDefault();
    addMedicalHistoryEntry();
});