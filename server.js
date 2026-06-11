const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Ajouté pour gérer les chemins

const app = express();
const PORT = process.env.PORT || 3000;

const HF_TOKEN = process.env.HF_TOKEN; 
const MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// RENDRE L'INTERFACE WEB ACCESSIBLE
// Cette ligne dit à Express de servir les fichiers du dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route 1 : Génération d'image (/generate)
 */
app.post('/generate', async (req, res) => {
    try {
        const { prompt, ratio, format } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        console.log(`Génération pour : "${prompt}"`);

        const response = await axios({
            url: MODEL_URL,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ inputs: prompt }),
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', `image/${format || 'jpeg'}`);
        return res.send(response.data);

    } catch (error) {
        console.error("Erreur génération:", error.message);
        return res.status(500).json({ error: "Failed to generate image" });
    }
});

/**
 * Route 2 : Modification d'image (/edit)
 */
app.post('/edit', async (req, res) => {
    try {
        const { prompt, format, image } = req.body;

        if (!image) {
            return res.status(400).json({ error: "Base64 image is required" });
        }

        const response = await axios({
            url: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0",
            method: 'POST',
            headers: { Authorization: `Bearer ${HF_TOKEN}` },
            data: JSON.stringify({ inputs: prompt }),
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', `image/${format || 'jpeg'}`);
        return res.send(response.data);

    } catch (error) {
        console.error("Erreur modification:", error.message);
        return res.status(500).json({ error: "Failed to edit image" });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

