require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many requests. Please try again later.",
  },
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

app.use(
  cors({
    origin: "https://codeforces-project.vercel.app",
  })
);
app.use(express.json());
app.use("/analyze-food", limiter);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const ANALYSIS_PROMPT = `
**IMPORTANT:**  
1. **Start your response with:** "Rating: X/10" where X is the rating.  

**Review the food label and consider the following:**
- Macronutrient balance (protein, carbs, fats)
- Whole foods vs processed ingredients
- Additives, preservatives, and artificial ingredients
- Added sugars (hidden sugars like glucose syrup, fructose)
- Common allergens (e.g., nuts, soy, gluten)
- Fiber content and digestive health
- Claims vs reality (e.g., "high protein" but low protein per serving)
- Misleading marketing tactics (e.g., "natural" but contains artificial preservatives)

**Recommendation:** Should the user eat this regularly, occasionally, or avoid it?
`;


app.post("/analyze-food", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const imageBase64 = req.file.buffer.toString("base64");

    const extractionResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the food label details in a plain text format." },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      }
    );

    const choices = extractionResponse.data.choices;
    if (!choices || choices.length === 0) {
      return res.status(500).json({ error: "Failed to extract text from image" });
    }

    const extractedText = choices[0].message.content;

    const analysisResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "user",
            content: `${ANALYSIS_PROMPT}\n\nFood Label Details:\n${extractedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      }
    );

    const analysisText = analysisResponse.data.choices[0].message.content;

    res.json({
      analysis: analysisText,
    });
  } catch (error) {
    console.error("Error in pipeline:", error.response?.data || error.message);
    if (error.message.includes("File too large")) {
      return res.status(413).json({ error: "Uploaded file is too large. Max: 5MB" });
    }
    if (error.message.includes("Only image files are allowed")) {
      return res.status(415).json({ error: "Unsupported file type. Only images allowed." });
    }
    res.status(500).json({
      error: "Analysis failed",
      details: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
