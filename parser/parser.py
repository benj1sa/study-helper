#!/usr/bin/env python3
"""
Syllabus Parser - Converts syllabus images to structured JSON using Google Gemini Vision API.
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image


# Load environment variables
load_dotenv()

# Constants
GOOGLE_GEMINI_KEY = os.getenv("GOOGLE_GEMINI_KEY")
SYLLABI_FOLDER = Path("./syllabi")
DATA_FOLDER = Path("./data")
OUTPUT_FILE = DATA_FOLDER / "study_data.json"

# Supported image extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}


def print_progress(message: str) -> None:
    """Print a progress message."""
    print(f"[*] {message}")


def print_error(message: str) -> None:
    """Print an error message."""
    print(f"[ERROR] {message}", file=sys.stderr)


def print_success(message: str) -> None:
    """Print a success message."""
    print(f"[SUCCESS] {message}")


def ensure_folders() -> None:
    """Create necessary folders if they don't exist."""
    print_progress("Checking folders...")
    SYLLABI_FOLDER.mkdir(exist_ok=True)
    DATA_FOLDER.mkdir(exist_ok=True)
    print_progress(f"Folders ready: {SYLLABI_FOLDER}, {DATA_FOLDER}")


def find_syllabus_image() -> Optional[Path]:
    """Find the first JPEG/PNG image in the syllabi folder."""
    print_progress(f"Searching for images in {SYLLABI_FOLDER}...")
    
    if not SYLLABI_FOLDER.exists():
        print_error(f"Folder {SYLLABI_FOLDER} does not exist")
        return None
    
    images = []
    for ext in IMAGE_EXTENSIONS:
        images.extend(SYLLABI_FOLDER.glob(f"*{ext}"))
    
    if not images:
        print_error(f"No JPEG/PNG images found in {SYLLABI_FOLDER}")
        print_error("Please place a syllabus image in the syllabi folder")
        return None
    
    # Use first image found
    image_path = images[0]
    print_progress(f"Found image: {image_path}")
    return image_path


def load_image(image_path: Path) -> Optional[Image.Image]:
    """Load and validate the image."""
    print_progress(f"Loading image: {image_path}...")
    try:
        image = Image.open(image_path)
        print_progress(f"Image loaded: {image.size[0]}x{image.size[1]} pixels, mode: {image.mode}")
        return image
    except Exception as e:
        print_error(f"Failed to load image: {e}")
        return None


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
   - Only include rows that have actual problem sets assigned

4. ID GENERATION:
   - Topics: Use format "topic_001", "topic_002", etc. (zero-padded, 3 digits)
   - Problems: Use format based on topic name abbreviation + label
     * Example: Topic "Binary Search Trees" → abbreviation "bst", problem "1a" → id "bst_1a"
     * Create a short, lowercase abbreviation from the topic name (remove spaces, use first letters)

5. OUTPUT FORMAT: You MUST output ONLY valid JSON matching this exact schema:
{
  "course_title": "string",
  "topics": [
    {
      "id": "topic_001",
      "date": "string (e.g., '2/11')",
      "name": "string",
      "problems": [
        {
          "id": "string (e.g., 'bst_1a')",
          "label": "string (e.g., '1a')",
          "history": []
        }
      ]
    }
  ]
}

6. PROBLEM LABELS: The "label" field should be the original problem identifier (e.g., "1a", "2", "12-15" becomes multiple problems with labels "12", "13", "14", "15")

