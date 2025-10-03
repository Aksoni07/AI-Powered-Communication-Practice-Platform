// --- DOM Element References ---
const scenarioSelection = document.getElementById('scenario-selection');
const practiceArea = document.getElementById('practice-area');
const feedbackReport = document.getElementById('feedback-report');
const interviewBtn = document.getElementById('interview-btn');
const freeTopicBtn = document.getElementById('free-topic-btn');
const groupDiscussionBtn = document.getElementById('group-discussion-btn');
const scenarioTitle = document.getElementById('scenario-title');
const transcriptContainer = document.getElementById('transcript-container');
const recordBtn = document.getElementById('record-btn');
const endSessionBtn = document.getElementById('end-session-btn');
const statusDiv = document.getElementById('status');
const feedbackContent = document.getElementById('feedback-content');
const practiceAgainBtn = document.getElementById('practice-again-btn');
const viewProgressBtn = document.getElementById('view-progress-btn');
const progressOverview = document.getElementById('progress-overview');
const sessionDetails = document.getElementById('session-details');
const historyInterviewBtn = document.getElementById('history-interview-btn');
const historyFreeTopicBtn = document.getElementById('history-free-topic-btn');
const historyGroupDiscussionBtn = document.getElementById('history-group-discussion-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const historyTitle = document.getElementById('history-title');
const historyListContainer = document.getElementById('history-list-container');
const backToProgressBtn = document.getElementById('back-to-progress-btn');

// --- State Management ---
let isRecording = false;
let fullTranscript = "";
let recognition;
let availableVoices = [];
let finalizedTranscriptForTurn = "";
let currentScenario = "";

const BACKEND_URL = '/generate';

// --- Voice & Speech Recognition Setup ---
function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
}
loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

function speakText(text) {
    window.speechSynthesis.cancel();
    const cleanedText = text.replace(/\(.*?\)|\*.*?\*|\[.*?\]/g, "").trim();
    if (!cleanedText) return;
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const preferredVoices = ["Google US English", "Microsoft Zira - English (United States)", "Samantha", "Zara"];
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
        selectedVoice = availableVoices.find(voice => voice.name === voiceName);
        if (selectedVoice) break;
    }
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(voice => voice.lang === 'en-US');
    }
    utterance.voice = selectedVoice;
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
        statusDiv.textContent = "Listening... Click 'Stop Speaking' when you are finished.";
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.text').textContent = 'Stop Speaking';
    };
    recognition.onend = () => {
        statusDiv.textContent = "Processing...";
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('.text').textContent = 'Start Speaking';
        if (finalizedTranscriptForTurn) {
            handleUserSpeech(finalizedTranscriptForTurn);
        }
    };
    recognition.onresult = (event) => {
        let interim_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalizedTranscriptForTurn += event.results[i][0].transcript + ' ';
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
    };
}

recordBtn.addEventListener('click', () => {
    if (!isRecording) {
        finalizedTranscriptForTurn = "";
        isRecording = true;
        recognition.start();
    } else {
        isRecording = false;
        recognition.stop();
    }
});

// --- Core App Logic ---
function showScreen(screenToShow) {
    [scenarioSelection, practiceArea, feedbackReport, progressOverview, sessionDetails].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
}

function startScenario(title, scenario) {
    currentScenario = scenario;
    showScreen(practiceArea);
    scenarioTitle.textContent = title;
    fullTranscript = "";
    transcriptContainer.innerHTML = `<p class="system-message">The session will now begin...</p>`;
    handleUserSpeech(null);
    endSessionBtn.disabled = false;
}

// CORRECTED VERSION of handleUserSpeech
async function handleUserSpeech(userText) {
    if (userText) {
        appendMessage(userText, 'user-speech', 'You');
        fullTranscript += `User: ${userText}\n`;
    }
    statusDiv.textContent = "AI is thinking...";
    if (currentScenario === 'free_topic' && fullTranscript.includes("AI:")) {
        statusDiv.textContent = "Continue speaking. Click 'End Session' when finished.";
        return;
    }

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullTranscript || "start", mode: currentScenario })
        });


        const data = await response.json();

        // All logic that USES 'data' must also be inside this 'try' block
        if (data.response) {
            speakText(data.response);

            let speakerName = 'AI';
            let messageText = data.response;

            if (currentScenario === 'group_discussion' && data.response.includes(':')) {
                const parts = data.response.split(/:(.*)/s);
                speakerName = parts[0];
                messageText = parts[1] || '';
            } else if (currentScenario === 'interview') {
                speakerName = 'Zara (Interviewer)';
            } else if (currentScenario === 'free_topic') {
                speakerName = 'Kai (Coach)';
            }

            appendMessage(messageText, 'ai-speech', speakerName);
            fullTranscript += `AI: ${data.response}\n`;
        } else if (currentScenario !== 'free_topic') {
            appendMessage("An error occurred. Please try again.", 'system-message', 'System');
        }

    } catch (error) {

        appendMessage("Could not connect to the AI.", 'system-message', 'System');
        console.error("Fetch error:", error);
    }

    statusDiv.textContent = "Idle. Click 'Start Speaking' to reply.";
}

async function getFeedback() {
    showScreen(feedbackReport);
    feedbackContent.innerHTML = "<p>Analyzing your performance...</p>";
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullTranscript, mode: 'feedback', scenario: currentScenario })
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        if (data.feedback) {
            const feedbackJson = JSON.parse(data.feedback);
            displayFeedback(feedbackJson, feedbackContent);
        } else {
            feedbackContent.innerHTML = `<p>Error generating feedback.</p>`;
        }
    } catch (error) {
        feedbackContent.innerHTML = "<p>Could not generate feedback. Check server logs.</p>";
    }
}

