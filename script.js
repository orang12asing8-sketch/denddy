/* ==========================================================================
   1. DATA AWAL & INISIALISASI (LOCAL STORAGE)
   ========================================================================== */

// Data default daftar siswa kelas (bisa disesuaikan nama siswanya)
const defaultSiswa = [
    { id: "S01", nama: "Ahmad Fauzi", iuran: { m1: true, m2: false, m3: false, m4: false } },
    { id: "S02", nama: "Budi Santoso", iuran: { m1: true, m2: true, m3: false, m4: false } },
    { id: "S03", nama: "Citra Lestari", iuran: { m1: true, m2: true, m3: true, m4: false } },
    { id: "S04", nama: "Dimas Anggara", iuran: { m1: false, m2: false, m3: false, m4: false } },
    { id: "S05", nama: "Eka Putri", iuran: { m1: true, m2: true, m3: true, m4: true } }
];

// Ambil data dari localStorage atau gunakan data default jika kosong
let daftarSiswa = JSON.parse(localStorage.getItem('catatUang_siswa')) || defaultSiswa;
let daftarTransaksi = JSON.parse(localStorage.getItem('catatUang_transaksi')) || [];

// Jalankan fungsi render saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Set tanggal default pada form menjadi hari ini
    const inputTanggal = document.getElementById('tanggal');
    if (inputTanggal) {
        inputTanggal.valueAsDate = new Date();
    }

    // Muat seluruh data ke tampilan (UI)
    muatUlangAplikasi();
});


/* ==========================================================================
   2. SISTEM NAVIGASI TAB
   ========================================================================== */

/**
 * Berpindah antar tab tampilan (Dashboard, Kas Siswa, Buku Kas)
 * @param {string} namaTab - ID tab yang ingin ditampilkan
 */
function switchTab(namaTab) {
    // 1. Sembunyikan semua konten tab
    const semuaTab = document.querySelectorAll('.tab-content');
    semuaTab.forEach(tab => tab.classList.remove('active'));

    // 2. Hilangkan status aktif pada semua tombol navigasi
    const semuaTombol = document.querySelectorAll('.nav-btn');
    semuaTombol.forEach(btn => btn.classList.remove('active'));

    // 3. Tampilkan tab yang dipilih
    document.getElementById(`tab-${namaTab}`).classList.add('active');

    // 4. Beri tanda aktif pada tombol yang diklik
    event.currentTarget.classList.add('active');
}


/* ==========================================================================
   3. PENGELOLAAN TRANSAKSI (TAMBAH & HAPUS)
   ========================================================================== */

// Tangkap elemen form transaksi
const formTransaksi = document.getElementById('formTransaksi');

if (formTransaksi) {
    formTransaksi.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah halaman melakukan reload bawaan HTML

        // Ambil nilai dari form
        const tipe = document.querySelector('input[name="tipeTransaksi"]:checked').value;
        const tanggal = document.getElementById('tanggal').value;
        const kategori = document.getElementById('kategori').value;
        const nominal = parseFloat(document.getElementById('nominal').value);
        const keterangan = document.getElementById('keterangan').value;

        // Validasi sederhana
        if (!nominal || nominal <= 0) {
            alert('Masukkan nominal angka yang valid!');
            return;
        }

        // Jika transaksi KELUAR, cek apakah saldo mencukupi
        if (tipe === 'KELUAR') {
            const totalSaldo = hitungTotalSaldo();
            if (nominal > totalSaldo) {
                alert('Gagal! Saldo kas tidak mencukupi untuk pengeluaran ini.');
                return;
            }
        }

        // Buat objek data transaksi baru
        const transaksiBaru = {
            id: 'TRX-' + Date.now(), // ID unik berdasarkan waktu
            tanggal: tanggal,
            tipe: tipe,
            kategori: kategori,
            nominal: nominal,
            keterangan: keterangan
        };

        // Masukkan ke dalam array transaksi (di posisi paling atas/terbaru)
        daftarTransaksi.unshift(transaksiBaru);

        // Simpan ke LocalStorage dan perbarui tampilan
        simpanKeLocalStorage();
        muatUlangAplikasi();

        // Reset form setelah berhasil disimpan
        formTransaksi.reset();
        document.getElementById('tanggal').valueAsDate = new Date(); // Kembalikan tanggal hari ini
        
        alert('Transaksi berhasil disimpan!');
    });
}

