# AI-Powered Communication Practice Platform 🎙️

This is a full-stack web application built with Python and Google Gemini to serve as an AI-powered speaking coach. It enables users to practice real-time voice conversations in various dynamic scenarios and receive instant, detailed feedback on their performance.

### Live Demo
[https://ai-powered-communication-practice-qit9.onrender.com/]

---
## ✨ Key Features

* **Real-time Voice Conversation:** Engage in natural, voice-based conversations directly in your browser.
* **Multiple Scenarios:** Practice in three distinct, fully implemented modes:
    * **💼 Interview Simulation:** A back-and-forth Q&A with an AI interviewer.
    * **🗣️ Free Topic:** A monologue-style evaluation where you speak on a topic of your choice.
    * **👥 Group Discussion:** A dynamic conversation where the AI plays two other participants with differing viewpoints.
* **AI-Powered Feedback:** Receive a detailed report card after each session analyzing metrics like fluency, grammar, filler word usage, and tone.
* **Persistent Session History:** All completed sessions and feedback reports are saved to a cloud database, allowing you to track your progress over time for each scenario.

---
## 💻 Technology Stack

* **Backend:** Python, Flask, Gunicorn
* **Frontend:** JavaScript (ES6+), HTML5, CSS3, Web Speech API
* **AI & NLP:** Google Gemini API, Prompt Engineering
* **Database:** MongoDB (via MongoDB Atlas)
* **Deployment:** Render, Git, GitHub

---
## ⚠️ Browser Compatibility

This project relies heavily on the **Web Speech API** for voice recognition and synthesis. This API is still considered experimental and has the best support on desktop versions of **Google Chrome**.

While it may work on other browsers, functionality (especially continuous speech recognition) can be inconsistent. For the best experience, please use a modern version of Chrome on a desktop or laptop.

---
## 🚀 Setup and Installation

Follow these steps to get the project running on your local machine.

#### 1. Prerequisites
* Git
* Python 3.10+
* A Google AI API Key (for the Gemini model)
* A MongoDB Atlas connection string

#### 2. Clone the Repository

```bash


git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

3. Set Up a Virtual Environment
It's recommended to use a virtual environment to manage dependencies.

For Windows:

python -m venv venv
venv\Scripts\activate

For macOS/Linux:

python3 -m venv venv
source venv/bin/activate

4. Install Dependencies
pip install -r requirements.txt

⚙️ Configuration
The application requires secret keys to connect to the AI and the database.

Create a file named .env in the root directory of the project.

Add the following content to the .env file, replacing the placeholder values with your actual keys:

GEMINI_API_KEY="your-google-gemini-api-key-here"
MONGO_URI="your-mongodb-atlas-connection-string-here"

▶️ How to Run
Make sure your virtual environment is activated.

Run the Flask application:

python main.py

Open your web browser and navigate to:

[http://127.0.0.1:5000](http://127.0.0.1:5000)

📂 Project Structure
.
├── main.py           # Flask backend server, AI logic, and DB operations
├── templates/
│   └── index.html    # Main HTML file for the user interface
├── static/
│   ├── script.js     # Frontend JavaScript for all interactivity
│   └── style.css     # All CSS styles
├── .env              # Stores secret keys (API key, DB URI)
├── requirements.txt  # Python dependencies
└── README.md         # You are here!

🔮 Future Features
Implement remaining practice scenarios:

Presentation Practice

Networking Conversation

Storytelling

Build a user dashboard to visualize progress over time.

Add user authentication to support multiple users.