Extract all information from the syllabus table. Apply the explosion rules to create individual problem entries for each problem number/sub-problem. Output ONLY the JSON, no additional text."""


def list_available_models() -> List[str]:
    """List available Gemini models."""
    try:
        genai.configure(api_key=GOOGLE_GEMINI_KEY)
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append(model.name.replace('models/', ''))
        return available_models
    except Exception as e:
        print_error(f"Failed to list models: {e}")
        return []


def call_gemini_api(image: Image.Image) -> Optional[str]:
    """Call Google Gemini Vision API to parse the syllabus."""
    print_progress("Initializing Gemini API...")
    
    if not GOOGLE_GEMINI_KEY:
        print_error("GOOGLE_GEMINI_KEY not found in .env file")
        print_error("Please create a .env file with: GOOGLE_GEMINI_KEY=your_key_here")
        return None
    
    # Try multiple model names in order of preference
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
        
        # Try each model name until one works
        last_error = None
        for model_name in model_names:
            try:
                print_progress(f"Trying model: {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                print_progress("Building prompt...")
                prompt = build_system_prompt()
                
                print_progress("Calling Gemini Vision API...")
                response = model.generate_content([prompt, image])
                
                if not response.text:
                    print_error("Empty response from Gemini API")
                    continue
                
                print_progress("Received response from API")
                return response.text.strip()
            except Exception as e:
                last_error = e
                print_progress(f"Model {model_name} failed: {e}")
                continue
        
        # If all models failed, list available models
        print_error(f"All model attempts failed. Last error: {last_error}")
        print_progress("Listing available models...")
        available_models = list_available_models()
        if available_models:
            print_progress("Available models:")
            for model_name in available_models:
                print_progress(f"  - {model_name}")
        else:
            print_error("Could not retrieve list of available models")
        
        return None
    
    except Exception as e:
        print_error(f"API call failed: {e}")
        return None


def extract_json_from_response(response_text: str) -> Optional[str]:
    """Extract JSON from the API response, handling markdown code blocks if present."""
    print_progress("Extracting JSON from response...")
    
    # Remove markdown code blocks if present
    text = response_text.strip()
    if text.startswith("```"):
        # Find the first newline after ```
        start_idx = text.find("\n")
        if start_idx != -1:
            text = text[start_idx + 1:]
        # Remove trailing ```
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    
    # Try to find JSON object boundaries
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_text = text[start_idx:end_idx + 1]
        return json_text
    
    return text


def validate_json_syntax(json_text: str) -> Optional[Dict[str, Any]]:
    """Validate JSON syntax and parse it."""
    print_progress("Validating JSON syntax...")
    
    try:
        data = json.loads(json_text)
        print_progress("JSON syntax is valid")
        return data
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON syntax: {e}")
        print_error(f"JSON text: {json_text[:500]}...")  # Show first 500 chars
        return None


def validate_schema(data: Dict[str, Any]) -> bool:
    """Validate that the JSON matches the expected schema."""
    print_progress("Validating JSON schema...")
    
    errors = []
    
    # Check top-level structure
    if not isinstance(data, dict):
        errors.append("Root must be a JSON object")
        return False
    
    # Check course_title
    if "course_title" not in data:
        errors.append("Missing 'course_title' field")
    elif not isinstance(data["course_title"], str):
        errors.append("'course_title' must be a string")
    
    # Check topics
    if "topics" not in data:
        errors.append("Missing 'topics' field")
    elif not isinstance(data["topics"], list):
        errors.append("'topics' must be an array")
    else:
        # Validate each topic
        for i, topic in enumerate(data["topics"]):
            if not isinstance(topic, dict):
                errors.append(f"Topic {i} must be an object")
                continue
            
            # Check topic fields
            required_topic_fields = ["id", "date", "name", "problems"]
            for field in required_topic_fields:
                if field not in topic:
                    errors.append(f"Topic {i} missing '{field}' field")
            
            if "problems" in topic:
                if not isinstance(topic["problems"], list):
                    errors.append(f"Topic {i} 'problems' must be an array")
                else:
                    # Validate each problem
                    for j, problem in enumerate(topic["problems"]):
                        if not isinstance(problem, dict):
                            errors.append(f"Topic {i}, Problem {j} must be an object")
                            continue
                        
                        # Check problem fields
                        required_problem_fields = ["id", "label", "history"]
                        for field in required_problem_fields:
                            if field not in problem:
                                errors.append(f"Topic {i}, Problem {j} missing '{field}' field")
                        
                        if "history" in problem and not isinstance(problem["history"], list):
                            errors.append(f"Topic {i}, Problem {j} 'history' must be an array")
    
    if errors:
        print_error("Schema validation failed:")
        for error in errors:
            print_error(f"  - {error}")
        return False
    
    print_progress("Schema validation passed")
    return True


def write_output(data: Dict[str, Any]) -> bool:
    """Write the validated JSON to the output file."""
    print_progress(f"Writing output to {OUTPUT_FILE}...")
    
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print_success(f"Output written to {OUTPUT_FILE}")
        return True
    except Exception as e:
        print_error(f"Failed to write output file: {e}")
        return False


def main():
    """Main execution function."""
    print("=" * 60)
    print("Syllabus Parser - Starting...")
    print("=" * 60)
    
    # Step 1: Ensure folders exist
    ensure_folders()
    
    # Step 2: Find syllabus image
    image_path = find_syllabus_image()
    if not image_path:
        sys.exit(1)
    
    # Step 3: Load image
    image = load_image(image_path)
    if not image:
        sys.exit(1)
    
    # Step 4: Call Gemini API
    response_text = call_gemini_api(image)
    if not response_text:
        sys.exit(1)
    
    # Step 5: Extract JSON from response
    json_text = extract_json_from_response(response_text)
    if not json_text:
        print_error("Failed to extract JSON from response")
        sys.exit(1)
    
    # Step 6: Validate JSON syntax
    data = validate_json_syntax(json_text)
    if not data:
        sys.exit(1)
    
    # Step 7: Validate schema
    if not validate_schema(data):
        sys.exit(1)
    
    # Step 8: Write output
    if not write_output(data):
        sys.exit(1)
    
    print("=" * 60)
    print_success("Syllabus parsing completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
