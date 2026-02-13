const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// DATI INIZIALI (Simuliamo il tuo frigo del video)
let frigo = [
    { id: 1, nome: "Latte Granarolo", quantita: "1 L", scadenza: "2026-02-20", rimasto: 40 },
    { id: 2, nome: "Riso Basmati", quantita: "1 Kg", scadenza: "2026-03-15", rimasto: 80 },
    { id: 3, nome: "Uova", quantita: "6 pz", scadenza: "2026-02-18", rimasto: 100 }
];
let carrello = [
    { id: 1, nome: "Carta Igienica", quantita: "1 pacco" }
];

// API
app.get('/api/frigo', (req, res) => res.json(frigo));
app.post('/api/frigo', (req, res) => {
    frigo.push({ id: Date.now(), ...req.body, rimasto: 100 });
    res.json({ success: true });
});
app.put('/api/frigo/:id', (req, res) => {
    const idx = frigo.findIndex(i => i.id == req.params.id);
    if(idx !== -1) frigo[idx].rimasto = req.body.rimasto;
    res.json({ success: true });
});
app.delete('/api/frigo/:id', (req, res) => {
    frigo = frigo.filter(i => i.id != req.params.id);
    res.json({ success: true });
});

app.get('/api/carrello', (req, res) => res.json(carrello));
app.post('/api/carrello', (req, res) => {
    carrello.push({ id: Date.now(), ...req.body });
    res.json({ success: true });
});
app.delete('/api/carrello/:id', (req, res) => {
    carrello = carrello.filter(i => i.id != req.params.id);
    res.json({ success: true });
});
app.delete('/api/carrello', (req, res) => {
    carrello = [];
    res.json({ success: true });
});

app.listen(port, () => console.log(`Server attivo su http://localhost:${port}`));