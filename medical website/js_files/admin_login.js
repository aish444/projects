// Function to initialize IndexedDB for accessing the 'admins' object store
function getAdminDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CareWellClinicDB', 1);

        request.onerror = (event) => {
            console.error('Error opening CareWellClinicDB:', event);
            reject('Error opening CareWellClinicDB');
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

// Function to check admin login credentials
function checkAdminCredentials(inputUsername, inputPassword) {
    return new Promise((resolve, reject) => {
        getAdminDB().then(db => {
            const transaction = db.transaction(['admins'], 'readonly');
            const adminStore = transaction.objectStore('admins');
            const request = adminStore.get(inputUsername);

            request.onsuccess = (event) => {
                const adminRecord = event.target.result;

                // Decrypt the stored password and compare it with the input password
                if (adminRecord) {
                    const decryptedPassword = decryptAdminData(adminRecord.password); // Decrypt stored password
                    if (decryptedPassword === inputPassword) {
                        resolve(true);
                    } else {
                        resolve(false); // Return false if credentials don't match
                    }
                } else {
                    resolve(false); // Return false if no record found
                }
            };

            request.onerror = () => {
                reject('Error accessing Admin IndexedDB');
            };

        }).catch(error => reject(error));
    });
}

// Function to sanitize input
function sanitizeAdminInput(input) {
    const sanitized = input.replace(/[^\w\s-]/gi, ''); // Allow only alphanumeric, hyphen, underscore, and spaces
    return sanitized.trim(); // Trim leading/trailing spaces
}

document.addEventListener("DOMContentLoaded", function () {
    const adminForm = document.getElementById("admin-login-form");

    if (adminForm) {
        adminForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent the form from submitting normally

            let username = document.getElementById('admin-username').value;
            let password = document.getElementById('admin-password').value;

            // Sanitize the inputs
            username = sanitizeAdminInput(username);
            password = sanitizeAdminInput(password);

            checkAdminCredentials(username, password).then(isValid => {
                if (isValid) {
                    localStorage.setItem('loggedInAdmin', username);
                    localStorage.setItem('userRole', 'admin'); // Set user role to 'admin'
                    alert('Login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'admin_dashboard.html';
                    }, 2000);
                } else {
                    alert('Invalid username or password!');
                }
            }).catch(error => {
                alert('An error occurred: ' + error);
            });
        });
    } else {
        console.error("Admin login form not found!");
    }
});

// Function to add a new admin with an encrypted password (for demonstration)
function addAdmin(username, password) {
    getAdminDB().then(db => {
        const transaction = db.transaction(['admins'], 'readwrite');
        const adminStore = transaction.objectStore('admins');

        // Encrypt the password before storing
        const encryptedPassword = encryptAdminData(password);

        adminStore.put({ username, password: encryptedPassword });
    });
}
