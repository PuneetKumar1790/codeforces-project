import pytesseract
from PIL import Image
import io
from fastapi import FastAPI, UploadFile, File
from transformers import pipeline

app = FastAPI()

# Load Hugging Face model
nlp_model = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")

# OCR Function
def extract_text(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    text = pytesseract.image_to_string(image)
    return text.strip()

# NLP Analysis Function
def analyze_text(text):
    result = nlp_model(text)
    return result

@app.post("/process-label/")
async def process_label(file: UploadFile = File(...)):
    image_bytes = await file.read()
    extracted_text = extract_text(image_bytes)
    analysis_result = analyze_text(extracted_text)
    
    return {
        "extracted_text": extracted_text,
        "analysis": analysis_result
    }

# Run API: uvicorn food_label_analysis:app --host 0.0.0.0 --port 8000
