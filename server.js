require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// --- CONNESSIONE DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connesso a MongoDB Atlas!"))
    .catch(err => console.error("❌ Errore connessione DB:", err));

// --- SCHEMI DATI ---
const frigoSchema = new mongoose.Schema({
    nome: String,
    quantita: String,
    scadenza: String,
    categoria: { type: String, default: 'altro' },
    rimasto: { type: Number, default: 100 }
});
const carrelloSchema = new mongoose.Schema({
    nome: String,
    quantita: String,
    preso: { type: Boolean, default: false }
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

// --- API RICETTE (SPOONACULAR) ---
app.get('/api/ricette', async (req, res) => {
    try {
        const prodotti = await Frigo.find();
        if (prodotti.length === 0) return res.json({ msg: "Aggiungi ingredienti al frigo per vedere le ricette!" });
        
        // Estraiamo solo i nomi separati da virgola
        const listaIngredienti = prodotti.map(p => p.nome).join(',');
        const apiKey = process.env.SPOONACULAR_API_KEY;
        
        // Chiamata all'API (ranking=1 massimizza l'uso degli ingredienti che hai già)
        const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(listaIngredienti)}&number=5&ranking=1&ignorePantry=true&apiKey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.json(data);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Errore API Ricette" }); 
    }
});

app.listen(port, () => console.log(`Server attivo su porta ${port}`));