// Define the access map for each role
const accessMap = {
    frontpage: ['admin', 'doctor', 'patient'],
    login_page: ['admin', 'doctor', 'patient'],
    register_page: ['admin', 'doctor', 'patient'],
    admin_dashboard: ['admin'],
    admin_patient: ['admin'],
    patient_dashboard: ['patient'],
    patient_info: ['patient'],
    doctor_dashboard: ['doctor'],
    doctor_patient_details: ['doctor']
};

// Function to check if the user has access to the current page
function checkAccess(page) {
    const role = localStorage.getItem('userRole');
    const allowedRoles = accessMap[page];

    if (!allowedRoles.includes(role)) {
        // Clear localStorage to log the user out
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInAdmin');
        localStorage.removeItem('loggedInDoctorId');
        localStorage.removeItem('loggedInPatientId');

        // Create and display the overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'white';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);

        // Redirect to access denied page
        window.location.replace('access_denied.html');
    }
}
