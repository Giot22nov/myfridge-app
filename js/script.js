const API = '/api';

function nav(vista) {
    // Gestione visuale
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`view-${vista}`).classList.add('active');
    
    // Trova l'indice corretto per l'icona attiva
    const map = { 'frigo': 0, 'carrello': 1 };
    if(map[vista] !== undefined) {
        document.querySelectorAll('.nav-item')[map[vista]].classList.add('active');
    }

    if(vista === 'frigo') loadFrigo();
    if(vista === 'carrello') loadCarrello();
}

async function loadFrigo() {
    const res = await fetch(`${API}/frigo`);
    const data = await res.json();
    const div = document.getElementById('lista-frigo');
    div.innerHTML = '';

    data.forEach(item => {
        div.innerHTML += `
        <div class="item-row">
            <div class="item-info" style="flex:1">
                <strong>${item.nome}</strong>
                <small>${item.quantita} • Scad: ${item.scadenza}</small>
                <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                    <input type="range" value="${item.rimasto}" onchange="updFrigo(${item.id}, this.value)">
                    <span style="font-size:12px; width:30px;">${item.rimasto}%</span>
                </div>
            </div>
            <button onclick="delFrigo(${item.id})" class="st-btn" style="border:none; font-size:1.2rem; color:#ff4b4b;">✕</button>
        </div>`;
    });
}

async function addFrigo() {
    const nome = document.getElementById('f-nome').value;
    const qta = document.getElementById('f-qta').value;
    const scad = document.getElementById('f-scad').value;
    if(!nome) return;

    await fetch(`${API}/frigo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome, quantita: qta, scadenza: scad })
    });
    document.getElementById('f-nome').value = '';
    loadFrigo();
}

async function updFrigo(id, val) {
    await fetch(`${API}/frigo/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ rimasto: val })
    });
}

async function delFrigo(id) {
    await fetch(`${API}/frigo/${id}`, { method: 'DELETE' });
    loadFrigo();
}

async function loadCarrello() {
    const res = await fetch(`${API}/carrello`);
    const data = await res.json();
    const div = document.getElementById('lista-carrello');
    div.innerHTML = '';

    data.forEach(item => {
        div.innerHTML += `
        <div class="item-row" style="border-left: 3px solid #00d4b1;">
            <div class="item-info">
                <strong>${item.nome}</strong>
                <small>Da prendere: ${item.quantita}</small>
            </div>
            <button onclick="delCarrello(${item.id})" class="st-btn" style="border:none; color:#00d4b1;">✔</button>
        </div>`;
    });
}

async function addCarrello() {
    const nome = document.getElementById('c-nome').value;
    if(!nome) return;
    await fetch(`${API}/carrello`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome, quantita: '1 pz' })
    });
    document.getElementById('c-nome').value = '';
    loadCarrello();
}

async function delCarrello(id) {
    await fetch(`${API}/carrello/${id}`, { method: 'DELETE' });
    loadCarrello();
}

async function svuotaCarrello() {
    if(confirm("Svuotare tutto?")) {
        await fetch(`${API}/carrello`, { method: 'DELETE' });
        loadCarrello();
    }
}

// Avvio
loadFrigo();