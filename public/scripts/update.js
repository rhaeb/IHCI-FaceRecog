document.addEventListener("DOMContentLoaded", async () => {
    const popupContainer = document.getElementById("popup-container");
    try {
        const response = await fetch('update.html');
        if (!response.ok) throw new Error('Failed to load popup');
        const popupHTML = await response.text();
        popupContainer.innerHTML = popupHTML;

        initializePopup();
    } catch (error) {
        console.error('Error loading popup:', error);
    }

    const userId = 1; // Replace with the actual user ID
    fetchUserData(userId);
});

function updateTime() {
    const now = new Date();
    document.getElementById("time").textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

function initializePopup() {
    const editPopup = document.getElementById("editPopup");
    const closePopup = document.getElementById("closePopup");
    const saveButton = document.getElementById("save-button");

    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            console.log('Save button clicked');
            const updatedData = {
                u_id: +document.getElementById('edit-student-id').value, 
                u_lname: document.getElementById('edit-last-name').value,
                u_fname: document.getElementById('edit-first-name').value,
                u_email: document.getElementById('edit-email').value,
            };
            console.log('Updated Data', updatedData);
            try {
                const response = await fetch(`/api/users/update/${updatedData.u_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                console.log('Response from server:', response);
                if (!response.ok) throw new Error('Failed to update user data');

                const result = await response.json();
                console.log('Result from server:', result);
                alert('Profile updated successfully!');
                document.getElementById('editPopup').style.display = 'none';

                refreshProfileInfo(updatedData.u_id);
            } catch (error) {
                console.error('Error updating user data:', error);
                alert('Error updating profile. Please try again.');
            }
        });
    }

    closePopup.addEventListener("click", () => {
        editPopup.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === editPopup) {
            editPopup.style.display = "none";
        }
    });

    editPopup.style.display = 'none';

    const editButton = document.getElementById('edit-button');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            fetchUserData(userId).then(() => {
                editPopup.style.display = 'flex';
            });
        });
    }
}

async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user data');

        const user = await response.json();
        console.log('Fetched Data', user);

        //for update form
        document.getElementById('edit-student-id').value = user.u_id || '';
        document.getElementById('edit-last-name').value = user.u_lname || '';
        document.getElementById('edit-first-name').value = user.u_fname || '';
        document.getElementById('edit-email').value = user.u_email || '';

        //profile info
        document.getElementById('id-number').value = user.u_id || '';
        document.getElementById('last-name').value = user.u_lname || '';
        document.getElementById('first-name').value = user.u_fname || '';
        document.getElementById('email').value = user.u_email || '';

        //profile caed
        document.getElementById('profile-name').textContent = `${user.u_fname} ${user.u_lname}`;
        document.getElementById('profile-email').textContent = user.u_email;
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

async function refreshProfileInfo(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch updated profile data');

        const updatedUser = await response.json();
        document.getElementById('first-name').value = updatedUser.u_fname || '';
        document.getElementById('middle-name').value = updatedUser.u_mname || '';
        document.getElementById('last-name').value = updatedUser.u_lname || '';
        document.getElementById('email').value = updatedUser.u_email || '';
    } catch (error) {
        console.error('Error refreshing profile information:', error);
    }
}