let db; // Define a global variable for the IndexedDB database connection

// Function to open CareWellClinicDB and set the global `db` variable if not already initialized
async function initializeDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            // If `db` is already defined, resolve immediately
            resolve(db);
            return;
        }

        const request = indexedDB.open("CareWellClinicDB", 1);
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("CareWellClinicDB initialized in appointment_doctor.js.");
            resolve(db);
        };
        request.onerror = (event) => {
            console.error("Failed to open CareWellClinicDB:", event.target.error);
            reject("Failed to open CareWellClinicDB");
        };
    });
}

// Ensure the database is initialized before calling any other functions
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeDB();
        await loadAppointmentRequests();
        await countTodayAppointments();
        await displayTodaysAppointments();
        await displayUpcomingAppointments();
    } catch (error) {
        console.error("Error initializing appointments:", error);
    }
});


// Function to load appointment requests for the specific doctor
async function loadAppointmentRequests() {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return; // Check if db is defined
    const appointmentTableBody = document.querySelector("#appointment-requests tbody");
    appointmentTableBody.innerHTML = ""; // Clear any existing rows

    const doctorId = Number(localStorage.getItem("loggedInDoctorId")); // Get logged-in doctor's ID
    if (!doctorId) {
        console.error("No logged-in doctor ID found in localStorage");
        return;
    }

    const transaction = db.transaction("appointments", "readonly");
    const store = transaction.objectStore("appointments");

    const appointments = await getAllAppointments(store);

    const doctorAppointments = appointments.filter(
        appointment => appointment.doctor_id === doctorId && appointment.status === "Pending"
    );

    document.getElementById("appointment-requests-count").textContent = doctorAppointments.length;

    if (doctorAppointments.length === 0) {
        document.getElementById("no-appointments-message").style.display = "block";
    } else {
        document.getElementById("no-appointments-message").style.display = "none";
        for (const appointment of doctorAppointments) {
            const patientName = await fetchPatientName(appointment.patient_id);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${appointment.appointment_type}</td>
                <td>${appointment.appointment_date}</td>
                <td>${appointment.appointment_time}</td>
                <td>
                    <a href="doctor_patient_details.html?id=${appointment.patient_id}" target="_blank">${patientName}</a>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="accept-btn" onclick="acceptAppointment(${appointment.id})">Accept</button>
                        <button class="reject-btn" onclick="rejectAppointment(${appointment.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            appointmentTableBody.appendChild(row);
        }
    }
}


// Function to retrieve all appointments from the appointments store
async function getAllAppointments(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            console.log("Retrieved Appointments:", request.result);
            resolve(request.result);
        };
        request.onerror = () => reject("Error retrieving appointments");
    });
}

// Function to fetch patient name from the patients object store
async function fetchPatientName(patientId) {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return "Unknown Patient"; // Check if db is defined
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("patients", "readonly");
        const store = transaction.objectStore("patients");
        const request = store.get(patientId);

        request.onsuccess = () => {
            const patient = request.result;
            if (patient) {
                resolve(`${patient.firstname} ${patient.lastname}`);
            } else {
                resolve("Unknown Patient");
            }
        };

        request.onerror = () => {
            console.error("Failed to retrieve patient information.");
            resolve("Unknown Patient");
        };
    });
}

// Function to handle accepting an appointment
function acceptAppointment(appointmentId) {
    updateAppointmentStatus(appointmentId, "Accepted");
}

// Function to handle rejecting an appointment with confirmation prompt
function rejectAppointment(appointmentId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this appointment request?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336', 
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            updateAppointmentStatus(appointmentId, "Rejected");
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'The appointment request has been rejected.',
                confirmButtonColor: '#00A8F0'
            });
        }
    });
}

// Function to update the status of an appointment
async function updateAppointmentStatus(appointmentId, status) {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return; // Check if db is defined
    const transaction = db.transaction("appointments", "readwrite");
    const store = transaction.objectStore("appointments");

    const getRequest = store.get(appointmentId);
    getRequest.onsuccess = (event) => {
        const appointment = event.target.result;
        appointment.status = status;

        const updateRequest = store.put(appointment);
        updateRequest.onsuccess = () => {
            if (status === "Accepted") {
                markTimeSlotUnavailable(appointment.doctor_id, appointment.appointment_date, appointment.appointment_time);
            }

            Swal.fire({
                title: "Success!",
                text: `Appointment has been ${status.toLowerCase()}.`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#00A8F0"
            }).then(() => loadAppointmentRequests()); // Refresh appointment list
        };
    };

    getRequest.onerror = () => console.error("Failed to retrieve appointment");
}

// Function to mark a time slot as unavailable
function markTimeSlotUnavailable(doctorId, date, timeSlot) {
    const unavailableSlots = JSON.parse(localStorage.getItem("unavailableSlots")) || {};
    if (!unavailableSlots[doctorId]) unavailableSlots[doctorId] = {};
    if (!unavailableSlots[doctorId][date]) unavailableSlots[doctorId][date] = [];
    if (!unavailableSlots[doctorId][date].includes(timeSlot)) {
        unavailableSlots[doctorId][date].push(timeSlot);
    }

    localStorage.setItem("unavailableSlots", JSON.stringify(unavailableSlots));
}

