// Make the video rectangle grow on scroll
window.addEventListener("scroll", function () {
    const videoPlaceholder = document.getElementById("video-placeholder");
    let scrollY = window.scrollY;

    // Calculate new width and height with limits
    let newWidth = Math.min(100, 60 + scrollY / 10); // Width grows up to 100%
    let newHeight = Math.min(400, 250 + scrollY / 5); // Height grows up to 400px

    // Apply the calculated size to the video placeholder
    videoPlaceholder.style.width = newWidth + "%";
    videoPlaceholder.style.height = newHeight + "px";
});

// Stats count-up animation
const statNumbers = document.querySelectorAll(".stat-num"); // Select all elements with the class 'stat-num'
const statsSection = document.querySelector(".stats-section"); // Select the stats section
let statsStarted = false; // Track if animation has already started

// Trigger count-up animation when stats section enters the viewport
window.addEventListener("scroll", function () {
    const statsSectionTop = statsSection.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    // Check if stats section is in the viewport and animation hasn't started
    if (statsSectionTop < windowHeight && !statsStarted) {
        statsStarted = true; // Prevent multiple triggers
        statNumbers.forEach((num) => {
            const target = +num.getAttribute("data-target"); // Get target number from 'data-target' attribute
            let count = 0;

            const increment = target / 100; // Set increment speed for counting

            // Function to update the displayed count
            const updateCount = () => {
                if (count < target) {
                    count += increment; // Increase count by increment value
                    num.innerText = Math.floor(count); // Display the updated count
                    setTimeout(updateCount, 30); // Repeat every 30ms for smooth animation
                } else {
                    num.innerText = target; // Set to target to avoid overshooting
                }
            };

            updateCount(); // Start the count-up animation
        });
    }
});

// Scroll effect for boxes moving like stairs
window.addEventListener('scroll', function () {
    const scrollValue = window.scrollY; // Get current scroll position
    
    // Select the boxes by ID
    const box1 = document.getElementById('box1');
    const box2 = document.getElementById('box2');
    const box3 = document.getElementById('box3');

    // Apply a stair-like movement effect based on scroll position
    box1.style.transform = `translateY(${scrollValue * 0.03}px)`; // Subtle movement for box1
    box2.style.transform = `translateY(${scrollValue * 0.06}px)`; // Slightly stronger movement for box2
    box3.style.transform = `translateY(${scrollValue * 0.09}px)`; // Strongest movement for box3
});
