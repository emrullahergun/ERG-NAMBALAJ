// Toptan Sipariş Sistemi - basit, bağımlılıksız Node.js sunucusu
// Veriler data.json dosyasında saklanır (küçük/orta ölçekli kullanım için yeterlidir).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = {
      adminPassword: 'degistir123',
      products: [
        { id: 1, name: 'Streç Film 50cm', cat: 'Ambalaj', price: 145, campaign: false },
        { id: 2, name: 'Yüzey Temizleyici 5L', cat: 'Temizlik', price: 210, campaign: true, oldPrice: 260 },
        { id: 3, name: 'Koli Bandı 45mm', cat: 'Ambalaj', price: 22, campaign: false }
      ],
      customers: [],
      orders: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}
function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
  });
}
function isAdmin(req, data) {
  const pass = req.headers['x-admin-pass'];
  return pass && pass === data.adminPassword;
}
function priceFor(product, customer) {
  const disc = (customer && customer.discount) || 0;
  return disc > 0 ? Math.round(product.price * (1 - disc / 100)) : product.price;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  let data = loadData();

  // ---- Statik dosyalar ----
  if (p === '/' || p === '/index.html') {
    return sendFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
  }

  // ---- Müşteri: katalog görüntüle ----
  if (p === '/api/catalog' && req.method === 'GET') {
    const token = url.searchParams.get('token');
    const customer = data.customers.find((c) => c.token === token);
    if (!customer) return send(res, 404, { error: 'Bağlantı bulunamadı' });
    const products = data.products.map((pr) => ({ ...pr, customerPrice: priceFor(pr, customer) }));
    return send(res, 200, { customer: { name: customer.name, discount: customer.discount }, products });
  }

  // ---- Müşteri: sipariş gönder ----
  if (p === '/api/order' && req.method === 'POST') {
    const body = await readBody(req);
    const customer = data.customers.find((c) => c.token === body.token);
    if (!customer) return send(res, 404, { error: 'Geçersiz bağlantı' });
    let total = 0, count = 0;
    const items = (body.items || []).map((it) => {
      const pr = data.products.find((x) => x.id === it.id);
      if (!pr) return null;
      const price = priceFor(pr, customer);
      total += price * it.qty; count += it.qty;
      return { name: pr.name, qty: it.qty, price };
    }).filter(Boolean);
    const order = {
      id: crypto.randomUUID(), token: customer.token, customer: customer.name,
      items, itemCount: count, total, time: new Date().toISOString()
    };
    data.orders.push(order);
    saveData(data);
    return send(res, 200, { ok: true });
  }

  // ---- Yönetici uç noktaları ----
  if (p === '/api/admin/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.password === data.adminPassword) return send(res, 200, { ok: true });
    return send(res, 401, { ok: false });
  }

  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req, data)) return send(res, 401, { error: 'Yetkisiz' });

    if (p === '/api/admin/data' && req.method === 'GET') {
      return send(res, 200, { products: data.products, customers: data.customers, orders: data.orders });
    }

    if (p === '/api/admin/product' && req.method === 'POST') {
      const body = await readBody(req);
      data.products.push({ id: Date.now(), name: body.name, cat: body.cat || 'Genel', price: Number(body.price), campaign: false });
      saveData(data);
      return send(res, 200, { ok: true });
    }
    if (p.startsWith('/api/admin/product/') && req.method === 'PUT') {
      const id = Number(p.split('/').pop());
      const body = await readBody(req);
      const pr = data.products.find((x) => x.id === id);
      if (pr) { if (body.price !== undefined) pr.price = Number(body.price); if (body.campaign !== undefined) pr.campaign = !!body.campaign; }
      saveData(data);
      return send(res, 200, { ok: true });
    }
    if (p.startsWith('/api/admin/product/') && req.method === 'DELETE') {
      const id = Number(p.split('/').pop());
      data.products = data.products.filter((x) => x.id !== id);
      saveData(data);
      return send(res, 200, { ok: true });
    }

    if (p === '/api/admin/customer' && req.method === 'POST') {
      const body = await readBody(req);
      const token = 'c' + crypto.randomBytes(5).toString('hex');
      data.customers.push({ token, name: body.name, discount: Number(body.discount) || 0, createdAt: new Date().toLocaleDateString('tr-TR') });
      saveData(data);
      return send(res, 200, { ok: true, token });
    }
    if (p.startsWith('/api/admin/customer/') && req.method === 'DELETE') {
      const token = p.split('/').pop();
      data.customers = data.customers.filter((c) => c.token !== token);
      saveData(data);
      return send(res, 200, { ok: true });
    }
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log(`Sipariş sistemi ${PORT} portunda çalışıyor`));
