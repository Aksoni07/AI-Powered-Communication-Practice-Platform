# check_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load the .env file to get the API key
load_dotenv()

try:
    # Configure the API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file.")

    genai.configure(api_key=api_key)

    print("\n--- Finding available models for your API key ---\n")

    # List all available models and check if they support 'generateContent'
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Found usable model: {m.name}")

    print("\n--- Finished ---\n")

except Exception as e:
    print(f"An error occurred: {e}")