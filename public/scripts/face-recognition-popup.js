let video = null;
let canvas = null;
let faceDescriptor = null;
let captureButton = null;
let messageDiv = null;
let stream = null; // Camera stream for stopping later

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('overlay');
    captureButton = document.getElementById('capture-button');
    messageDiv = document.getElementById('message');

    console.log('DOM fully loaded and parsed.');

    // Initialize Face Recognition
    startFaceRecognition();

    // Handle Capture Button Click
    captureButton.addEventListener('click', () => {
        if (faceDescriptor) {
            console.log('Captured Face Descriptor:', faceDescriptor);
            const descriptorArray = Array.from(faceDescriptor).map(num => parseFloat(num.toFixed(6)));
            if (window.opener && typeof window.opener.receiveFaceDescriptor === 'function') {
                window.opener.receiveFaceDescriptor(descriptorArray); // Send to main window
                console.log('Face descriptor sent to main window.');
            } else {
                console.error('Main window does not have a receiveFaceDescriptor function.');
                messageDiv.textContent = 'Error: Unable to send face descriptor to the main window.';
            }
            stopCamera();
            window.close();
        } else {
            messageDiv.textContent = 'No face detected. Please try again.';
        }
    });
});

async function startFaceRecognition() {
    try {
        console.log('Loading models...');
        await loadFaceApiModels();
        console.log('Models loaded successfully.');

        console.log('Accessing camera...');
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;

        // Attach the event listener before playing the video
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded.');
            // Set canvas dimensions to match video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);

            // Calculate display size based on video metadata
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);
            console.log('Face API dimensions matched.');

            // Start face detection with the correct display size
            detectFace(displaySize);
        });

        await video.play();
        console.log('Camera accessed and video playing.');

        // Check if metadata is already loaded (for cached videos)
        if (video.readyState >= 1) { // HAVE_METADATA
            console.log('Video metadata already loaded.');
            // Manually trigger the event handler
            video.dispatchEvent(new Event('loadedmetadata'));
        }

        messageDiv.textContent = 'Looking for your face...';
    } catch (error) {
        console.error('Error initializing face recognition:', error);
        messageDiv.textContent = `Error: ${error.message}`;
    }
}

async function detectFace(displaySize) {
    const context = canvas.getContext('2d');
    const detectLoop = async () => {
        try {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.75 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            console.log(`Detections count: ${detections.length}`);

            if (detections.length === 1) {
                faceDescriptor = detections[0].descriptor;
                messageDiv.textContent = 'Face detected. You can capture your face.';
                captureButton.disabled = false;
                console.log('Single face detected.');
            } else if (detections.length > 1) {
                messageDiv.textContent = 'Multiple faces detected. Please show only your face.';
                captureButton.disabled = true;
                console.log('Multiple faces detected.');
            } else {
                messageDiv.textContent = 'No face detected. Ensure your face is visible.';
                captureButton.disabled = true;
                console.log('No face detected.');
            }

            requestAnimationFrame(detectLoop);
        } catch (error) {
            console.error('Face detection error:', error);
            messageDiv.textContent = 'An error occurred during detection.';
        }
    };

    detectLoop();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        console.log('Camera stopped.');
    }
}

async function loadFaceApiModels() {
    try {
        const modelUrl = '../models'; // Path to your models directory
        console.log(`Loading models from: ${modelUrl}`);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
        console.log('SSD Mobilenetv1 model loaded.');
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        console.log('Face Landmark68 model loaded.');
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        console.log('Face Recognition model loaded.');
    } catch (error) {
        console.error('Error loading Face API models:', error);
        throw error; // Re-throw to be caught in startFaceRecognition
    }
}
