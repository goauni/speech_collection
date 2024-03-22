        let recordedChunks = [];
        let mediaRecorder;
        let csvLines = [];
        let currentUser = null;
        let currentLineIndexes = {};
        let recordingInterval;
        let audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let audioChunks = [];
        let audioBlobUrl;
        let userId;

        const userPasswords = {
            "user1": "password1",
            "user2": "password2",
            "user3": "password3",
            "user4": "password4",
            "user5": "password5",
            "user6": "password6"
        };

        const lineRange = {
            "user1": { start: 1, end: 6050 },
            "user2": { start: 6051, end: 12100 },
            "user3": { start: 12100, end: 18150 },
            "user4": { start: 18150, end: 24200 },
            "user5": { start: 24200, end: 30250 },
            "user6": { start: 30250, end: 363001 }
        };

        function handleFile() {
            const selectedUser = document.getElementById('userSelect').value;
            const password = document.getElementById('password').value;
            if (userPasswords[selectedUser] === password) {
                currentUser = selectedUser;
                userId = document.getElementById('lineNumber').value; // Assign the ID when handling the file
                if (!(currentUser in currentLineIndexes)) {
                    currentLineIndexes[currentUser] = lineRange[currentUser].start;
                }
                const fileInput = document.getElementById('csvFileInput');
                const file = fileInput.files[0];

                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const csvData = e.target.result;
                        csvLines = csvData.split('\n');
                        displayCurrentLine();
                    };
                    reader.readAsText(file);
                }
            } else {
                alert("Invalid password. Please try again.");
            }
        }

        function displayCurrentLine() {
            if (currentUser !== null && currentLineIndexes[currentUser] >= lineRange[currentUser].start && currentLineIndexes[currentUser] <= lineRange[currentUser].end) {
                document.getElementById('csvData').innerText = csvLines[currentLineIndexes[currentUser] - 1];
            } else {
                document.getElementById('csvData').innerText = "No data available.";
            }
        }

        function toggleRecording() {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                startRecording();
            } else {
                stopRecording();
            }
        }

        let isRecording = false;

        function startRecording() {
            if (!isRecording) {
                recordedChunks = []; // Clear the previous recording
                isRecording = true;
                document.getElementById('recordButton').classList.add('recording'); // Change button color
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.ondataavailable = e => {
                            recordedChunks.push(e.data);
                        };
                        mediaRecorder.onstop = () => {
                            const recordedBlob = new Blob(recordedChunks, { type: 'audio/wav' });
                            const audioUrl = URL.createObjectURL(recordedBlob);
                            const audioPlayer = document.getElementById('audioPlayer');
                            audioPlayer.src = audioUrl;
                            isRecording = false;
                            document.getElementById('recordButton').classList.remove('recording'); // Return button color to normal
                        };
                        mediaRecorder.start();
                    })
                    .catch(err => {
                        console.error('Error accessing microphone:', err);
                    });
            }
        }

        function stopRecording() {
            if (isRecording) {
                mediaRecorder.stop();
            }
        }

        function togglePlayAudio() {
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer.paused) {
                audioPlayer.play();
                document.getElementById('playButton').innerText = 'Pause';
            } else {
                audioPlayer.pause();
                document.getElementById('playButton').innerText = 'Play';
            }
        }

        function submitData() {
            // Get the current line displayed in the csvData div
            const currentLine = document.getElementById('csvData').innerText;

            // Extract the ID from the current line
            const id = currentLine.split(',')[0].trim();

            // Get the audio element
            const audioPlayer = document.getElementById('audioPlayer');

            // Get the audio source URL
            const audioUrl = audioPlayer.src;

            console.log("Audio URL:", audioUrl); // Debugging statement

            // Fetch the audio data as a Blob
            fetch(audioUrl)
                .then(response => {
                    console.log("Fetch response:", response); // Debugging statement
                    return response.blob();
                })
                .then(blob => {
                    console.log("Audio Blob:", blob); // Debugging statement

                    // Create a filename with the extracted ID
                    const filename = id + ".wav";

                    // Create a download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = filename;

                    // Trigger a click event on the download link
                    downloadLink.click();
                })
                .catch(error => {
                    console.error('Error fetching audio data:', error);
                });

            // Move to the next line
            currentLineIndexes[currentUser]++;
            displayCurrentLine();
        }


        // Function to go to the specified line number
        function goToLine() {
            const lineInput = document.getElementById('lineNumber').value;
            if (lineInput >= lineRange[currentUser].start && lineInput <= lineRange[currentUser].end) {
                currentLineIndexes[currentUser] = parseInt(lineInput);
                displayCurrentLine();
            } else {
                alert("Please enter a valid line number within the specified range.");
            }
        }

        // Enable the upload button when both username and password are provided
        document.getElementById('password').addEventListener('input', function() {
            const selectedUser = document.getElementById('userSelect').value;
            const password = document.getElementById('password').value;
            const uploadButton = document.getElementById('uploadButton');
            if (userPasswords[selectedUser] === password) {
                uploadButton.disabled = false;
            } else {
                uploadButton.disabled = true;
            }
        });