// Function to count accepted appointments for the current day for a specific doctor
async function countTodayAppointments() {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return; // Check if db is defined
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the start of the day for comparison

    const doctorId = Number(localStorage.getItem("loggedInDoctorId")); // Get logged-in doctor's ID
    if (!doctorId) {
        console.error("No logged-in doctor ID found in localStorage");
        return;
    }

    const transaction = db.transaction("appointments", "readonly");
    const store = transaction.objectStore("appointments");

    let todayCount = 0;

    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const appointment = cursor.value;
            const appointmentDate = new Date(appointment.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0); // Set to the start of the day for comparison

            if (
                appointment.status === "Accepted" &&
                appointment.doctor_id === doctorId &&
                appointmentDate.getTime() === today.getTime()
            ) {
                todayCount++;
            }
            cursor.continue();
        } else {
            document.querySelector('.stats a[href="#appointments"] h2').textContent = todayCount;
            console.log(`Final count of today's accepted appointments for doctor ID ${doctorId}: ${todayCount}`);
        }
    };

    transaction.onerror = (event) => {
        console.error("Error counting today's accepted appointments:", event.target.error);
    };
}


// Function to display today's accepted appointments in chronological order for the logged-in doctor
async function displayTodaysAppointments() {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return; // Check if db is defined
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the start of the day for comparison

    const appointmentList = document.querySelector("#todays-appointments .appointment-list");
    appointmentList.innerHTML = ""; // Clear existing appointments

    const doctorId = Number(localStorage.getItem("loggedInDoctorId")); // Get logged-in doctor's ID
    if (!doctorId) {
        console.error("No logged-in doctor ID found in localStorage");
        return;
    }

    const transaction = db.transaction("appointments", "readonly");
    const store = transaction.objectStore("appointments");

    const todaysAppointments = []; // Array to store today's accepted appointments for the logged-in doctor

    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const appointment = cursor.value;
            const appointmentDate = new Date(appointment.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0);

            if (appointment.status === "Accepted" && appointment.doctor_id === doctorId && appointmentDate.getTime() === today.getTime()) {
                todaysAppointments.push(appointment);
            }
            cursor.continue();
        } else {
            // Sort appointments by time in ascending order
            todaysAppointments.sort((a, b) => {
                const timeA = new Date(`${a.appointment_date} ${a.appointment_time}`).getTime();
                const timeB = new Date(`${b.appointment_date} ${b.appointment_time}`).getTime();
                return timeA - timeB;
            });

            if (todaysAppointments.length > 0) {
                displayAppointmentsWithPatientDetails(todaysAppointments, appointmentList);
            } else {
                appointmentList.innerHTML = "<p>No appointments scheduled for today.</p>";
            }
        }
    };

    transaction.onerror = (event) => {
        console.error("Error fetching today's appointments:", event.target.error);
    };
}

// Function to display upcoming accepted appointments for the logged-in doctor
async function displayUpcomingAppointments() {
    await initializeDB(); // Ensure the database is initialized
    if (!db) return; // Check if db is defined
    const doctorId = Number(localStorage.getItem("loggedInDoctorId")); // Get logged-in doctor's ID
    if (!doctorId) {
        console.error("No logged-in doctor ID found in localStorage");
        return;
    }

    const appointmentList = document.querySelector("#upcoming-appointments .appointment-list");
    appointmentList.innerHTML = ""; // Clear existing content

    const transaction = db.transaction("appointments", "readonly");
    const store = transaction.objectStore("appointments");

    const upcomingAppointments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison

    store.openCursor().onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const appointment = cursor.value;
            const appointmentDate = new Date(appointment.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0);

            if (appointment.status === "Accepted" && appointment.doctor_id === doctorId && appointmentDate > today) {
                upcomingAppointments.push(appointment);
            }
            cursor.continue();
        } else {
            // Sort appointments by date and time, nearest first
            upcomingAppointments.sort((a, b) => {
                return new Date(`${a.appointment_date} ${a.appointment_time}`).getTime() -
                       new Date(`${b.appointment_date} ${b.appointment_time}`).getTime();
            });

            const displayAppointments = upcomingAppointments.slice(0, 5); // Display up to 5 upcoming appointments

            if (displayAppointments.length > 0) {
                for (const appointment of displayAppointments) {
                    const patientName = await fetchPatientName(appointment.patient_id);

                    const appointmentElement = document.createElement("div");
                    appointmentElement.classList.add("appointment");
                    appointmentElement.innerHTML = `
                        <img src="/assets/gifs/patientprof.gif" alt="Patient Image" class="patient-img">
                        <div>
                            <p><strong>${patientName}</strong></p>
                            <p>${appointment.appointment_type}</p>
                            <p>
                            <strong>Date:</strong> <span class="circle-background">${appointment.appointment_date}</span> - 
                            <strong>Time:</strong> <span class="circle-background">${appointment.appointment_time}</span>
                            </p>
                        </div>
                    `;
                    appointmentList.appendChild(appointmentElement);
                }
            } else {
                appointmentList.innerHTML = "<p>No upcoming accepted appointments.</p>";
            }
        }
    };

    transaction.onerror = (event) => {
        console.error("Error fetching upcoming accepted appointments:", event.target.error);
    };
}

// Helper function to fetch patient details and display appointments
async function displayAppointmentsWithPatientDetails(appointments, appointmentList) {
    appointmentList.innerHTML = ""; // Clear existing content

    for (const appointment of appointments) {
        const patientName = await fetchPatientName(appointment.patient_id);

        const appointmentElement = document.createElement("div");
        appointmentElement.classList.add("appointment");
        appointmentElement.innerHTML = `
            <img src="/assets/gifs/patientprof.gif" alt="Patient Image">
            <div>
                <p><strong>${patientName}</strong></p>
                <p>${appointment.appointment_type} - <span class="time">${appointment.appointment_time}</span></p>
            </div>
        `;

        appointmentList.appendChild(appointmentElement);
    }
}
