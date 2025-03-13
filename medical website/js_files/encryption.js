// Define the encryption key for doctor-specific data
const DoctorEncryptionKey = "Z#3k$7hD=2!xFgV8^w&N@Yb_6PzA*TqR%Lc4M"; // Ensure this key is the same everywhere

// Define the encryption key for admin-specific data
const AdminEncryptionKey = "/Mnes=OWO#bMb^6ZN=}P#51v76K{A3V@"; // Ensure this key is consistent across admin files

// Define the encryption key for patient-specific data
const PatientEncryptionKey = "P#7^r@L9!t$F2#4&b8Zw$eYj3*MpT5qC"; // New key for patient data

// Define the encryption key for medical notes data
const MedicalNotesEncryptionKey = "R@#l9$N3m&Z1!sT6Y^xF4P7*qw8D%CvQ"; // Key for encrypting medical notes content

// Define the encryption key for medical history data
const MedicalHistoryEncryptionKey = "T8#r^D4!sM@x&Yz9L*P6Qw%V3JfNc3Bk"; // New key for medical history data

// Function to encrypt sensitive data for doctors
function encryptDoctorData(data) {
    return data ? CryptoJS.AES.encrypt(data, DoctorEncryptionKey).toString() : "";
}

// Function to decrypt sensitive data for doctors
function decryptDoctorData(encryptedData) {
    try {
        if (!encryptedData) return ""; // Check for empty input
        const bytes = CryptoJS.AES.decrypt(encryptedData, DoctorEncryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed for Doctor data. Data might not be encrypted:", error);
        return ""; // Return empty if decryption fails
    }
}

// Function to encrypt sensitive data for admins
function encryptAdminData(data) {
    return data ? CryptoJS.AES.encrypt(data, AdminEncryptionKey).toString() : "";
}

// Function to decrypt sensitive data for admins
function decryptAdminData(cipherText) {
    try {
        if (!cipherText) return ""; // Check for empty input
        const bytes = CryptoJS.AES.decrypt(cipherText, AdminEncryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed for Admin data. Data might not be encrypted correctly:", error);
        return ""; // Return empty if decryption fails
    }
}

// Function to encrypt sensitive data for patients
function encryptpatient_info(data) {
    return data ? CryptoJS.AES.encrypt(data, PatientEncryptionKey).toString() : "";
}

// Function to decrypt sensitive data for patients
function decryptpatient_info(encryptedData) {
    try {
        if (!encryptedData) return ""; // Check for empty input
        const bytes = CryptoJS.AES.decrypt(encryptedData, PatientEncryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed for Patient data. Data might not be encrypted:", error);
        return ""; // Return empty if decryption fails
    }
}

// Function to encrypt sensitive data for medical notes
function encryptMedicalNoteContent(data) {
    return data ? CryptoJS.AES.encrypt(data, MedicalNotesEncryptionKey).toString() : "";
}

// Function to decrypt sensitive data for medical notes
function decryptMedicalNoteContent(encryptedData) {
    try {
        if (!encryptedData) return ""; // Check for empty input
        const bytes = CryptoJS.AES.decrypt(encryptedData, MedicalNotesEncryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed for Medical Note data. Data might not be encrypted:", error);
        return ""; // Return empty if decryption fails
    }
}

// Function to encrypt sensitive data for medical history
function encryptMedicalHistoryData(data) {
    return data ? CryptoJS.AES.encrypt(data, MedicalHistoryEncryptionKey).toString() : "";
}

// Function to decrypt sensitive data for medical history
function decryptMedicalHistoryData(encryptedData) {
    try {
        if (!encryptedData) return ""; // Check for empty input
        const bytes = CryptoJS.AES.decrypt(encryptedData, MedicalHistoryEncryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed for Medical History data. Data might not be encrypted:", error);
        return ""; // Return empty if decryption fails
    }
}
