# Buket Bahagia

Aplikasi katalog dan pemesanan toko buket berbasis React, Vite, Firebase Authentication, Firestore, dan Cloudinary. Produk toko dibeli lewat keranjang dan checkout WhatsApp/manual. Produk affiliate Shopee hanya menaut ke Shopee dan tidak dapat dibeli melalui keranjang toko.

## Menjalankan secara lokal

1. Gunakan Node.js 18 atau lebih baru.
2. Pasang dependensi dengan `npm install`.
3. Salin `.env.example` menjadi `.env` dan isi variabel yang diperlukan (lihat bagian konfigurasi).
4. Jalankan `npm run dev`, lalu buka URL lokal yang ditampilkan Vite.
5. Sebelum mempublikasikan perubahan, jalankan `npm run lint` dan `npm run build`.

Jangan commit `.env`. Variabel `VITE_*` ditanam ke bundle browser; Firebase Web API key dan Cloudinary cloud name/upload preset memang identifier publik, bukan secret. Jangan pernah menaruh Cloudinary API Secret, Stripe key, atau kredensial privat apa pun ke frontend.

## Konfigurasi Firebase

1. Buat/pilih proyek Firebase dan aplikasi Web pada Firebase Console.
2. Aktifkan **Authentication > Email/Password**.
3. Buat database **Cloud Firestore**. Isi variabel `VITE_FIREBASE_*` dari konfigurasi aplikasi Web Firebase.
4. Buat akun lewat halaman `/login` (atau gunakan akun yang sudah tersedia).
5. Untuk admin pertama, setelah akun terdaftar, buka Firebase Console > Firestore > `users` > dokumen dengan UID akun itu. Ubah `isAdmin` menjadi boolean `true` melalui Console tepercaya. Setelah masuk ulang, akun dapat membuka `/admin/dashboard`.
6. Terapkan `firestore.rules` setelah memeriksa perubahan dengan Firebase Rules Playground/Emulator. Instruksi deployment ada di bagian **Deploy Rules**.

Rules membatasi perubahan profil milik sendiri agar pengguna tidak bisa mengubah `isAdmin`. Akses admin bergantung pada dokumen `users/{uid}` yang memiliki `isAdmin: true`.

## Konfigurasi Cloudinary

1. Di Cloudinary Console, catat **Cloud name**.
2. Buat upload preset bertipe **Unsigned** khusus untuk gambar produk. Batasi preset ke folder `e-commerce/products`, tipe resource `image`, format `jpg,jpeg,png,webp`, ukuran maksimum 5 MB, dan dimensi maksimum yang sesuai (widget membatasi 2000 × 2000). Batasi preset hanya untuk kebutuhan upload katalog dan jangan berikan hak hapus aset melalui preset.
3. Isi `VITE_CLOUDINARY_CLOUD_NAME` dan `VITE_CLOUDINARY_UPLOAD_PRESET`, lalu mulai ulang dev server.

Foto dapat diganti atau dihapus dari daftar foto produk di form admin. Menghapus foto dari form menghapus referensinya dari dokumen produk; file lama di Cloudinary tidak dihapus otomatis. Jika toko belum memiliki foto asli, UI memakai `public/placeholder-buket.svg`, sebuah placeholder netral yang perlu diganti dengan foto toko sendiri.

## Nomor WhatsApp toko

Isi `VITE_STORE_WHATSAPP_NUMBER` dengan nomor WhatsApp internasional berupa angka saja, tanpa tanda `+`, spasi, atau tanda baca. Contoh format: `6281234567890`. Setelah mengubah `.env`, mulai ulang Vite. Checkout akan menolak pembuatan order jika nomor belum diisi atau formatnya tidak valid.

## Kategori dan contoh katalog

Tidak ada data demo yang otomatis ditulis ke Firestore. Masuk sebagai admin, buka **Admin > Categories**, lalu pilih **Tambahkan 5 kategori awal**. Aksi ini hanya berjalan setelah admin menekan tombol dan tidak menulis ke produksi dengan sendirinya. Kategori yang tersedia: Buket Wisuda, Buket Ulang Tahun, Buket Romantis, Buket Artificial, dan Perlengkapan Buket. Kategori tetap dapat dibuat, diedit, dan dihapus dari layar yang sama.

Contoh produk untuk dimasukkan manual lewat **Admin > Products** setelah kategori tersedia:

