// Initialize CareWellClinicDB with multiple object stores
function initCareWellClinicDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CareWellClinicDB', 1);

        request.onerror = (event) => reject('Error opening CareWellClinicDB:', event);
        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const stores = [
                { name: 'admins', keyPath: 'username' },
                { name: 'patients', keyPath: 'id', autoIncrement: true },
                { name: 'doctors', keyPath: 'id', autoIncrement: true },
                { name: 'appointments', keyPath: 'id', autoIncrement: true },
                { name: 'prescriptions', keyPath: 'id', autoIncrement: true },
                { name: 'medicalnotes', keyPath: 'id', autoIncrement: true },
                { name: 'medicalhistory', keyPath: 'id', autoIncrement: true },
                { name: 'medicines', keyPath: 'id', autoIncrement: true }
            ];

            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath, autoIncrement: store.autoIncrement || false });
                    console.log(`Object store "${store.name}" created`);
                }
            });
        };
    });
}

// Load data from JSON files and populate DB if empty
function loadDataFromJSON() {
    const jsonFiles = {
        '/json_files/admin.json': { 
            store: 'admins', 
            mapper: item => ({ 
                username: item.username, 
                password: encryptAdminData(item.password || 'Not Set') // Encrypt admin password
            }) 
        },
        '/json_files/doctors.json': { 
            store: 'doctors', 
            mapper: item => ({
                id: item.id, 
                address: encryptDoctorData(item.Address || 'Not Set'), // Encrypt address
                telephone: encryptDoctorData(item.Telephone || 'Not Set'), // Encrypt telephone
                email: encryptDoctorData(item.email || 'Not Set'), // Encrypt email
                firstLogin: true, 
                firstname: item.first_name || 'Not Set', 
                lastname: item.last_name || 'Not Set',
                gender: item.gender || 'Not Set', 
                password: encryptDoctorData(`${item.first_name.toLowerCase()}123`) // Encrypt password
            }) 
        },
        '/json_files/patients.json': { 
            store: 'patients', 
            mapper: item => ({
                id: item.id, 
                nhs: item.NHS || 'Not Set', 
                title: item.Title || 'Not Set', 
                firstname: item.First || 'Not Set',
                lastname: item.Last || 'Not Set', 
                address: encryptpatient_info(item.Address || 'Not Set'), // Encrypt address
                averageheartrate: encryptpatient_info('Not Set'), // Encrypt average heart rate
                bloodtype: 'Not Set',
                DOB: item.DOB || 'Not Set', 
                email: encryptpatient_info(item.Email || 'Not Set'), // Encrypt email
                weight: 'Not Set', 
                height: 'Not Set',
                gender: item.Gender || 'Not Set', 
                telephone: encryptpatient_info(item.Telephone || 'Not Set'), // Encrypt telephone
                password: encryptpatient_info(`${item.First}2024!`), // Encrypt password
                first_login: true
            }) 
        },
        '/json_files/medicines.json': { 
            store: 'medicines', 
            mapper: item => {
                const ingredient = item.Drug || 'Not Set';
                let drugName;

                const words = ingredient.split(',').map(w => w.trim());
                if (words.length > 3) {
                    drugName = `${words[0]} Mixture`;
                } else {
                    drugName = ingredient;
                }

                return {
                    id: item.id,
                    drug_name: encryptMedicalHistoryData(drugName), // Encrypt drug name
                    ingredient: ingredient // Keep the full ingredient list in the "ingredient" field
                };
            }
        }
    };

    for (const [jsonFile, { store, mapper }] of Object.entries(jsonFiles)) {
        fetchDataAndStore(jsonFile, store, mapper);
    }
}


// Function to fetch JSON data and populate IndexedDB with specified mapper
function fetchDataAndStore(jsonFile, storeName, mapper) {
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            initCareWellClinicDB().then(db => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const countRequest = store.count();

                countRequest.onsuccess = () => {
                    if (countRequest.result === 0) { // Only populate if store is empty
                        data.forEach(item => store.put(mapper(item)));
                        console.log(`${storeName} populated with data from ${jsonFile}`);
                    } else {
                        console.log(`${storeName} already contains data, skipping JSON import.`);
                    }
                };
            });
        })
        .catch(error => console.error(`Error fetching data from ${jsonFile}:`, error));
}

// CRUD Operations with Encryption
function addMedicalNote(doctorId, patientId, content) {
    initCareWellClinicDB().then(db => {
        const transaction = db.transaction('medicalnotes', 'readwrite');
        const store = transaction.objectStore('medicalnotes');
        store.add({ 
            doctor_id: doctorId, 
            patient_id: patientId, 
            note_content: encryptMedicalNoteContent(content), // Encrypt note content
            date: new Date().toISOString(), 
            status: 'active' 
        });
    });
}

function addMedicalHistory(doctorId, patientId, content, type) {
    initCareWellClinicDB().then(db => {
        const transaction = db.transaction('medicalhistory', 'readwrite');
        const store = transaction.objectStore('medicalhistory');
        store.add({ 
            doctor_id: doctorId, 
            patient_id: patientId, 
            content: encryptMedicalHistoryData(content), // Encrypt content
            type, 
            date: new Date().toISOString() 
        });
    });
}

function addPrescription(doctorId, patientId, drugId, drugName, reason, status = 'Pending') {
    initCareWellClinicDB().then(db => {
        const transaction = db.transaction('prescriptions', 'readwrite');
        const store = transaction.objectStore('prescriptions');
        store.add({ 
            doctor_id: doctorId, 
            patient_id: patientId, 
            drug_id: drugId, 
            drug_name: encryptMedicalHistoryData(drugName), // Encrypt drug name
            reason, 
            status 
        });
    });
}

// Load initial data from JSON on page load
document.addEventListener("DOMContentLoaded", () => {
    initCareWellClinicDB().then(loadDataFromJSON); // Initialize and load data
});
