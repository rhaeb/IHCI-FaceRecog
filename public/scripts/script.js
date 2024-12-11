// script.js

let faceDescriptor = null;
let video = null;
let canvas = null;

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    setupPageLogic(currentPage);
});

function setupPageLogic(currentPage) {
    if (currentPage === 'signuptest.html') {
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        } else {
            console.warn('Signup form not found.');
        }
    } else if (currentPage === 'login.html') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handlePassLogin);
        } else {
            console.warn('Login form not found.');
        }
    } else if (currentPage === 'edittest.html') {
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', handleEditUser);
            fetchAndPopulateUserData();
        } else {
            console.warn('Edit User form not found.');
        }
    } else if (currentPage === 'homepage.html' || currentPage === 'profile.html') { // Update with your profile page's actual name
        checkAuthentication(); // Ensure user is authenticated
        fetchAndPopulateUserData(); // Populate user data

    }
}

async function handlePassLogin(event) {
    event.preventDefault();
    showMessage('Logging in...', 'success');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
        showMessage('Email and password are required.');
        return;
    }

    try {
        const response = await fetch('/api/users/login-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            // Store JWT token
            localStorage.setItem('token', data.token);
            // Optionally, store user info
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect to edit user page or dashboard
            setTimeout(() => {
                window.location.href = '../pages/welcomepage.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Error during login.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showMessage('Error logging in.');
    }
}

async function handleEditUser(event) {
    event.preventDefault();
    showMessage('Updating user information...', 'success');

    const userId = getUserIdFromToken();
    const token = getAuthToken();

    if (!userId || !token) {
        showMessage('User not authenticated.');
        return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    const civilStatus = document.getElementById('civilStatus').value.trim();

    // Basic validation
    if (!firstName || !lastName || !address || !phone || !birthDate || !gender || !civilStatus) {
        showMessage('All fields are required.');
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                u_fname: firstName,
                u_lname: lastName,
                u_address: address,
                u_phone: phone,
                u_bdate: birthDate,
                u_gender: gender,
                u_civstatus: civilStatus
            })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            // Optionally, update stored user info
            const user = JSON.parse(localStorage.getItem('user'));
            user.firstName = firstName;
            user.lastName = lastName;
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            showMessage(data.message || 'Error updating user information.');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showMessage('Error updating user information.');
    }
}

async function fetchAndPopulateUserData() {
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
        if (response.ok) {
            // Populate the form with existing user data
            document.getElementById('first-name').value = data.firstName || '';
            document.getElementById('last-name').value = data.lastName || '';
            document.getElementById('gender').value = data.gender || '';
            document.getElementById('bdate').value = data.birthDate ? data.birthDate.split('T')[0] : '';
            document.getElementById('age').value = data.age || '';
            document.getElementById('phone').value = data.phone || ''; 
            document.getElementById('cstatus').value = data.civilStatus || '';
            document.getElementById('wstatus').value = data.workStatus || 'N/A';
            document.getElementById('guardian').value = data.guardian || 'N/A';
            document.getElementById('id-number').value = data.studentId || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('address').value = data.address || '';
            showMessage('User data loaded.', 'success');
        } else {
            showMessage(data.message || 'Error fetching user data.');
        }

    } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('Error fetching user data.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    console.log('Handling signup.');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    const civilStatus = document.getElementById('civilStatus').value.trim();

    // Basic validation
    if (!email || !password || !firstName || !lastName || !studentId || !address || !phone || !birthDate || !gender || !civilStatus) {
        showMessage('All fields are required.');
        return;
    }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                studentId,
                address,
                phone,
                birthDate,
                gender,
                civilStatus
            })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('User registered. Starting face recognition...');
            startFaceRecognition('register', email);
        } else {
            showMessage(data.message);
        }
    } catch (error) {
        console.error('Error registering:', error);
        showMessage('Error registering user');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();

    if (!email) {
        showMessage('email is required.');
        return;
    }

    showMessage('Starting face recognition...');
    startFaceRecognition('login', email);
}