| Tipe | Nama contoh | Kategori | Contoh harga/stok atau link |
|---|---|---|---|
| Toko | Buket Wisuda Pastel | Buket Wisuda | Rp185.000, stok 8 |
| Toko | Buket Ulang Tahun Ceria | Buket Ulang Tahun | Rp225.000, stok 5 |
| Toko | Buket Mawar untukmu | Buket Romantis | Rp275.000, stok 4 |
| Toko | Buket Tulip Artificial | Buket Artificial | Rp160.000, stok 10 |
| Affiliate | Kertas Buket Motif Pastel | Perlengkapan Buket | URL produk HTTPS milik program affiliate Shopee toko |

Contoh tersebut hanya referensi pengisian, bukan seed data. Gunakan harga, stok, foto, dan tautan affiliate sungguhan milik toko. Produk toko membutuhkan harga positif dan stok bilangan bulat nol atau lebih. Produk affiliate memerlukan URL HTTPS yang valid, platform Shopee, dan tidak dapat masuk keranjang. Status aktif mengatur apakah produk tampil di katalog.

## Alur pesanan

Checkout tersedia bagi pelanggan yang login. Data order dengan status `pending`, snapshot produk/harga/kuantitas, subtotal, ongkir sementara nol, total sementara, data penerimaan, catatan, kartu ucapan, dan waktu pembuatan ditulis ke Firestore. Setelah penulisan berhasil, aplikasi membuka WhatsApp dengan ringkasan pesanan. Ongkir dan ketersediaan dikonfirmasi manual oleh admin. Pembuatan order pelanggan tidak pernah mengubah stok.

Saat admin mengubah `pending` menjadi `confirmed`, browser admin memakai transaksi Firestore untuk membaca stok terbaru, menolak jika stok kurang, mengurangi stok dan mengubah status order dalam satu transaksi. Firestore Rules membatasi operasi itu ke admin dan Firestore menjaga transaksi atomik, termasuk terhadap konfirmasi bersamaan. Admin tetap harus memeriksa harga, tanggal, stok fisik, dan ongkir sebelum konfirmasi. Operasi lain (misalnya membatalkan order setelah dikonfirmasi) tidak mengembalikan stok otomatis; lakukan koreksi inventori manual dari produk hanya setelah memeriksa kondisi fisik.

Status pesanan: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `completed`, `cancelled`.

## Deploy Rules secara manual

Deployment tidak dijalankan oleh repository ini. Untuk menerapkan rules setelah review:

1. Pastikan Firebase CLI terpasang dan Anda memilih project Firebase yang benar (`firebase use <project-id>`).
2. Bandingkan `firestore.rules` dengan Rules yang sedang aktif dan uji akses customer/admin menggunakan Emulator atau Rules Playground.
3. Deploy hanya rules dengan `firebase deploy --only firestore:rules` setelah Anda menyetujui dan menjalankan perintah sendiri.
4. Uji katalog publik, pembuatan order milik pengguna login, pembacaan order sendiri, serta penolakan update order/stok oleh customer. Uji juga create/update produk, kategori, settings dan status order oleh admin.

Jangan deploy rules sebelum memastikan setidaknya satu akun admin yang sah masih dapat masuk. Rules tidak mengizinkan customer mengubah status atau menghapus order, dan hanya admin boleh mengubah stok, produk, kategori, settings, atau data admin.

## Sebelum Produksi

- Checkout adalah pemesanan manual, bukan bukti pembayaran otomatis. Harga, ketersediaan, tanggal pemenuhan, ongkir, dan metode pembayaran harus dikonfirmasi admin melalui WhatsApp.
- Stok baru dikurangi pada transisi admin `pending` → `confirmed`; admin perlu memeriksa pesanan dan inventaris fisik. Stok tidak otomatis dikembalikan jika order terkonfirmasi kemudian dibatalkan.
- Deploy dan uji Firestore Rules dengan project yang benar sebelum menerima pesanan. Aturan lokal yang belum dideploy tidak melindungi database aktif.
- Tautan affiliate harus milik program Shopee toko. Disclosure ditampilkan pada kartu/detail: “Tautan affiliate — kami dapat menerima komisi tanpa biaya tambahan untuk Anda.” Pastikan wording sesuai ketentuan program yang digunakan.
- Tambahkan kebijakan privasi yang menjelaskan pemrosesan nama, nomor WhatsApp, alamat, catatan pesanan, data Firebase, dan pembagian data ketika pembeli diarahkan ke WhatsApp. Teks halaman privasi bawaan perlu ditinjau untuk kebijakan usaha dan wilayah toko.
- Isi nomor WhatsApp toko dan ganti placeholder foto dengan foto produk milik sendiri.
- Konfigurasi environment yang sama pada hosting, tinjau domain Firebase Auth, Cloudinary preset, monitoring, backup, dan rencana operasional admin sebelum deploy Vercel.
- Tidak ada deployment Firebase, Cloudinary, atau Vercel yang dilakukan dalam implementasi ini.
