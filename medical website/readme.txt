I. Folder Structure Overview:
CW1 SECURE WEB
├── assets
│   ├── gifs
│   ├── images
│   └── videos
├── css_files
├── html_files
├── js_files
├── json_files
├── Case Study Report (Word Document)
├── CST2572-1st Assessment Revised (Word Document)
├── ER Diagram (PDF)
├── readme (TXT)
└── CareWell Video (Video File)



II. Folder-Specific Details:
assets: Stores images, GIFs, and videos required by the app. Ensure all file paths in HTML and CSS correctly point to these assets.

css_files: Contains CSS files for styling. Verify each HTML file links to the necessary CSS for a consistent design.

js_files: Holds JavaScript files that control app behavior, including service workers, IndexedDB interactions, and user interface functions.

json_files: Contains JSON data files required to initialize or populate data in the app’s database (e.g., doctor, patient, medicines, manifest and admin details).

Case Study Report (Word Document): A detailed case study report on a Cyberattack.

CST2572-1st Assessment Revised (Word Document): Contains the revised assessment details for the project.

ER Diagram (PDF): The Entity-Relationship Diagram illustrating database structure and relationships within CareWellClinic.

CareWell Video (Video File): An mp4 file providing a demonstration of the web app.



III. Setting Up Your Development Environment
Extract and Open the Project:

Unzip CW1 SECURE WEB if it’s in a compressed format.
Open the folder in Visual Studio Code.



IV. Running the Web App Locally
Open the Starting HTML File:
In html_files, open frontpage.html using the Live Server extension.

Enable Offline Support:
Open Developer Tools (F12).
In Application > Service Workers, check Offline and Update on reload to test offline functionality and ensure the service worker updates properly.



V. Default Passwords and User Logins
For initial logins, each user role has a default password format. Here are the formats and examples:

Admins: Default password format is adminname123 (all lowercase).
Example:
Username: berny
Password: berny123

Doctors: Default password format is doctorname123 (all lowercase).
Example:
Email: mcaghy5@surveymonkey.com
Password: monah123

Patients: Default password format is patientname2024! (case-sensitive).
Example:
Email: lvasilik0@java.com
Password: Laryssa2024!

Upon first login, doctors and patients are prompted to change their default password to enhance security. The new password must be at least 10 characters long and include a combination of uppercase letters, lowercase letters, numbers, and special characters.





Please note that in the CareWell Video, I forgot to demonstrate the following features:

Notifications and Responsiveness: We are using SweetAlert for user notifications, providing a friendly and interactive way to display alerts and confirmations throughout the app. Additionally, Flexbox is implemented for responsive design, ensuring that the app layout adjusts seamlessly across different screen sizes and devices.

Profile Feature on Patient Dashboard: When "Profile" is pressed on the sidebar in the Patient Dashboard, the patient's information is displayed, containing all details read directly from the database. The patient can only view this information; no edits are allowed to ensure data integrity.