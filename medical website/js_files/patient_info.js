// Define the database name and version
const dbName = "CareWellClinicDB";
const dbVersion = 1;
let db;

// Function to initialize the IndexedDB connection for the patient database
function initPatientIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onsuccess = function (event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function (event) {
            console.error("Error opening IndexedDB for patients:", event);
            reject("Error opening IndexedDB");
        };
    });
}

// Function to retrieve and display the logged-in patient's information
function getLoggedInPatientData() {
    return new Promise((resolve, reject) => {
        initPatientIndexedDB().then(db => {
            const transaction = db.transaction("patients", "readonly");
            const objectStore = transaction.objectStore("patients");
            const request = objectStore.getAll();

            request.onsuccess = function (event) {
                const patients = event.target.result;
                const firstName = localStorage.getItem("loggedInPatientFirstName");
                const lastName = localStorage.getItem("loggedInPatientLastName");
                
                const patient = patients.find(p => p.firstname === firstName && p.lastname === lastName);
                
                if (patient) {
                    displayPatientData(patient);
                    resolve(patient);
                } else {
                    console.error("Patient not found in database.");
                    reject("Patient not found");
                }
            };

            request.onerror = function () {
                console.error("Error accessing IndexedDB");
                reject("Error accessing IndexedDB");
            };
        });
    });
}

// Function to display the patient data in the HTML fields
function displayPatientData(patient) {
    document.getElementById("patient-id").value = patient.id;
    document.getElementById("nhs-number").value = patient.nhs;
    document.getElementById("title").value = patient.title;
    document.getElementById("first-name").value = patient.firstname;
    document.getElementById("last-name").value = patient.lastname;
    document.getElementById("dob").value = patient.DOB;
    document.getElementById("gender").value = patient.gender;
    document.getElementById("address").value = decryptpatient_info(patient.address);  // Decrypt address
    document.getElementById("email").value = decryptpatient_info(patient.email);      // Decrypt email
    document.getElementById("telephone").value = decryptpatient_info(patient.telephone);  // Decrypt telephone
    document.getElementById("average-heart-rate").value = decryptpatient_info(patient.averageheartrate);  // Decrypt heart rate
    document.getElementById("height").value = patient.height;
    document.getElementById("weight").value = patient.weight;
    document.getElementById("blood-type").value = patient.bloodtype;
}

// Initialize and fetch patient data when the page loads
window.onload = function () {
    getLoggedInPatientData().catch(error => console.error("Error loading patient data:", error));
};