async function startFaceRecognition(mode, email) {
    const container = document.querySelector('.container');
    
    // Remove existing video and canvas if they exist
    if (video) video.remove();
    if (canvas) canvas.remove();
    
    video = document.createElement('video');
    canvas = document.createElement('canvas');
    video.width = 640;
    video.height = 480;
    canvas.width = 640;
    canvas.height = 480;
    container.appendChild(video);
    container.appendChild(canvas);

    try {
        await loadFaceApiModels();
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        console.log('Camera stream obtained.');
        video.srcObject = stream;
        await video.play();

        // Wait for video to load before starting detection
        video.onloadeddata = async () => {
            if (video.paused || video.ended) {
                video.play(); // Ensure video starts playing
            }
            console.log('Video data loaded.');
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);

            // Ensure canvas is correctly drawn
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas before drawing

            const detectFace = async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,  // Increase size for better detection
                    scoreThreshold: 0.3  // Lower the threshold for more sensitive detection
                }))
                .withFaceLandmarks()
                .withFaceDescriptors();

                console.log('Raw detections:', detections); // Log detections directly

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                if (detections.length > 0) {
                    const faceDescriptor = detections[0].descriptor;
                    console.log('Face descriptor:', faceDescriptor); // Log face descriptor

                    if (!faceDescriptor) {
                        console.log('No face detected. Please make sure your face is visible.');
                        showMessage('No face detected. Please make sure your face is visible.');
                        return;
                    }

                    try {
                        if (mode === 'register') {
                            await registerFace(email, faceDescriptor);
                        } else if (mode === 'login') {
                            await loginWithFace(email, faceDescriptor);
                        }
                    } catch (error) {
                        console.error('Error during face recognition:', error);
                        showMessage('Error during face recognition');
                    }
                    return; // Exit the function after processing the face
                }

                // Continue detecting faces if none found
                requestAnimationFrame(detectFace);
            };

            detectFace();
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        showMessage('Error accessing camera');
    }
}

async function loadFaceApiModels() {
    try {
        console.log('Loading face-api models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log('Face-api models loaded successfully.');
    } catch (err) {
        console.error('Error loading models:', err);
        showMessage('Error loading face-api models. Ensure the models are located in the correct path.');
    }
}

async function registerFace(email, faceDescriptor) {
    const faceData = {
        email: email,
        faceDescriptor: Array.from(faceDescriptor)
    };

    console.log('Sending face data to the server:', faceData);

    try {
        const response = await fetch('/api/users/register-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faceData)
        });

        const data = await response.json();
        showMessage(data.message);

        if (response.ok) {
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000);
        }
    } catch (error) {
        console.error('Error registering face:', error);
        showMessage('Error registering face');
    }
}

async function loginWithFace(email, faceDescriptor) {
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, faceDescriptor: Array.from(faceDescriptor) })
        });

        const data = await response.json();
        showMessage(data.message);
        if (response.ok) {
            // Store the token in localStorage or a cookie as needed
            localStorage.setItem('token', data.token);

            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showMessage('Error logging in');
    }
}

async function displayUserDetails() {
    const userId = getUserIdFromToken(); // Implement this function based on your auth mechanism
    if (!userId) {
        showMessage('User not authenticated.');
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            const userDetailsDiv = document.getElementById('userDetails');
            userDetailsDiv.innerHTML = `
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>First Name:</strong> ${data.firstName}</p>
                <p><strong>Last Name:</strong> ${data.lastName}</p>
                <p><strong>Age:</strong> ${data.age}</p>
                <p><strong>Address:</strong> ${data.address}</p>
                <p><strong>Phone:</strong> ${data.phone}</p>
                <p><strong>Gender:</strong> ${data.gender}</p>
                <p><strong>Civil Status:</strong> ${data.civilStatus}</p>
                <p><strong>Guardian:</strong> ${data.guardian || 'N/A'}</p>
                <p><strong>Work Status:</strong> ${data.workStatus || 'N/A'}</p>
                <p><strong>Created At:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
            `;
        } else {
            showMessage(data.message);
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        showMessage('Error fetching user details');
    }
}

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
    window.location.href = '../pages/login.html'; // Update the path as needed
}

function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = type === 'error' ? 'red' : 'green';
    }
}

function getAuthToken() {
    // Implement retrieval of the JWT token from storage (e.g., localStorage)
    return localStorage.getItem('token');
}

function getUserIdFromToken() {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        console.error('Invalid token:', error);
        return null;
    }
}

function checkAuthentication() {
    const token = getAuthToken();
    if (!token) {
        // Token not found, redirect to login
        window.location.href = 'index.html'; // Update the path as needed
    } else {
        // Optionally, verify token validity by making a request to the server
        // or decoding the token and checking expiration
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            if (payload.exp < currentTime) {
                // Token has expired
                logout();
            }
        } catch (error) {
            console.error('Invalid token:', error);
            logout();
        }
    }
}