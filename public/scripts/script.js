// script.js

let faceDescriptor = null;
let video = null;
let canvas = null;
let collectedFaceDescriptor = null;
let faceMatcher;
let isRecognizing = false;

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    setupPageLogic(currentPage);
});

function setupPageLogic(currentPage) {
    if (currentPage === 'signup.html') {
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup2);
        } else {
            console.warn('Signup form not found.');
        }
    } else if (currentPage === 'login.html') {
        const faceIdButton = document.getElementById('face-id-link');
        if (faceIdButton) {
            faceIdButton.addEventListener('click', () => {
                $('#faceLoginModal').modal('show');
            });
        } else {
            console.warn('Face ID button not found.');
        }

        // Modal event listeners
        $('#faceLoginModal').on('shown.bs.modal', () => {
            handleFaceRecognition();
        });

        $('#faceLoginModal').on('hidden.bs.modal', () => {
            stopFaceRecognition();
        });
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

async function loadFaceApiModels() {
    try {
        console.log('Loading face-api models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('../models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('../models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('../models');
        console.log('Face-api models loaded successfully.');
    } catch (err) {
        console.error('Error loading models:', err);
        showMessage('Error loading face-api models. Ensure the models are located in the correct path.');
    }
}
// Initialize the face-api.js library
async function initializeFaceApi() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('../models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('../models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('../models');
    console.log('Face-api.js models loaded');
}
// Start the face recognition process
async function handleFaceRecognition() {
    if (isRecognizing) return;
    isRecognizing = true;

    // Initialize face-api models if not already loaded
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        await initializeFaceApi();
    }

    video = document.getElementById('videoInput');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error("Error accessing webcam:", err);
        alert('Unable to access the webcam. Please check your device settings.');
        $('#faceLoginModal').modal('hide');
        isRecognizing = false;
        return;
    }

    video.addEventListener('playing', () => {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = 'Detecting your face...';

        recognizeFace();
    });
}

// Stop the face recognition process
function stopFaceRecognition() {
    if (!isRecognizing) return;
    isRecognizing = false;

    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    if (canvas) {
        canvas.remove();
    }

    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = '';
}

async function recognizeFace() {
    const statusMessage = document.getElementById('statusMessage');

    // Continuously attempt to recognize the face until successful or modal is closed
    const interval = setInterval(async () => {
        if (!isRecognizing) {
            clearInterval(interval);
            return;
        }

        const results = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();

        if (results.length > 0) {
            const faceDescriptor = results[0].descriptor;
            statusMessage.textContent = 'Face detected. Authenticating...';

            // Convert Float32Array to standard array
            const faceDescriptorArray = Array.from(faceDescriptor);

            // Log the faceDescriptor for debugging
            console.log('Captured Face Descriptor:', faceDescriptorArray);

            // Send the face descriptor to the server for authentication
            const response = await fetch('/api/users/login/face-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ faceDescriptor: faceDescriptorArray })
            });

            try {
                const data = await response.json();
                if (data.message === 'Login successful') {
                    clearInterval(interval);
                    stopFaceRecognition();
                    $('#faceLoginModal').modal('hide');
                    loginUser(data); // Pass user data to handle post-login actions
                } else {
                    statusMessage.textContent = data.message;
                    console.warn(data.message);
                }
            } catch (error) {
                console.error('Error parsing server response:', error);
                statusMessage.textContent = 'An error occurred during authentication.';
            }
        } else {
            statusMessage.textContent = 'No face detected. Please align your face within the frame.';
        }
    }, 3000); // Adjust the interval as needed (e.g., every 3 seconds)
}

// Handle successful login
function loginUser(data) {
    console.log('Logging user in...', data);
    // Store the token (e.g., in localStorage) if needed
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to the homepage or desired page
    window.location.href = '../pages/welcomepage.html';
}

// // function fetchAndPopulateUserDataForEdit() {
// //     const userId = getUserIdFromToken();
// //     const token = getAuthToken();

// //     fetch(`/api/users/details/${userId}`, {
// //         headers: { 'Authorization': `Bearer ${token}` }
// //     })
// //     .then(response => response.json())
// //     .then(data => {
// //         document.getElementById('edit-first-name').value = data.firstName || '';
// //         document.getElementById('edit-last-name').value = data.lastName || '';
// //         document.getElementById('edit-phone').value = data.phone || '';
// //         document.getElementById('edit-address').value = data.address || '';
// //     })
// //     .catch(err => console.error('Failed to fetch user data for edit:', err));
// // }

// async function fetchAndPopulateUserDataForEdit() {
//     const userId = getUserIdFromToken();
//     const token = getAuthToken();

//     if (!userId || !token) {
//         showMessage('User not authenticated.');
//         return;
//     }

