// Open CareWellClinicDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CareWellClinicDB", 1);

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = () => reject("Error opening CareWellClinicDB");
  });
}

// Populate doctor dropdown with data from CareWellClinicDB
function populateDoctorDropdown() {
  const doctorSelectForAppointment = document.getElementById("doctor");
  const doctorSelectForPrescription = document.getElementById("doctor-prescription");

  if (!db) {
    console.error("Doctor database not initialized.");
    return;
  }

  doctorSelectForAppointment.innerHTML = '<option value="" disabled selected>-- Select Doctor --</option>';
  doctorSelectForPrescription.innerHTML = '<option value="" disabled selected>-- Select Doctor --</option>';

  // Define an array of specialties to alternate
  const specialties = [
    "Cardiology", "Dermatology", "Pulmonology", "Pediatrics", "Gastroenterology",
    "Orthopedics", "Psychiatry", "General Medicine", "Emergency Medicine", "Dentistry"
  ];

  const transaction = db.transaction("doctors", "readonly");
  const store = transaction.objectStore("doctors");

  const getAllDoctors = store.getAll();
  getAllDoctors.onsuccess = (event) => {
    const doctors = event.target.result;
    if (doctors.length === 0) {
      console.warn("No doctors found in database.");
    } else {
      doctors.forEach((doctor, index) => {
        const specialty = specialties[index % specialties.length];
        const option = document.createElement("option");
        option.value = doctor.id;
        option.textContent = `Dr. ${doctor.firstname} ${doctor.lastname} (${specialty})`;
        doctorSelectForAppointment.appendChild(option.cloneNode(true));
        doctorSelectForPrescription.appendChild(option);
      });
    }
  };

  getAllDoctors.onerror = () => {
    console.error("Failed to retrieve doctors from the database.");
  };
}

// Initialize Flatpickr calendar and restrict to today and future dates
function initializeFlatpickr() {
  flatpickr("#appointmentDate", {
    minDate: "today",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
      const doctorId = Number(document.getElementById("doctor").value);
      if (doctorId && dateStr) {
        displayAvailableTimeSlots(doctorId, dateStr);
      }
    }
  });
}

// Retrieve logged-in patient information from localStorage
function getLoggedInPatient() {
  const firstName = localStorage.getItem("loggedInPatientFirstName");
  const lastName = localStorage.getItem("loggedInPatientLastName");

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("patients", "readonly");
    const store = transaction.objectStore("patients");
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const patient = cursor.value;
        if (patient.firstname === firstName && patient.lastname === lastName) {
          resolve(patient);
        } else {
          cursor.continue();
        }
      } else {
        reject("Logged-in patient not found");
      }
    };
    request.onerror = () => reject("Error retrieving patient data");
  });
}

// Retrieve unavailable slots for a doctor on a specific date
async function getUnavailableSlots(doctorId, date) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("appointments", "readonly");
    const store = transaction.objectStore("appointments");
    const request = store.getAll();

    request.onsuccess = (event) => {
      const appointments = event.target.result.filter(
        (appointment) => appointment.doctor_id === doctorId &&
                         appointment.appointment_date === date &&
                         appointment.status === "Accepted"
      );
      const unavailableSlots = appointments.map((appointment) => appointment.appointment_time);
      resolve(unavailableSlots);
    };

    request.onerror = () => reject("Error retrieving unavailable slots");
  });
}

// Display available time slots, excluding unavailable ones and past times if the date is today
async function displayAvailableTimeSlots(doctorId, date) {
  const timeSlotSelect = document.getElementById("timeSlot");
  timeSlotSelect.innerHTML = '<option value="" disabled selected>-- Select Time --</option>';

  const allTimeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"];
  const unavailableSlots = await getUnavailableSlots(doctorId, date);

  const currentDate = new Date();
  const selectedDate = new Date(date);
  const isToday = currentDate.toDateString() === selectedDate.toDateString();

  allTimeSlots.forEach((slot) => {
    const [startHour, startMinute] = slot.split("-")[0].split(":").map(Number);
    const slotTime = new Date();
    slotTime.setHours(startHour, startMinute, 0, 0);

    const option = document.createElement("option");
    option.value = slot;
    option.textContent = slot;

    if (unavailableSlots.includes(slot) || (isToday && slotTime <= currentDate)) {
      option.disabled = true;
    }

    timeSlotSelect.appendChild(option);
  });
}

// Populate time slots based on selected doctor and date
document.getElementById("doctor").addEventListener("change", () => {
  const doctorId = Number(document.getElementById("doctor").value);
  const date = document.getElementById("appointmentDate").value;
  if (doctorId && date) {
    displayAvailableTimeSlots(doctorId, date);
  }
});

// Save an appointment to the "appointments" object store
function saveAppointment(appointment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("appointments", "readwrite");
    const store = transaction.objectStore("appointments");

    const request = store.add(appointment);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Error saving appointment");
  });
}

// Handle form submission for booking an appointment
async function handleAppointmentSubmission(event) {
  event.preventDefault();

  try {
    const patient = await getLoggedInPatient();
    const appointmentType = document.getElementById("appointmentType").value;
    const doctorId = Number(document.getElementById("doctor").value);
    const appointmentDate = document.getElementById("appointmentDate").value;
    const timeSlot = document.getElementById("timeSlot").value;

    if (!appointmentType || !doctorId || !appointmentDate || !timeSlot) {
      Swal.fire({
        title: "Error!",
        text: "Please fill in all required fields.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#f44336"
      });
      return;
    }

    const appointment = {
      patient_id: patient.id,
      doctor_id: doctorId,
      appointment_type: appointmentType,
      appointment_date: appointmentDate,
      appointment_time: timeSlot,
      status: "Pending"
    };

    await saveAppointment(appointment);

    Swal.fire({
      title: "Success!",
      text: "Your appointment has been booked successfully.",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#00A8F0"
    });

    document.getElementById("appointmentForm").reset();
    displayAvailableTimeSlots(doctorId, appointmentDate); // Refresh time slots
  } catch (error) {
    console.error("Error handling appointment submission:", error);
    Swal.fire({
      title: "Error!",
      text: "Failed to book appointment. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#f44336"
    });
  }
}

// Event listener for form submission
document.getElementById("appointmentForm").addEventListener("submit", handleAppointmentSubmission);

// Initialize function to open databases, populate doctors, and display appointments on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await openDatabase();
    populateDoctorDropdown();
    initializeFlatpickr(); // Initialize the Flatpickr calendar
  } catch (error) {
    console.error("Error initializing appointment module:", error);
  }
});