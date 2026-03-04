require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// ✅ @google/genai (ESM) usato da CommonJS tramite import dinamico
let ai;

async function getGenAIClient() {
  if (ai) return ai;

  const mod = await import("@google/genai");
  const GoogleGenAI = mod.GoogleGenAI;

  // Usa la variabile che hai già: GOOGLE_API_KEY (va bene)
  ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
  });

  return ai;
}

// --- CONNESSIONE DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connesso a MongoDB Atlas!"))
    .catch(err => console.error("❌ Errore connessione DB:", err));

// --- SCHEMI DATI ---
const frigoSchema = new mongoose.Schema({
    nome: String, quantita: String, scadenza: String,
    categoria: { type: String, default: 'altro' },
    rimasto: { type: Number, default: 100 }
});
const carrelloSchema = new mongoose.Schema({
    nome: String, quantita: String, preso: { type: Boolean, default: false }
});

const Frigo = mongoose.model('Frigo', frigoSchema);
const Carrello = mongoose.model('Carrello', carrelloSchema);

// --- API FRIGO ---
app.get('/api/frigo', async (req, res) => { res.json(await Frigo.find()); });
app.post('/api/frigo', async (req, res) => { res.json(await Frigo.create(req.body)); });
app.put('/api/frigo/:id', async (req, res) => { await Frigo.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); });
app.delete('/api/frigo/:id', async (req, res) => { await Frigo.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// --- API CARRELLO ---
app.get('/api/carrello', async (req, res) => { res.json(await Carrello.find()); });
app.post('/api/carrello', async (req, res) => { await Carrello.create(req.body); res.json({ success: true }); });
app.put('/api/carrello/:id', async (req, res) => { await Carrello.findByIdAndUpdate(req.params.id, { preso: req.body.preso }); res.json({ success: true }); });
app.delete('/api/carrello/:id', async (req, res) => { await Carrello.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/carrello', async (req, res) => { await Carrello.deleteMany({}); res.json({ success: true }); });

// --- API RICETTE CON GOOGLE GEMINI AI 🤖 ---
app.get('/api/ricette', async (req, res) => {
    try {
        const prodotti = await Frigo.find();
        if (prodotti.length === 0) {
            return res.json({ html: "<div style='text-align:center; padding:20px; color:#aaa;'>Il tuo frigo è vuoto! Aggiungi qualcosa prima di chiedere allo Chef.</div>" });
        }
        
        // Estraiamo i nomi degli ingredienti dal frigo
        const listaIngredienti = prodotti.map(p => p.nome).join(', ');
        
        // Inizializziamo l'AI di Google
        console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "✅ Presente" : "❌ Mancante");
        console.log("🤖 Generating recipe with Gemini AI using ingredients:", listaIngredienti);
        
        // Questo è il PROMPT: Le istruzioni segrete per l'AI
        const prompt = `Sei un simpatico e geniale Chef italiano. Nel mio frigo ho a disposizione ESATTAMENTE questi ingredienti: ${listaIngredienti}. 
        Inventa UNA ricetta gustosa e creativa usando il più possibile questi ingredienti. Puoi dare per scontato che io abbia in dispensa le cose base (sale, pepe, olio d'oliva, aglio, cipolla, burro). 
        Non è necessario usare tutti gli ingredienti, ma cerca di usarne il più possibile. 
        La ricetta deve essere semplice, adatta a chi non è un cuoco esperto, e deve includere una lista di ingredienti con quantità stimate e un procedimento passo-passo. 
        
        
        IMPORTANTE: Rispondi SOLO ed ESCLUSIVAMENTE con codice HTML puro (non usare i backtick \`\`\`html). 
        Usa questa struttura esatta per la risposta:
        <div class="recipe-card">
            <h3 style="color: #ffb703; margin-top: 0; font-size: 22px;">[Nome Inventato del Piatto]</h3>
            <p style="color: #aaa; font-style: italic;">[Una breve e invitante descrizione del piatto, max 2 righe]</p>
            <h4 style="color: #00d4b1; margin-bottom: 5px;">🛒 Ingredienti:</h4>
            <ul style="margin-top: 5px; color: #eee;">
                [Lista <li> degli ingredienti con le quantità stimate]
            </ul>
            <h4 style="color: #00d4b1; margin-bottom: 5px;">👨‍🍳 Procedimento:</h4>
            <ol style="margin-top: 5px; color: #eee; padding-left: 20px;">
                [Passaggi <li> spiegati in modo semplice]
            </ol>
            <p style="text-align: center; font-size: 18px; margin-top: 20px;">Buon appetito! 🍽️</p>
        </div>`;
        
        // Chiediamo a Gemini di generare la ricetta
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
        const client = await getGenAIClient();

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
            });

        let text = response.text;

        //const result = await ai.modelsmodel.generateContent(prompt);
        //let text = result.response.text();
        
        // Pulizia di sicurezza nel caso l'AI metta i tag "```html"
        text = text.replace(/```html/g, '').replace(/```/g, '').trim();
        
        // Inviamo l'HTML finito all'app
        res.json({ html: text });

    } catch (err) { 
        console.error("Errore Gemini:", err);
        res.status(500).json({ error: "Lo Chef è confuso, riprova!" }); 
    }
});

app.listen(port, () => console.log(`Server attivo su porta ${port}`));