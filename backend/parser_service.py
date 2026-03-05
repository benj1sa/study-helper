"""
Parser service for processing syllabus images.
Adapted from parser/parser.py to work as a service module.
"""
import os
import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional
from io import BytesIO
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image


# Load environment variables
load_dotenv()
GOOGLE_GEMINI_KEY = os.getenv("GOOGLE_GEMINI_KEY")


def build_system_prompt() -> str:
    """Build the system prompt with explosion logic rules."""
    return """You are a syllabus parser. Extract information from this syllabus image and convert it to structured JSON.

CRITICAL RULES - You MUST follow these exactly:

1. RANGE EXPANSION: If you see "12-15", you MUST expand it to an array: ["12", "13", "14", "15"]
   - Same for any numeric range (e.g., "3-7" → ["3", "4", "5", "6", "7"])

2. SUB-PROBLEM SPLITTING: If you see "6ab", you MUST split it to: ["6a", "6b"]
   - Same for any letter combinations (e.g., "10abc" → ["10a", "10b", "10c"])

3. NOISE REMOVAL: Ignore rows that are NOT problem sets:
   - Skip rows like "Snow Day", "Exam 1", "Midterm", "Holiday", "No Class", etc.

4. JSON STRUCTURE: Output must match this exact schema:
{
  "course_title": "string",
  "topics": [
    {
      "id": "topic_XXX",
      "date": "string",
      "name": "string",
      "problems": [
        {
          "id": "abbreviation_label",
          "label": "string",
          "history": []
        }
      ]
    }
  ]
}

5. ID GENERATION:
   - Topic ID: "topic_001", "topic_002", etc. (sequential)
   - Problem ID: Use topic abbreviation + underscore + label
     * Example: Topic "Binary Search Trees" → abbreviation "bst", problem "1a" → id "bst_1a"

Extract all information from the syllabus table. Apply the explosion rules to create individual problem entries for each problem number/sub-problem. Output ONLY the JSON, no additional text."""


def call_gemini_api(image: Image.Image) -> Optional[str]:
    """Call Google Gemini Vision API to parse the syllabus."""
    if not GOOGLE_GEMINI_KEY:
        raise ValueError(
            "Google Gemini API key not configured. "
            "The syllabus upload feature requires a Google Gemini API key. "
            "To enable this feature:\n"
            "1. Get an API key from https://makersuite.google.com/app/apikey\n"
            "2. Create a .env file in the backend directory\n"
            "3. Add: GOOGLE_GEMINI_KEY=your_api_key_here\n"
            "4. Restart the backend server\n\n"
            "Note: The application works without an API key, but the syllabus upload feature will be disabled."
        )
    
    model_names = [
        'gemini-pro',
        'gemini-1.0-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-2.5-flash',
    ]
    
    try:
        genai.configure(api_key=GOOGLE_GEMINI_KEY)
        
        last_error = None
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                prompt = build_system_prompt()
                response = model.generate_content([prompt, image])
                
                if not response.text:
                    continue
                
                return response.text.strip()
            except Exception as e:
                last_error = e
                continue
        
        raise Exception(f"All model attempts failed. Last error: {last_error}")
    
    except Exception as e:
        raise Exception(f"API call failed: {e}")


def extract_json_from_response(response_text: str) -> Optional[str]:
    """Extract JSON from the API response, handling markdown code blocks if present."""
    text = response_text.strip()
    if text.startswith("```"):
        start_idx = text.find("\n")
        if start_idx != -1:
            text = text[start_idx + 1:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_text = text[start_idx:end_idx + 1]
        return json_text
    
    return text


def validate_json_syntax(json_text: str) -> Optional[Dict[str, Any]]:
    """Validate JSON syntax and parse it."""
    try:
        data = json.loads(json_text)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON syntax: {e}")


def validate_schema(data: Dict[str, Any]) -> bool:
    """Validate that the JSON matches the expected schema."""
    errors = []
    
    if not isinstance(data, dict):
        errors.append("Root must be an object")
        raise ValueError("; ".join(errors))
    
    if "course_title" not in data:
        errors.append("Missing 'course_title' field")
    elif not isinstance(data["course_title"], str):
        errors.append("'course_title' must be a string")
    
    if "topics" not in data:
        errors.append("Missing 'topics' field")
    elif not isinstance(data["topics"], list):
        errors.append("'topics' must be an array")
    else:
        required_topic_fields = ["id", "date", "name", "problems"]
        for i, topic in enumerate(data["topics"]):
            if not isinstance(topic, dict):
                errors.append(f"Topic {i} must be an object")
                continue
            
            for field in required_topic_fields:
                if field not in topic:
                    errors.append(f"Topic {i} missing '{field}' field")
            
            if "problems" in topic and isinstance(topic["problems"], list):
                required_problem_fields = ["id", "label", "history"]
                for j, problem in enumerate(topic["problems"]):
                    if not isinstance(problem, dict):
                        errors.append(f"Topic {i}, Problem {j} must be an object")
                        continue
                    
                    for field in required_problem_fields:
                        if field not in problem:
                            errors.append(f"Topic {i}, Problem {j} missing '{field}' field")
                    
                    if "history" in problem and not isinstance(problem["history"], list):
                        errors.append(f"Topic {i}, Problem {j} 'history' must be an array")
    
    if errors:
        raise ValueError("Schema validation failed: " + "; ".join(errors))
    
    return True


def parse_syllabus_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a syllabus image and return the structured JSON data.
    
    Args:
        image_bytes: The image file as bytes
        
    Returns:
        Parsed study data as a dictionary
        
    Raises:
        ValueError: If parsing or validation fails
        Exception: If API call fails
    """
    # Load image from bytes
    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Failed to load image: {e}")
    
    # Call Gemini API
    try:
        response_text = call_gemini_api(image)
        if not response_text:
            raise Exception("Failed to get response from Gemini API")
    except ValueError as e:
        # Re-raise ValueError (API key missing) with user-friendly message
        raise ValueError(str(e))
    
    # Extract JSON
    json_text = extract_json_from_response(response_text)
    if not json_text:
        raise ValueError("Failed to extract JSON from response")
    
    # Validate JSON syntax
    data = validate_json_syntax(json_text)
    if not data:
        raise ValueError("Failed to parse JSON")
    
    # Validate schema
    validate_schema(data)
    
    return data
