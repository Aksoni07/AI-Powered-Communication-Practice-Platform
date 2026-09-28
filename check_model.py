# check_models.py
from groq import Groq
import os
from dotenv import load_dotenv

# Load the .env file to get the API key
load_dotenv()

try:
    # Configure the API key
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in .env file.")

    client = Groq(api_key=api_key)

    print("\n--- Finding available models for your API key ---\n")

    # List all models currently available on Groq
    for m in client.models.list().data:
        print(f"✅ Found usable model: {m.id}")

    print("\n--- Finished ---\n")

except Exception as e:
    print(f"An error occurred: {e}")