/**
 * Menghapus transaksi berdasarkan ID
 * @param {string} id - ID transaksi
 */
function hapusTransaksi(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        daftarTransaksi = daftarTransaksi.filter(trx => trx.id !== id);
        simpanKeLocalStorage();
        muatUlangAplikasi();
    }
}


/* ==========================================================================
   4. PENGELOLAAN KAS SISWA (IURAN MINGGUAN)
   ========================================================================== */

/**
 * Mengubah status iuran siswa (Lunas / Belum) pada minggu tertentu
 * @param {string} idSiswa - ID Siswa
 * @param {string} minggu - Minggu ke (m1, m2, m3, m4)
 */
function toggleStatusIuran(idSiswa, minggu) {
    const siswa = daftarSiswa.find(s => s.id === idSiswa);
    if (siswa) {
        // Ubah status boolean true/false
        siswa.iuran[minggu] = !siswa.iuran[minggu];

        // Jika diubah jadi lunas, otomatis catat sebagai pemasukan kas masuk (opsional)
        simpanKeLocalStorage();
        muatUlangAplikasi();
    }
}


/* ==========================================================================
   5. KALKULASI KEUANGAN & RENDER KE HTML (DOM MANIPULATION)
   ========================================================================== */

/**
 * Menghitung total uang masuk
 */
function hitungTotalMasuk() {
    return daftarTransaksi
        .filter(trx => trx.tipe === 'MASUK')
        .reduce((total, trx) => total + trx.nominal, 0);
}

/**
 * Menghitung total uang keluar
 */
function hitungTotalKeluar() {
    return daftarTransaksi
        .filter(trx => trx.tipe === 'KELUAR')
        .reduce((total, trx) => total + trx.nominal, 0);
}

/**
 * Menghitung sisa saldo akhir (Masuk - Keluar)
 */
function hitungTotalSaldo() {
    return hitungTotalMasuk() - hitungTotalKeluar();
}

/**
 * Format angka menjadi format mata uang Rupiah (contoh: Rp 10.000)
 * @param {number} angka 
 */
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

/**
 * Fungsi utama untuk memperbarui seluruh data dan tampilan di layar
 */
function muatUlangAplikasi() {
    // 1. Perbarui Kartu Ringkasan Saldo di Atas
    document.getElementById('totalSaldo').innerText = formatRupiah(hitungTotalSaldo());
    document.getElementById('totalMasuk').innerText = formatRupiah(hitungTotalMasuk());
    document.getElementById('totalKeluar').innerText = formatRupiah(hitungTotalKeluar());

    // 2. Render Tabel Transaksi Cepat (Dashboard)
    renderQuickTransaksi();

    // 3. Render Tabel Buku Kas Lengkap
    renderBukuKas(daftarTransaksi);

    // 4. Render Tabel Matriks Kas Siswa
    renderKasSiswa();
}

/**
 * Render 5 transaksi terakhir untuk ditampilkan di Dashboard
 */
