const cacheName = 'carewell-cache-v1';  // Cache name, change this when updating the cache
const assetsToCache = [
    './',                                     
    './json_files/admin.json',                
    './json_files/doctors.json',
    './json_files/medicines.json',
    './json_files/patients.json',
    './html_files/access_denied.html',
    './html_files/admin_dashboard.html', 
    './html_files/admin_patient.html', 
    './html_files/doctor_dashboard.html', 
    './html_files/doctor_patient_details.html', 
    './html_files/frontpage.html',   
    './html_files/login_page.html',  
    './html_files/offline.html',
    './html_files/patient_dashboard.html',
    './html_files/patient_info.html',
    './html_files/register_page.html',
    './css_files/admin_dashboard.css', 
    './css_files/admin_patient.css', 
    './css_files/doctor_dashboard.css', 
    './css_files/doctor_patient_details.css', 
    './css_files/frontpage.css',   
    './css_files/login.css',
    './css_files/patient_dashboard.css',  
    './css_files/patient_info.css', 
    './css_files/register_page.css', 
    './js_files/access_control.js',             
    './js_files/admin_login.js',
    './js_files/admin_dashboard.js',
    './js_files/admin_patient.js',
    './js_files/appointment_doctor.js',
    './js_files/appointment.js',
    './js_files/crypto-js.min.js',
    './js_files/doctor_login.js',
    './js_files/doctor_patient_list.js',
    './js_files/encryption.js',
    './js_files/frontpage.js',
    './js_files/initialisation.js',
    './js_files/patient_dashboard.js',
    './js_files/patient_info.js',
    './js_files/patient_login.js',
    './js_files/patient_medical_notes.js',
    './js_files/prescription_doctor.js',
    './js_files/prescription.js',
    './js_files/register_page.js',
    './assets/videos/fanimated.mp4',
    './assets/videos/access_denied.mp4',
    './assets/videos/bodyvid.mp4',
    './assets/videos/carewell.mp4',
    './assets/videos/doctor_error.mp4',
    './assets/videos/doctor_good.mp4',
    './assets/videos/doctor_takingnotes.mp4',
    './assets/videos/doctor_welcome.mp4',
    './assets/videos/enroldoc.mp4',
    './assets/videos/registervid.mp4',
    './assets/gifs/admin.gif',
    './assets/gifs/appointment.gif',
    './assets/gifs/dashboard.gif',
    './assets/gifs/docprof.gif',
    './assets/gifs/docteam.gif',
    './assets/gifs/doctor.gif',
    './assets/gifs/enrol.gif',
    './assets/gifs/history.gif',
    './assets/gifs/logo.gif',
    './assets/gifs/patient.gif',
    './assets/gifs/patientprof.gif',
    './assets/gifs/prescription.gif',
    './assets/gifs/user.gif',
    './assets/images/admindbbg.jpeg',
    './assets/images/ambulance-icon.png',
    './assets/images/email-icon.png',
    './assets/images/phone-icon.png',
    './favicon.ico'                                       
];

// Install Event - Cache assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log('Caching assets...');
            return cache.addAll(assetsToCache).catch(error => {
                console.error('Error during cache.addAll:', error);
            });
        })
    );
    // Force activation of new service worker immediately
    self.skipWaiting();
});

// Activate Event - Remove old caches
self.addEventListener('activate', event => {
    console.log('Activating new service worker...');
    const cacheWhitelist = [cacheName]; // Add current cache name to whitelist

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (!cacheWhitelist.includes(cache)) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache); // Delete old caches
                    }
                })
            );
        })
    );
    // Claim control to ensure the new service worker controls clients without reload
    return self.clients.claim();
});

// Fetch Event - Serve from Cache if Available, else Fetch from Network
self.addEventListener('fetch', event => {
    console.log('Fetching:', event.request.url);
    
    // Respond with a cached asset or fetch from network
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;  // Return cached response if found
            }

            // Attempt network fetch if no cached response is found
            return fetch(event.request).catch(() => {
                // Handle offline scenario and fallback to offline page
                return caches.match('./html_files/offline.html');
            });
        })
    );
});
