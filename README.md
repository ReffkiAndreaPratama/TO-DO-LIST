# Taskly — Todo List

Todo List berbasis HTML, CSS, dan JavaScript murni. Aplikasi ini membantu mencatat pekerjaan, mengatur prioritas, memasang tenggat waktu, dan memantau progres tugas.

## Fitur
- Tambah, edit, hapus, dan tandai tugas selesai.
- Prioritas rendah, sedang, dan tinggi.
- Tenggat waktu serta penanda tugas terlambat.
- Kategori Kuliah, Pribadi, Proyek, dan Lainnya.
- Pencarian, filter status/kategori, dan pengurutan.
- Statistik total, belum selesai, selesai, serta progres.
- Mode gelap dan terang.
- Penyimpanan otomatis melalui `localStorage`.
- Layout responsif untuk desktop dan perangkat mobile.

## Cara menjalankan
1. Ekstrak folder proyek.
2. Buka `index.html` di browser modern.
3. Mulai tambahkan tugas.

Tidak membutuhkan Node.js, database, backend, atau API key. Koneksi internet hanya diperlukan untuk memuat font Google; aplikasi tetap berfungsi tanpa font tersebut.

## Hosting gratis
Bisa dipublikasikan sebagai situs statis melalui GitHub Pages, Cloudflare Pages, atau Netlify. Unggah semua file proyek ke repository GitHub, lalu aktifkan GitHub Pages pada pengaturan repository.

## Struktur
```text
todolist/
├── index.html
├── style.css
├── script.js
├── README.md
└── LICENSE
```

## Catatan data
Data disimpan di browser/perangkat yang sedang digunakan. Data tidak otomatis tersinkron ke perangkat lain. Menghapus data situs/browser dapat menghapus daftar tugas yang tersimpan.

## Lisensi
MIT — lihat file `LICENSE`.
