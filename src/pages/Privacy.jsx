import { Shield } from 'lucide-react';

const Privacy = () => (
  <main className="max-w-3xl mx-auto px-4 py-12">
    <div className="card p-6 sm:p-10">
      <Shield className="text-dusty-rose" size={34} />
      <h1 className="text-3xl font-bold mt-3 text-charcoal">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-charcoal/70">Draf untuk rybelflorist — tinjau dan lengkapi identitas serta kontak usaha sebelum produksi.</p>
      <div className="mt-8 space-y-5 leading-relaxed text-charcoal/80">
        <section>
          <h2 className="font-bold text-xl text-charcoal">Data yang digunakan</h2>
          <p>Kami menggunakan nama, email, nomor WhatsApp, alamat pengiriman bila dipilih, tanggal pesanan, catatan, serta isi kartu ucapan untuk mengelola akun dan memproses pesanan. Data akun dan pesanan disimpan di Firebase/Firestore. Keranjang disimpan pada browser.</p>
        </section>
        <section>
          <h2 className="font-bold text-xl text-charcoal">WhatsApp</h2>
          <p>Setelah pesanan disimpan, aplikasi membuka WhatsApp dengan ringkasan yang sudah diisi. Anda memilih sendiri untuk mengirim pesan tersebut. Pemrosesan setelah beralih ke WhatsApp mengikuti kebijakan WhatsApp.</p>
        </section>
        <section>
          <h2 className="font-bold text-xl text-charcoal">Tautan affiliate</h2>
          <p>Produk affiliate mengarahkan Anda ke Shopee. Jika Anda membuka tautan, aktivitas pada situs tersebut mengikuti ketentuan dan kebijakan privasi Shopee.</p>
        </section>
        <section>
          <h2 className="font-bold text-xl text-charcoal">Permintaan data</h2>
          <p>Tambahkan alamat email atau nomor kontak resmi toko di sini agar pelanggan dapat mengajukan akses, koreksi, atau penghapusan data. Lengkapi tujuan, masa simpan, dasar pemrosesan, kontak pengelola, dan tanggal berlaku kebijakan sesuai praktik usaha dan hukum yang berlaku sebelum publikasi.</p>
        </section>
      </div>
    </div>
  </main>
);

export default Privacy;
