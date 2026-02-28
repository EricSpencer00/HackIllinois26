"""
SCORING & AI INFERENCE LOGIC
- Interacts with: The Groq API (using the groq python package).
- Purpose: Takes the giant block of scraped context and the user's question, constructs 
  a strict prompt, and sends it to the LLM.
- Parses the LLM's response to extract the specific confidence score and sentiment.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load your secret keys from the .env file
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize the Groq client
client = Groq(api_key=GROQ_API_KEY)

def get_trade_confidence(question: str, context: str) -> dict:
    """
    Sends the user's trade question and scraped context to Groq.
    Forces the AI to return a JSON object with a confidence score.
    """
    if not GROQ_API_KEY:
        return {"error": "Missing GROQ_API_KEY in .env"}

    # We use a system prompt to force the AI to act like a quant and return pure JSON
    system_prompt = """
    You are an expert quantitative analyst. 
    Analyze the user's trade question using the provided context. 
    You MUST respond with ONLY a valid JSON object in this exact format:
    {"confidence_score": 85, "sentiment": "bullish", "reasoning": "Keep it under 2 sentences."}
    Do not include any markdown formatting like ```json.
    """

    user_prompt = f"Question: {question}\nContext: {context}"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # Using Llama 3 8B because it is blazing fast on Groq
            model="llama-3.3-70b-versatile", 
            temperature=0.2, # Low temperature for more analytical/consistent answers
        )

        # Extract the text response and parse it as JSON
        ai_response_text = response.choices[0].message.content.strip()
        
        # Parse the string into a Python dictionary
        return json.loads(ai_response_text)

    except Exception as e:
        return {"error": f"Groq inference failed: {str(e)}"}