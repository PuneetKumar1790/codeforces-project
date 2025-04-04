require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");



const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Main - Model-Fumctionality
const OPENROUTER_API_KEY =  process.env.OPENROUTER_API_KEY;;

const ANALYSIS_PROMPT = `Analyze the given food label data and provide a detailed review of its nutritional quality.  

**IMPORTANT:**  
1. **Start your response with:** "Rating: X/10" where X is the rating.  
2. **Then, explain why you gave this rating.**  
3. Consider the following factors:  
   - Balance of macronutrients (protein, carbohydrates, fats).  
   - Presence of whole foods versus processed ingredients.  
   - Count and type of additives or preservatives (highlight harmful ones).  
   - Added sugar content (mention hidden sugars like glucose syrup, fructose, maltodextrin).  
   - Allergen warnings (mention if common allergens like nuts, soy, or gluten are present).  
   - Presence of harmful artificial ingredients (e.g., **MSG, artificial sweeteners, trans fats, excessive sodium**).  
   - Fiber content (important for gut health and digestion).  
   - Claims vs. reality (e.g., "high protein" but low protein per serving).  
   - Any misleading marketing tactics (e.g., **"natural" but contains artificial preservatives**).  

4. **Conclude with a short recommendation:** Should the user consume it regularly, occasionally, or avoid it?`;


app.post("/analyze-food", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Step 1: Extract text from the image
        const imageBase64 = req.file.buffer.toString("base64");
        const extractionResponse = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "qwen/qwen2.5-vl-72b-instruct:free",
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: "Extract the food label details in a plain text format." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                }],
                temperature: 0.1,
                max_tokens: 2000
            },
            { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
        );
        const choices = extractionResponse.data.choices;
        if (!choices || choices.length === 0) {
            return res.status(500).json({ error: "Failed to extract text from image" });
        }
        const extractedText = extractionResponse.data.choices[0].message.content;

        // Step 2: Analyze extracted text
        const analysisResponse = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [{
                    role: "user",
                    content: `${ANALYSIS_PROMPT}\n\nFood Label Details:\n${extractedText}`
                }],
                temperature: 0.3,
                max_tokens: 500
            },
            { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
        );

        const analysisText = analysisResponse.data.choices[0].message.content;

        res.json({
            analysis: analysisText
        });

    } catch (error) {
        console.error("Pipeline Error:", error.response?.data || error.message);
        res.status(500).json({
            error: "Analysis failed",
            details: error.response?.data || error.message
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
