let video = null;
let canvas = null;
let faceDescriptor = null;
let captureButton = null; // Declare captureButton in the global scope
const messageDiv = document.getElementById('message'); // Move messageDiv to global scope

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('overlay');
    captureButton = document.getElementById('capture-button'); // Initialize captureButton
    captureButton.disabled = true; // Ensure it's disabled initially

    startFaceRecognition();

    captureButton.addEventListener('click', () => {
        if (faceDescriptor) {
            // Send the face descriptor back to the main window
            const descriptorArray = Array.from(faceDescriptor).map(num => parseFloat(num.toFixed(6)));
            window.opener.receiveFaceDescriptor(descriptorArray);
            window.close();
        } else {
            messageDiv.textContent = 'No face detected. Please try again.';
        }
    });
});

async function startFaceRecognition() {
    try {
        await loadFaceApiModels();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;
        await video.play();

        messageDiv.textContent = 'Looking for your face...';

        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const detectFace = async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({
                minConfidence: 0.3  // Set the minimum confidence level for face detection
            })).withFaceLandmarks().withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (detections.length === 1) {
                faceDescriptor = detections[0].descriptor;
                messageDiv.textContent = 'Face detected. You can capture your face.';
                captureButton.disabled = false; // Enable the button
            } else if (detections.length > 1) {
                messageDiv.textContent = 'Multiple faces detected. Please ensure only your face is visible.';
                captureButton.disabled = true; // Disable the button
            } else {
                messageDiv.textContent = 'No face detected. Please ensure your face is visible.';
                captureButton.disabled = true; // Disable the button
            }

            // Continue detecting until a single face is detected
            if (!faceDescriptor) {
                requestAnimationFrame(detectFace);
            }
        };

        detectFace();

    } catch (error) {
        console.error('Error accessing camera:', error);
        messageDiv.textContent = 'Error accessing camera. Please allow camera access and try again.';
    }
}

async function loadFaceApiModels() {
    const modelUrl = '../models';  // Path to your models directory
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl); // Load the ssdMobilenetv1 model
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);  // Load the face landmarks model
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl); // Load the face recognition model
}