//     try {
//         const response = await fetch(`/api/users/details/${userId}`, {
//             method: 'GET',
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         const data = await response.json();
//         if (response.ok) {
//             // Populate the form with existing user data
//             document.getElementById('first-name').value = data.firstName || '';
//             document.getElementById('last-name').value = data.lastName || '';
//             // document.getElementById('gender').value = data.gender || '';
//             // document.getElementById('bdate').value = data.birthDate ? data.birthDate.split('T')[0] : '';
//             // document.getElementById('age').value = data.age || '';
//             document.getElementById('phone').value = data.phone || ''; 
//             // document.getElementById('cstatus').value = data.civilStatus || '';
//             // document.getElementById('wstatus').value = data.workStatus || 'N/A';
//             // document.getElementById('guardian').value = data.guardian || 'N/A';
//             // document.getElementById('id-number').value = data.studentId || '';
//             // document.getElementById('email').value = data.email || '';
//             document.getElementById('address').value = data.address || '';

//             showMessage('User data loaded.', 'success');
//         } else {
//             showMessage(data.message || 'Error fetching user data.');
//         }

//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         showMessage('Error fetching user data.');
//     }
// }

// editProfileForm.addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const updatedData = {
//         firstName: document.getElementById('edit-first-name').value.trim(),
//         lastName: document.getElementById('edit-last-name').value.trim(),
//         phone: document.getElementById('edit-phone').value.trim(),
//         address: document.getElementById('edit-address').value.trim(),
//     };

//     try {
//         const userId = getUserIdFromToken();
//         const token = getAuthToken();

//         const response = await fetch(`/api/users/${userId}`, {
//             method: 'PUT',
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify(updatedData)
//         });

//         const result = await response.json();
//         if (response.ok) {
//             alert('Profile updated successfully!');
//             editPopup.style.display = 'none';
//             fetchAndPopulateUserData(); // Refresh main profile info
//         } else {
//             alert(result.message || 'Failed to update profile.');
//         }
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         alert('An error occurred while updating.');
//     }
// });

// async function handleEditUser(event) {
//     event.preventDefault();
//     showMessage('Updating user information...', 'success');

//     const userId = getUserIdFromToken();
//     const token = getAuthToken();

//     if (!userId || !token) {
//         showMessage('User not authenticated.');
//         return;
//     }

//     const firstName = document.getElementById('firstName').value.trim();
//     const lastName = document.getElementById('lastName').value.trim();
//     const address = document.getElementById('address').value.trim();
//     const phone = document.getElementById('phone').value.trim();
//     const birthDate = document.getElementById('birthDate').value;
//     const gender = document.getElementById('gender').value;
//     const civilStatus = document.getElementById('civilStatus').value.trim();

//     // Basic validation
//     if (!firstName || !lastName || !address || !phone || !birthDate || !gender || !civilStatus) {
//         showMessage('All fields are required.');
//         return;
//     }

//     try {
//         const response = await fetch(`/api/users/${userId}`, {
//             method: 'PUT',
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//                 u_fname: firstName,
//                 u_lname: lastName,
//                 u_address: address,
//                 u_phone: phone,
//                 u_bdate: birthDate,
//                 u_gender: gender,
//                 u_civstatus: civilStatus
//             })
//         });

//         const data = await response.json();
//         if (response.ok) {
//             showMessage(data.message, 'success');
//             // Optionally, update stored user info
//             const user = JSON.parse(localStorage.getItem('user'));
//             user.firstName = firstName;
//             user.lastName = lastName;
//             localStorage.setItem('user', JSON.stringify(user));
//         } else {
//             showMessage(data.message || 'Error updating user information.');
//         }
//     } catch (error) {
//         console.error('Error updating user:', error);
//         showMessage('Error updating user information.');
//     }
// }

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

async function handleSignup(event) {
    event.preventDefault();
    console.log('Handling signup.');

    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    const civilStatus = document.getElementById('civilStatus').value.trim();
    //const workStatus = document.getElementById('wstatus').value;
    //const guardian = document.getElementById('guardian').value;

    // Basic validation || !password ; const password = document.getElementById('password').value;  || !workStatus
    if (!email  || !firstName || !lastName || !studentId || !address || !phone || !birthDate || !gender || !civilStatus) {
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
            //startFaceRecognition('register', email);
            // Open the face recognition popup
            openFaceRecognitionPopup();
        } else {
            showMessage(data.message);
        }
    } catch (error) {
        console.error('Error registering:', error);
        showMessage('Error registering user');
    }
}

