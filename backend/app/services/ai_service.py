import google.generativeai as genai
from app.config.settings import settings
from app.config.gemini import model

genai.configure(
    api_key=settings.GEMINI_API_KEY
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

def explain_code(language, code):

    prompt = f"""
You are an expert programming mentor.

Explain this {language} code.

Keep the explanation beginner friendly and short.

Code:

{code}
"""

    response = model.generate_content(prompt)

    return response.text

def autocomplete(language, code):

    prompt = f"""
    You are an expert programming assistant.
    
    Continue the following {language} code.
    
    Rules:
    - Continue from exactly where the code ends.
    - Do NOT rewrite existing code.
    - Return ONLY the missing continuation.
    - No markdown.
    - No explanation.
    
    Code:
    
    {code}
    """

    response = model.generate_content(prompt)
    return response.text

print(settings.GEMINI_API_KEY)

def generate_code(language, prompt):

    prompt = f"""
You are an expert {language} programmer.
Generate clean production-ready {language} code.
Return ONLY code.Do not use any comment give only the code
Give a short explanation

Task:
{prompt}
"""

    response = model.generate_content(prompt)

    return response.text

def generate_mom(transcript):

    prompt = f"""
You are a Senior Software Engineering Meeting Assistant.

Analyze this coding meeting.

Return ONLY JSON.

{{
"summary":"",
"action_items":[],
"decisions":[],
"questions":[],
"bugs":[],
"suggestions":[]
}}

Transcript:

{transcript}
"""

    response = model.generate_content(prompt)

    return response.text