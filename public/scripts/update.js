document.addEventListener("DOMContentLoaded", () => {
    updateTime();
    setInterval(updateTime, 1000);

    const editPopup = document.getElementById("edit-popup");
    const editButton = document.getElementById("edit-button");
    const closePopup = document.getElementById("close-popup");

    // Fetch and populate user data
    fetchUserProfile();

    // Show Edit Popup
    editButton.addEventListener("click", () => {
        editPopup.style.display = "flex";
        populateEditForm();
    });

    // Close Popup
    closePopup.addEventListener("click", () => {
        editPopup.style.display = "none";
    });

    // Save Edited Profile
    document.getElementById("edit-profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveUpdatedProfile();
    });
});

// Update time
function updateTime() {
    document.getElementById("time").textContent = new Date().toLocaleTimeString();
}

// Fetch User Profile
async function fetchUserProfile() {
    const userId = getUserIdFromToken();
    const token = getAuthToken();

    if (!userId || !token) {
        showMessage('User not authenticated.');
        return;
    }

    try {
        const response = await fetch(`/api/users/details/${userId}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('data fetched', data)
        if (response.ok) {
            // Populate the form with existing user data
            document.getElementById('first-name').value = data.firstName || '';
            document.getElementById('last-name').value = data.lastName || '';
            document.getElementById('gender').value = data.gender || '';
            document.getElementById('bdate').value = data.birthDate ? data.birthDate.split('T')[0] : '';
            document.getElementById('age').value = data.age || 0;
            document.getElementById('phone').value = data.phone || ''; 
            document.getElementById('cstatus').value = data.civilStatus || '';
            document.getElementById('wstatus').value = data.workStatus || 'N/A';
            document.getElementById('guardian').value = data.guardian || 'N/A';
            document.getElementById('id-number').value = data.studentId || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('address').value = data.address || '';

            document.getElementById('user-name').textContent = `${data.firstName} ${data.lastName}`;
            document.getElementById('profile-name').textContent = `${data.firstName} ${data.lastName}`;
            document.getElementById('profile-email').textContent = data.email;
            showMessage('User data loaded.', 'success');
        } else {
            showMessage(data.message || 'Error fetching user data.');
        }

    } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('Error fetching user data.');
    }
}

// Populate Edit Form
function populateEditForm() {
    document.getElementById("edit-first-name").value = document.getElementById("first-name").value;
    document.getElementById("edit-last-name").value = document.getElementById("last-name").value;
    document.getElementById("edit-phone").value = document.getElementById("phone").value;
    document.getElementById("edit-address").value = document.getElementById("address").value;

    document.getElementById("edit-gender").value = document.getElementById("gender").value;
    document.getElementById("edit-bdate").value = document.getElementById("bdate").value;
    document.getElementById("edit-cstatus").value = document.getElementById("cstatus").value;
    document.getElementById("edit-wstatus").value = document.getElementById("wstatus").value;
    document.getElementById("edit-guardian").value = document.getElementById("guardian").value;
    document.getElementById("edit-id-number").value = document.getElementById("id-number").value;
    document.getElementById("edit-email").value = document.getElementById("email").value;
}

// Save Updated Profile
async function saveUpdatedProfile() {
    const userId = getUserIdFromToken();
    const token = getAuthToken();

    if (!userId || !token) {
        alert('User not authenticated.');
        return;
    }

    const updatedData = {
        u_fname: document.getElementById("edit-first-name").value,
        u_lname: document.getElementById("edit-last-name").value,
        u_gender: document.getElementById("edit-gender").value,
        u_bdate: document.getElementById("edit-bdate").value,
        u_phone: document.getElementById("edit-phone").value,
        u_civstatus: document.getElementById("edit-cstatus").value,
        u_wstatus: document.getElementById("edit-wstatus").value,
        u_guardian: document.getElementById("edit-guardian").value,
        u_stud_id: document.getElementById("edit-id-number").value,
        u_email: document.getElementById("edit-email").value,
        u_address: document.getElementById("edit-address").value
    };

    console.log("Sending updated data:", updatedData);

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Error:", result);
            alert(`Failed to save profile: ${result.message || 'Unknown error'}`);
            return;
        }

        alert("Profile updated successfully!");
        document.getElementById("edit-popup").style.display = "none";
        fetchUserProfile(); // Refresh data
    } catch (err) {
        console.error("Error saving profile:", err);
        alert("An unexpected error occurred. Please try again.");
    }
}



// logout
const profileImg = document.getElementById('profile-img');
const dropdownMenu = document.getElementById('dropdown-menu');

profileImg.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});

window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile')) {
        dropdownMenu.style.display = 'none';
    }
});

const logoutLink = document.getElementById('logout');
logoutLink.addEventListener('click', () => {
    logout(); 
});

function logout() {
    // Remove JWT token and user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Optionally, inform the server about the logout
    // Uncomment the following lines if you implement a logout endpoint
    /*
    fetch('/api/users/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('Logged out successfully on the server.');
        } else {
            console.warn('Server logout failed.');
        }
    })
    .catch(error => {
        console.error('Error during server logout:', error);
    });
    */

    // Redirect to the login page or homepage
    window.location.href = '../pages/login.html';
}