function appendMessage(text, className, speaker) {
    if (!text.trim()) return;
    const p = document.createElement('p');
    p.className = className;
    p.innerHTML = `<strong>${speaker}:</strong> ${text}`;
    transcriptContainer.appendChild(p);
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
}

function displayFeedback(feedback, targetElement) {
    let html = `
        <h3>Overall Fluency Score</h3>
        <p class="score">${feedback.overall_fluency_score}/10</p>
        <p class="score-label">${feedback.tone_and_energy}</p>
        <h3>Grammar & Sentence Structure</h3>`;
    if (feedback.grammar_and_sentence_structure && feedback.grammar_and_sentence_structure.length > 0) {
        feedback.grammar_and_sentence_structure.forEach(item => {
            html += `<div class="feedback-item"><p><strong>Error:</strong> ${item.error}</p><p><strong>Correction:</strong> ${item.correction}</p></div>`;
        });
    } else {
        html += "<p>No grammar errors detected. Great job!</p>";
    }
    html += `<h3>Vocabulary Suggestions</h3>`;
    if (feedback.vocabulary_suggestions && feedback.vocabulary_suggestions.length > 0) {
        feedback.vocabulary_suggestions.forEach(item => {
            html += `<div class="feedback-item"><p><strong>Original:</strong> "${item.original_word}" in "${item.context}"</p><p><strong>Suggestion:</strong> "${item.suggested_word}"</p></div>`;
        });
    } else {
        html += "<p>Your vocabulary was appropriate for the context.</p>";
    }
    html += `<h3>Filler Words Count</h3>`;
    const fillerWords = feedback.filler_words_count ? Object.entries(feedback.filler_words_count).map(([key, value]) => `${key}: ${value}`).join(', ') : 'Not available.';
    html += `<div class="feedback-item"><p>${fillerWords}</p></div>`;
    targetElement.innerHTML = html;
}

// --- History & Progress Functions ---
async function fetchHistory(scenarioType, title) {
    showScreen(sessionDetails);
    historyTitle.textContent = title;
    historyListContainer.innerHTML = "<p>Loading history...</p>";
    try {
        const response = await fetch(`/history/${scenarioType}`);
        const sessions = await response.json();
        if (sessions.error) throw new Error(sessions.error);
        if (sessions.length === 0) {
            historyListContainer.innerHTML = "<p>No sessions found for this scenario.</p>";
            return;
        }
        displayHistoryList(sessions);
    } catch (error) {
        historyListContainer.innerHTML = "<p>Could not load history.</p>";
    }
}

function formatTranscript(transcript) {
    let html = '';
    const lines = transcript.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
        if (line.startsWith('User:')) {
            html += `<p class="user-speech">${line.replace('User:', '<strong>You:</strong>')}</p>`;
        } else if (line.startsWith('AI:')) {
            const aiLine = line.substring(4);
            if (aiLine.includes(':')) {
                const parts = aiLine.split(/:(.*)/s);
                const speaker = parts[0];
                const message = parts[1] || '';
                html += `<p class="ai-speech"><strong>${speaker}:</strong>${message}</p>`;
            } else {
                html += `<p class="ai-speech"><strong>AI:</strong> ${aiLine}</p>`;
            }
        }
    });
    return html;
}

function displayHistoryList(sessions) {
    let html = "";
    sessions.forEach(session => {
        const date = new Date(session.created_at).toLocaleString();
        const transcript_escaped = session.transcript.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
        const feedback_escaped = session.feedback_json.replace(/'/g, "&apos;");
        html += `
            <div class="history-item" data-transcript='${transcript_escaped}' data-feedback='${feedback_escaped}'>
                <div class="history-item-header">
                    <p>${date}</p>
                    <p class="score">${session.fluency_score}/10</p>
                </div>
                <div class="history-item-content"></div>
            </div>`;
    });
    historyListContainer.innerHTML = html;

    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const contentDiv = item.querySelector('.history-item-content');
            const isVisible = contentDiv.style.display === 'block';
            if (isVisible) {
                contentDiv.style.display = 'none';
                contentDiv.innerHTML = '';
            } else {
                contentDiv.style.display = 'block';
                const transcriptData = item.dataset.transcript;
                const feedbackData = JSON.parse(item.dataset.feedback);

                const formattedTranscript = formatTranscript(transcriptData);
                let contentHtml = `<h5>Conversation Transcript</h5><div class="transcript-block">${formattedTranscript}</div>`;

                let feedbackContainer = document.createElement('div');
                displayFeedback(feedbackData, feedbackContainer);

                contentDiv.innerHTML = contentHtml;
                contentDiv.appendChild(feedbackContainer);
            }
        });
    });
}


endSessionBtn.addEventListener('click', () => {
    if (isRecording) {
        isRecording = false;
        recognition.stop();
    }
    getFeedback();
});


// --- Event Listeners ---
interviewBtn.addEventListener('click', () => startScenario('Interview Simulation', 'interview'));
freeTopicBtn.addEventListener('click', () => startScenario('Free Topic', 'free_topic'));
groupDiscussionBtn.addEventListener('click', () => startScenario('Group Discussion', 'group_discussion'));
practiceAgainBtn.addEventListener('click', () => showScreen(scenarioSelection));
viewProgressBtn.addEventListener('click', () => showScreen(progressOverview));
backToMainBtn.addEventListener('click', () => showScreen(scenarioSelection));
backToProgressBtn.addEventListener('click', () => showScreen(progressOverview));
historyInterviewBtn.addEventListener('click', () => fetchHistory('interview', 'Interview History'));
historyFreeTopicBtn.addEventListener('click', () => fetchHistory('free_topic', 'Free Topic History'));
historyGroupDiscussionBtn.addEventListener('click', () => fetchHistory('group_discussion', 'Group Discussion History'));