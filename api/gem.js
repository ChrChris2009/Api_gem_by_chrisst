const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Définition du dossier temporaire
const tmpFolder = path.join(__dirname, "../tmp");
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}

exports.config = {
  name: 'gem',
  author: 'Chris st',
  description: 'Génère ou édite des images artistiques via l\'API GEM',
  method: 'get',
  category: 'image generation',
  link: '/api/gem?prompt=A beautiful landscape&ratio=1:1'
};

exports.initialize = async function ({ req, res }) {
  try {
    const { prompt, ratio, nw, image_url } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: "Le paramètre 'prompt' est requis." });
    }

    let finalPrompt = prompt;
    // Mode artistique si nw est présent
    if (nw === "true" || nw === "1") {
      finalPrompt = `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${prompt}`;
    }

    let payload = {
      prompt: finalPrompt,
      ratio: ratio || "1:1",
      format: "jpg"
    };

    let endpoint = "https://gem-tw6a.onrender.com/generate";

    // Si une URL d'image est passée pour le mode Édition
    if (image_url) {
      try {
        const imgRes = await axios.get(image_url, { responseType: "arraybuffer" });
        const imgBase64 = Buffer.from(imgRes.data, "binary").toString("base64");
        
        endpoint = "https://gem-tw6a.onrender.com/edit";
        payload.image = imgBase64;
        delete payload.ratio; 
      } catch (imgError) {
        return res.status(400).json({ error: "Impossible de récupérer l'image depuis l'image_url fournie." });
      }
    }

    // Appel à l'API GEM externe
    const apiResponse = await axios.post(endpoint, payload, { 
      responseType: "arraybuffer",
      timeout: 180000 
    });

    const imgPath = path.join(tmpFolder, `gem_${Date.now()}.jpg`);
    fs.writeFileSync(imgPath, apiResponse.data);

    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(imgPath, (err) => {
      if (err) {
        console.error("Erreur lors de l'envoi du fichier:", err);
      }
      // Suppression du fichier temporaire après envoi
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    });

  } catch (error) {
    console.error("Erreur de génération GEM API:", error.message);
    res.status(500).json({ error: "Échec de la génération de l'image", details: error.message });
  }
};