// Function to handle signup form submission
async function handleSignup2(event) {
    event.preventDefault();
    console.log('Handling signup.');

    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    const civilStatus = document.getElementById('civilStatus').value.trim();

    // Regex for validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/; // Basic email regex
    const phoneRegex = /^(09|\+639)\d{9}$/; // Valid Philippine phone number

    // Function to calculate age
    function calculateAge(birthDate) {
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDifference = today.getMonth() - birthDateObj.getMonth();
        const dayDifference = today.getDate() - birthDateObj.getDate();

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
            age--;
        }

        return age;
    }

    // Basic validation: Check if all fields are filled
    if (
        !email ||
        !firstName ||
        !lastName ||
        !studentId ||
        !address ||
        !phone ||
        !birthDate ||
        !gender ||
        !civilStatus
    ) {
        showMessage('All fields are required.');
        return;
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.');
        return;
    }

    // Validate phone number format
    if (!phoneRegex.test(phone)) {
        showMessage('Please enter a valid Philippine contact number (e.g., 09123456789 or +639123456789).');
        return;
    }

    // Calculate and validate age
    const age = calculateAge(birthDate);
    if (age < 16) {
        showMessage('You must be at least 16 years old to sign up.');
        return;
    }

    // Optionally, you can provide feedback if the user is close to the age limit
    // For example, if the user is exactly 16 today
    if (age === 16) {
        showMessage('Happy 16th Birthday! You are now eligible to sign up.');
    }

    // Store the form data temporarily
    window.signupData = {
        email,
        firstName,
        lastName,
        studentId,
        address,
        phone,
        birthDate,
        gender,
        civilStatus
    };

    // Open the face recognition popup
    openFaceRecognitionPopup();
}

// Function to open the face recognition popup
function openFaceRecognitionPopup() {
    // Calculate the center position for the popup
    const width = 700;
    const height = 600;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);

    // Open the popup window
    const popup = window.open('face-recognition.html', 'FaceRecognition', `width=${width},height=${height},top=${top},left=${left}`);

    if (!popup) {
        showMessage('Unable to open popup. Please allow popups for this website.');
    }
}

// Function to receive face descriptor from the popup
function receiveFaceDescriptor(descriptor) {
    collectedFaceDescriptor = descriptor;
    console.log('Received face descriptor from popup:', descriptor);
    // Proceed to submit the form data including face descriptor
    submitSignupForm();
}

// Function to submit the signup form data including face descriptor
async function submitSignupForm() {
    if (!window.signupData || !collectedFaceDescriptor) {
        showMessage('Signup data or face descriptor is missing.');
        return;
    }

    const { email, password, firstName, lastName, studentId, address, phone, birthDate, gender, civilStatus } = window.signupData;

    try {
        // Register the user without the face descriptor
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
            showMessage('User registered successfully. Associating face data...', 'success');

            // Now send the face descriptor
            await registerFace(email, collectedFaceDescriptor);

            showMessage('Signup completed successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html'; // Update to the correct page
            }, 2000);
        } else {
            showMessage(data.message);
        }
    } catch (error) {
        console.error('Error registering:', error);
        showMessage('Error registering user');
    }
}

// Function to register the face descriptor with the server
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
        showMessage(data.message, data.success ? 'success' : 'error');

    } catch (error) {
        console.error('Error registering face:', error);
        showMessage('Error registering face');
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
                            await registerFace2(email, faceDescriptor);
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

async function registerFace2(email, faceDescriptor) {
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

// function logout() {
//     // Remove JWT token and user data from localStorage
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
    
//     // Optionally, inform the server about the logout
//     // Uncomment the following lines if you implement a logout endpoint
//     /*
//     fetch('/api/users/logout', {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${getAuthToken()}`
//         }
//     })
//     .then(response => {
//         if (response.ok) {
//             console.log('Logged out successfully on the server.');
//         } else {
//             console.warn('Server logout failed.');
//         }
//     })
//     .catch(error => {
//         console.error('Error during server logout:', error);
//     });
//     */

//     // Redirect to the login page or homepage
//     window.location.href = '../pages/login.html'; // Update the path as needed
// }

function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = type === 'error' ? 'red' : 'green';
        messageDiv.style.display = 'block';
        setTimeout(hideMessage, 10000);
    }
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.style.display = 'none'; // Hide the message container
        messageDiv.textContent = ''; // Clear the message text
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

// Bind the face login event to a button (can be onClick or form submit)
//document.getElementById('loginBtn').addEventListener('click', handleFaceLogin);
// Optionally, handle modal close buttons to stop recognition
document.getElementById('modalCloseBtn').addEventListener('click', () => {
    stopFaceRecognition();
});

document.getElementById('modalCancelBtn').addEventListener('click', () => {
    stopFaceRecognition();
    $('#faceLoginModal').modal('hide'); // Instantly hides the modal
});