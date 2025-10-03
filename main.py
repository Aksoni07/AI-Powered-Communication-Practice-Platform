import os
import sqlite3
import json
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE = 'practice_history.db'

DATABASE_URL = os.getenv('DATABASE_URL')

# --- Database Initialization ---
def init_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                scenario_type VARCHAR(255) NOT NULL,
                transcript TEXT NOT NULL,
                feedback_json TEXT NOT NULL,
                fluency_score INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"🔴 Database initialization error: {e}")

# --- Function to save a session to the database ---
def save_session_to_db(scenario, transcript, feedback_text):
    try:
        feedback_data = json.loads(feedback_text)
        score_value = feedback_data.get('overall_fluency_score')
        score = None
        try:
            score = int(score_value)
        except (ValueError, TypeError):
            pass
        
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (scenario_type, transcript, feedback_json, fluency_score) VALUES (%s, %s, %s, %s)",
            (scenario, transcript, feedback_text, score)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"🔴 Error saving session to DB: {e}")

# --- AI Configuration ---
try:
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file or environment.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('models/gemini-pro-latest')
except Exception as e:
    print(f"🔴 Error configuring API key: {e}")
    exit()

# --- Prompts ---
INTERVIEW_PROMPT = """
You are an expert HR interviewer named Zara. You are conducting a realistic, helpful, and friendly mock job interview. Your task is to engage in a back-and-forth conversation based on the provided transcript. The last message is from the user. Your response should be the next logical thing an interviewer would say.
RULES:
1. If the transcript is empty or just says "start", begin the interview with a friendly greeting and your first question (e.g., "Walk me through your resume...").
2. For all other turns, continue the conversation naturally based on the user's last response. Ask follow-up questions or move to a new topic.
3. NEVER include stage directions like (smiles) in your response. Your response should ONLY be the words you would speak out loud.
4. Keep your responses concise and focused. Ask one primary question at a time.
"""

FREE_TOPIC_PROMPT = """
You are an AI speaking evaluator named Kai. Your goal is to provide a starting prompt for a user's free-topic speech and then remain silent to allow them to speak uninterrupted.

Your task:
1.  **If the conversation history is empty**, respond with the exact welcoming instruction below. This is the only time you will speak.
2.  **For any other turn (if the history has content)**, you must respond with an empty string ("") to avoid interrupting the user.

Here is the welcoming instruction for the first turn:
"Welcome to the Free Topic evaluation. My name is Kai, and I'll be your speaking evaluator. This session is designed to help you understand your strengths when speaking spontaneously. Please choose any topic you are comfortable with. When you're ready, you can begin. I'll be listening quietly."
"""

FEEDBACK_PROMPT = """
You are an expert English language coach. Analyze the complete conversation transcript provided below to provide a detailed, constructive feedback report.
The report must be in a valid JSON format only, with no other text before or after the JSON object.
The JSON object must have the following keys:
- "grammar_and_sentence_structure": An array of objects. Each object should have "error" and "correction".
- "vocabulary_suggestions": An array of objects. Each object should have "original_word", "suggested_word", and "context".
- "filler_words_count": An object counting occurrences of "uh", "um", "like", "you know".
- "tone_and_energy": A brief, one-sentence analysis.
- "overall_fluency_score": A single integer score from 0 to 10.

Here is the transcript:
---
{transcript}
---
Now, generate the JSON feedback report.
"""


# This new prompt was added to your main.py file

GROUP_DISCUSSION_PROMPT = """
You are an AI moderator for a group discussion. You will also play two distinct characters: Ben and Chloe. The user is the third participant.

Your Personas:
- Ben: He is analytical and tends to play devil's advocate. He likes to question assumptions.
- Chloe: She is creative and focuses on possibilities and positive outcomes. She likes to build on ideas.
- Moderator: You (as the AI) will only act as the Moderator on the very first turn to set up the topic.

Your Task:
Read the conversation history. Based on the last speaker's point, generate a response from the next logical speaker. Your response MUST start with the persona's name followed by a colon.

RULES:
1.  **Turn 1 (History is empty):** Act as the Moderator. Your response must be only: "Moderator: Welcome to the group discussion. To start, what topic would you like to introduce for us to discuss?"
2.  **Turn 2 (User has introduced a topic):** Have Chloe respond first with an enthusiastic or supportive opening thought on the user's topic. Her response must start with "Chloe:".
3.  **Subsequent Turns:** Read the last speaker's point. Generate a response from the *other* persona (if Chloe spoke last, Ben speaks now; if Ben spoke last, Chloe speaks now).
4.  Your response must only be from ONE persona per turn.
5.  Keep your points concise to encourage back-and-forth.
"""

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history/<scenario_type>', methods=['GET'])
def get_history(scenario_type):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, scenario_type, transcript, feedback_json, fluency_score, created_at FROM sessions WHERE scenario_type = %s ORDER BY created_at DESC",
            (scenario_type,)
        )
        # Fetch column names from the cursor description
        columns = [desc[0] for desc in cursor.description]
        sessions = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(sessions)
    except Exception as e:
        print(f"🔴 Error fetching history: {e}")
        return jsonify({"error": str(e)}), 500
    



@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        data = request.json
        conversation_history = data['prompt']
        mode = data['mode']
        full_prompt = ""

        if mode == 'interview':
            full_prompt = f"{INTERVIEW_PROMPT}\n\nCONVERSATION HISTORY:\n---\n{conversation_history}\n---\nZara:"
        elif mode == 'free_topic':
            full_prompt = f"{FREE_TOPIC_PROMPT}\n\nCONVERSATION HISTORY:\n---\n{conversation_history}\n---\nKai:"
        elif mode == 'group_discussion':
            full_prompt = f"{GROUP_DISCUSSION_PROMPT}\n\nCONVERSATION HISTORY:\n---\n{conversation_history}\n---\n"
        elif mode == 'feedback':
            scenario_for_db = data.get('scenario', 'unknown')
            full_prompt = FEEDBACK_PROMPT.format(transcript=conversation_history)
            response = model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
            )
            save_session_to_db(scenario_for_db, conversation_history, response.text)
            return jsonify({"feedback": response.text})

        if full_prompt:
            response = model.generate_content(full_prompt)
            return jsonify({"response": response.text})

    except Exception as e:
        print(f"🔴 An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)