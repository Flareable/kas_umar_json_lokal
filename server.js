const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// Inisialisasi file JSON kalau belum ada
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ iuran: {}, pengeluaran: [] }));
  }
}

// Ambil data dari JSON
async function getData() {
  const data = await fs.readFile(DATA_FILE);
  return JSON.parse(data);
}

// Simpan data ke JSON
async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// API untuk ambil data iuran
app.get('/iuran/:tahun/:bulan', async (req, res) => {
  const { tahun, bulan } = req.params;
  const data = await getData();
  const key = `${tahun}-${bulan}`;
  res.json(data.iuran[key] || []);
});

// API untuk simpan iuran
app.post('/iuran', async (req, res) => {
  const { tahun, bulan, siswa_id, minggu_1, minggu_2, minggu_3, minggu_4 } = req.body;
  const data = await getData();
  const key = `${tahun}-${bulan}`;
  if (!data.iuran[key]) data.iuran[key] = [];
  data.iuran[key][siswa_id] = { siswa_id, minggu_1, minggu_2, minggu_3, minggu_4 };
  await saveData(data);
  res.json({ message: 'Iuran disimpan!' });
});

// API untuk ambil semua pengeluaran
app.get('/pengeluaran', async (req, res) => {
  const data = await getData();
  res.json(data.pengeluaran);
});

// API untuk simpan pengeluaran
app.post('/pengeluaran', async (req, res) => {
  const { nama_barang, harga, tanggal } = req.body;
  const data = await getData();
  const id = data.pengeluaran.length ? Math.max(...data.pengeluaran.map(p => p.id)) + 1 : 1;
  data.pengeluaran.push({ id, nama_barang, harga, tanggal });
  await saveData(data);
  res.json({ message: 'Pengeluaran disimpan!' });
});

// API untuk edit pengeluaran
app.put('/pengeluaran/:id', async (req, res) => {
  const { id } = req.params;
  const { nama_barang, harga, tanggal } = req.body;
  const data = await getData();
  const index = data.pengeluaran.findIndex(p => p.id == id);
  if (index !== -1) {
    data.pengeluaran[index] = { id: parseInt(id), nama_barang, harga, tanggal };
    await saveData(data);
    res.json({ message: 'Pengeluaran diupdate!' });
  } else {
    res.status(404).json({ error: 'Pengeluaran tidak ditemukan' });
  }
});

// API untuk hapus pengeluaran
app.delete('/pengeluaran/:id', async (req, res) => {
  const { id } = req.params;
  const data = await getData();
  data.pengeluaran = data.pengeluaran.filter(p => p.id != id);
  await saveData(data);
  res.json({ message: 'Pengeluaran dihapus!' });
});

// API untuk total kas
app.get('/total', async (req, res) => {
  const data = await getData();
  let total_iuran = 0;
  for (const key in data.iuran) {
    data.iuran[key].forEach(siswa => {
      total_iuran += (siswa.minggu_1 + siswa.minggu_2 + siswa.minggu_3 + siswa.minggu_4) * 5000;
    });
  }
  const total_pengeluaran = data.pengeluaran.reduce((sum, p) => sum + p.harga, 0);
  res.json({ total: total_iuran - total_pengeluaran });
});

initDataFile().then(() => {
  app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));
});