function renderQuickTransaksi() {
    const tbody = document.getElementById('tabelQuickTransaksi');
    if (!tbody) return;

    tbody.innerHTML = '';
    const dataTerbaru = daftarTransaksi.slice(0, 5); // Ambil 5 data teratas

    if (dataTerbaru.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada transaksi tercatat.</td></tr>`;
        return;
    }

    dataTerbaru.forEach(trx => {
        const badgeTipe = trx.tipe === 'MASUK' 
            ? `<span style="color: var(--success-color); font-weight: 600;">+ Masuk</span>` 
            : `<span style="color: var(--danger-color); font-weight: 600;">- Keluar</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trx.tanggal}</td>
            <td>${trx.keterangan}</td>
            <td>${badgeTipe}</td>
            <td>${formatRupiah(trx.nominal)}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Render tabel riwayat buku kas lengkap
 * @param {Array} data 
 */
function renderBukuKas(data) {
    const tbody = document.getElementById('tabelBukuKas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada riwayat transaksi.</td></tr>`;
        return;
    }

    data.forEach(trx => {
        const badgeTipe = trx.tipe === 'MASUK' 
            ? `<span class="badge-status lunas">MASUK</span>` 
            : `<span class="badge-status belum">KELUAR</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trx.tanggal}</td>
            <td>${trx.kategori}</td>
            <td>${trx.keterangan}</td>
            <td>${badgeTipe}</td>
            <td>${formatRupiah(trx.nominal)}</td>
            <td>
                <button class="btn-text" style="color: var(--danger-color);" onclick="hapusTransaksi('${trx.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Render tabel matriks iuran kas mingguan siswa
 */
function renderKasSiswa() {
    const tbody = document.getElementById('tabelKasSiswa');
    if (!tbody) return;

    tbody.innerHTML = '';

    daftarSiswa.forEach((siswa, index) => {
        // Buat badge status lunas/belum untuk tiap minggu
        const badgeM1 = `<span class="badge-status ${siswa.iuran.m1 ? 'lunas' : 'belum'}" style="cursor:pointer;" onclick="toggleStatusIuran('${siswa.id}', 'm1')">${siswa.iuran.m1 ? 'Lunas' : 'Belum'}</span>`;
        const badgeM2 = `<span class="badge-status ${siswa.iuran.m2 ? 'lunas' : 'belum'}" style="cursor:pointer;" onclick="toggleStatusIuran('${siswa.id}', 'm2')">${siswa.iuran.m2 ? 'Lunas' : 'Belum'}</span>`;
        const badgeM3 = `<span class="badge-status ${siswa.iuran.m3 ? 'lunas' : 'belum'}" style="cursor:pointer;" onclick="toggleStatusIuran('${siswa.id}', 'm3')">${siswa.iuran.m3 ? 'Lunas' : 'Belum'}</span>`;
        const badgeM4 = `<span class="badge-status ${siswa.iuran.m4 ? 'lunas' : 'belum'}" style="cursor:pointer;" onclick="toggleStatusIuran('${siswa.id}', 'm4')">${siswa.iuran.m4 ? 'Lunas' : 'Belum'}</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${siswa.nama}</strong></td>
            <td>${badgeM1}</td>
            <td>${badgeM2}</td>
            <td>${badgeM3}</td>
            <td>${badgeM4}</td>
            <td>
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="bayarSemua('${siswa.id}')">Lunasi Semua</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Fitur tambahan: Melunasi seluruh minggu untuk siswa tertentu
 */
function bayarSemua(idSiswa) {
    const siswa = daftarSiswa.find(s => s.id === idSiswa);
    if (siswa) {
        siswa.iuran.m1 = true;
        siswa.iuran.m2 = true;
        siswa.iuran.m3 = true;
        siswa.iuran.m4 = true;
        simpanKeLocalStorage();
        muatUlangAplikasi();
    }
}


/* ==========================================================================
   6. FILTER TRANSAKSI BERDASARKAN TIPE (MASUK / KELUAR)
   ========================================================================== */

function filterTransaksi() {
    const pilihanFilter = document.getElementById('filterTipe').value;
    
    if (pilihanFilter === 'SEMUA') {
        renderBukuKas(daftarTransaksi);
    } else {
        const dataTersaring = daftarTransaksi.filter(trx => trx.tipe === pilihanFilter);
        renderBukuKas(dataTersaring);
    }
}


/* ==========================================================================
   7. PENYIMPANAN DATA (LOCAL STORAGE)
   ========================================================================== */

function simpanKeLocalStorage() {
    localStorage.setItem('catatUang_transaksi', JSON.stringify(daftarTransaksi));
    localStorage.setItem('catatUang_siswa', JSON.stringify(daftarSiswa));
}
