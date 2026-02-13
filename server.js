require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// --- CONNESSIONE DATABASE ---
// Prende la password da Render (o dal file .env se sei sul pc)
const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString)
    .then(() => console.log("✅ Connesso a MongoDB Atlas!"))
    .catch(err => console.error("❌ Errore connessione DB:", err));

// --- SCHEMI DATI (La forma dei dati nel database) ---
const frigoSchema = new mongoose.Schema({
    nome: String,
    quantita: String,
    scadenza: String,
    rimasto: { type: Number, default: 100 }
});
const carrelloSchema = new mongoose.Schema({
    nome: String,
    quantita: String
});

const Frigo = mongoose.model('Frigo', frigoSchema);
const Carrello = mongoose.model('Carrello', carrelloSchema);

// --- API FRIGO ---
app.get('/api/frigo', async (req, res) => {
    const items = await Frigo.find();
    res.json(items);
});

app.post('/api/frigo', async (req, res) => {
    const newItem = await Frigo.create(req.body);
    res.json(newItem);
});

app.put('/api/frigo/:id', async (req, res) => {
    await Frigo.findByIdAndUpdate(req.params.id, { rimasto: req.body.rimasto });
    res.json({ success: true });
});

app.delete('/api/frigo/:id', async (req, res) => {
    await Frigo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- API CARRELLO ---
app.get('/api/carrello', async (req, res) => {
    const items = await Carrello.find();
    res.json(items);
});

app.post('/api/carrello', async (req, res) => {
    await Carrello.create(req.body);
    res.json({ success: true });
});

app.delete('/api/carrello/:id', async (req, res) => {
    await Carrello.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.delete('/api/carrello', async (req, res) => {
    await Carrello.deleteMany({}); // Svuota tutto il carrello
    res.json({ success: true });
});

app.listen(port, () => console.log(`Server attivo su porta ${port}`));