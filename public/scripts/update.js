// Load Popup HTML dynamically
document.addEventListener("DOMContentLoaded", async () => {
    const popupContainer = document.getElementById("popup-container");
    try {
        const response = await fetch('update.html');
        if (!response.ok) throw new Error('Failed to load popup');
        const popupHTML = await response.text();
        popupContainer.innerHTML = popupHTML;

        // Initialize popup logic
        initializePopup();
    } catch (error) {
        console.error('Error loading popup:', error);
    }
});

// Real-time clock
function updateTime() {
    const now = new Date();
    document.getElementById("time").textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

// Initialize Popup Logic
function initializePopup() {
    const editPopup = document.getElementById("editPopup");
    const closePopup = document.getElementById("closePopup");

    closePopup.addEventListener("click", () => {
        editPopup.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === editPopup) {
            editPopup.style.display = "none";
        }
    });

    // Ensure popup is initially hidden
    editPopup.style.display = 'none';

    // Fetch user data when edit button is clicked
    const editButton = document.getElementById('edit-button');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            fetchUserData(userId);
        });
    }
}

// Fetch user data
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user data');

        const user = await response.json();
        document.getElementById('edit-student-id').value = user.u_id || '';
        document.getElementById('edit-last-name').value = user.u_lname || '';
        document.getElementById('edit-first-name').value = user.u_fname || '';
        document.getElementById('edit-email').value = user.u_email || '';

        const editPopup = document.getElementById("editPopup");
        editPopup.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}


