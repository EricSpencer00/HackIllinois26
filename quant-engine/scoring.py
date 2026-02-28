"""
SCORING & AI INFERENCE LOGIC
- Interacts with: The Groq API (using the groq python package).
- Purpose: Takes the giant block of scraped context and the user's question, constructs 
  a strict prompt, and sends it to the LLM.
- Parses the LLM's response to extract the specific confidence score and sentiment.
"""