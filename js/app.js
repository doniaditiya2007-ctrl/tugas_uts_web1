// JavaScript aplikasi: login, DOM, katalog, checkout, laporan, dan tracking.
const KEY_USERS = "tokoBuku_users";
const KEY_BOOKS = "tokoBuku_books";
const KEY_ORDERS = "tokoBuku_orders";
const KEY_TRACKING = "tokoBuku_tracking";
const KEY_CURRENT = "tokoBuku_currentUser";

function bacaStorage(key, dataAwal) {
    const tersimpan = localStorage.getItem(key);
    if (tersimpan === null) {
        localStorage.setItem(key, JSON.stringify(dataAwal));
        return dataAwal;
    }
    try { return JSON.parse(tersimpan); }
    catch (error) { return dataAwal; }
}
function simpanStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
function formatRupiah(angka) {
    return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}
function angkaHarga(teks) {
    return Number(String(teks).replace(/[^0-9]/g, ""));
}
function ambilBuku() { return bacaStorage(KEY_BOOKS, dataKatalogBuku); }
function simpanBuku(data) { simpanStorage(KEY_BOOKS, data); }
function ambilPesanan() { return bacaStorage(KEY_ORDERS, []); }
function simpanPesanan(data) { simpanStorage(KEY_ORDERS, data); }
function ambilTracking() {
    return bacaStorage(KEY_TRACKING, dataTracking);
}
function simpanTracking(data) { simpanStorage(KEY_TRACKING, data); }

function inisialisasiLogin() {
    const form = document.getElementById("formLogin");
    if (!form) return;
    const users = bacaStorage(KEY_USERS, dataPengguna);

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const user = users.find(item =>
            item.email.toLowerCase() === email && item.password === password
        );
        if (!user) {
            alert("email/password yang anda masukkan salah");
            return;
        }
        sessionStorage.setItem(KEY_CURRENT, JSON.stringify({
            id: user.id, nama: user.nama, email: user.email, role: user.role
        }));
        window.location.href = "dashboard.html";
    });

    const modalLupa = document.getElementById("modalLupa");
    const modalDaftar = document.getElementById("modalDaftar");
    document.getElementById("btnLupa")?.addEventListener("click", () => modalLupa.showModal());
    document.getElementById("btnDaftar")?.addEventListener("click", () => modalDaftar.showModal());
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => document.getElementById(btn.dataset.close).close());
    });

    document.getElementById("formDaftar")?.addEventListener("submit", function(event) {
        event.preventDefault();
        const nama = document.getElementById("namaDaftar").value.trim();
        const emailBaru = document.getElementById("emailDaftar").value.trim().toLowerCase();
        const passwordBaru = document.getElementById("passwordDaftar").value;
        const daftarUsers = bacaStorage(KEY_USERS, dataPengguna);
        if (daftarUsers.some(item => item.email.toLowerCase() === emailBaru)) {
            alert("Email sudah terdaftar. Gunakan email lain.");
            return;
        }
        daftarUsers.push({ id: Date.now(), nama, email: emailBaru, password: passwordBaru, role: "User" });
        simpanStorage(KEY_USERS, daftarUsers);
        modalDaftar.close();
        this.reset();
        alert("Pendaftaran berhasil. Silakan login.");
    });
}

function inisialisasiDashboard() {
    const greeting = document.getElementById("greeting");
    if (!greeting) return;
    const jam = new Date().getHours();
    let sapaan = "Selamat Malam";
    if (jam >= 4 && jam < 11) sapaan = "Selamat Pagi";
    else if (jam >= 11 && jam < 15) sapaan = "Selamat Siang";
    else if (jam >= 15 && jam < 18) sapaan = "Selamat Sore";
    let user = null;
    try { user = JSON.parse(sessionStorage.getItem(KEY_CURRENT)); } catch(e) {}
    greeting.textContent = sapaan + (user ? ", " + user.nama + "!" : "!");
    const nama = document.getElementById("namaPengguna");
    if (nama) nama.textContent = "Selamat datang di dashboard pengelolaan Toko Buku Online.";
    document.getElementById("btnLogout")?.addEventListener("click", function(event) {
        event.preventDefault();
        sessionStorage.removeItem(KEY_CURRENT);
        window.location.href = "index.html";
    });
}

function inisialisasiStok() {
    const tbody = document.getElementById("tabelBuku");
    const form = document.getElementById("formBuku");
    if (!tbody || !form) return;
    function render() {
        const books = ambilBuku();
        tbody.innerHTML = "";
        books.forEach(buku => {
            const tr = document.createElement("tr");
            const imgCell = document.createElement("td");
            const img = document.createElement("img");
            img.src = buku.cover || "";
            img.alt = "Sampul " + buku.namaBarang;
            img.className = "book-cover";
            if (!buku.cover) img.style.display = "none";
            img.onerror = () => { img.alt = "Gambar tidak tersedia"; img.style.display = "none"; };
            imgCell.appendChild(img);
            tr.appendChild(imgCell);
            [buku.kodeBarang, buku.namaBarang, buku.jenisBarang, buku.edisi, buku.stok, buku.harga]
                .forEach(value => {
                    const td = document.createElement("td");
                    td.textContent = value;
                    tr.appendChild(td);
                });
            tbody.appendChild(tr);
        });
    }
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const buku = {
            kodeBarang: document.getElementById("kode").value.trim(),
            namaBarang: document.getElementById("nama").value.trim(),
            jenisBarang: document.getElementById("jenis").value.trim(),
            edisi: document.getElementById("edisi").value.trim(),
            stok: Number(document.getElementById("stok").value),
            harga: document.getElementById("harga").value.trim(),
            cover: ""
        };
        const books = ambilBuku();
        if (books.some(item => item.kodeBarang.toLowerCase() === buku.kodeBarang.toLowerCase())) {
            alert("Kode buku sudah digunakan. Masukkan kode yang berbeda.");
            return;
        }
        if (buku.stok < 0 || !Number.isFinite(buku.stok)) {
            alert("Stok harus berupa angka nol atau lebih.");
            return;
        }
        books.push(buku);
        simpanBuku(books);
        render();
        form.reset();
        alert("Buku berhasil ditambahkan.");
    });
    render();
}

function inisialisasiCheckout() {
    const form = document.getElementById("formCheckout");
    const select = document.getElementById("pilihBuku");
    if (!form || !select) return;
    const books = ambilBuku();
    books.forEach((buku, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${buku.namaBarang} — ${buku.harga} (stok: ${buku.stok})`;
        select.appendChild(option);
    });
    function hitung() {
        const buku = books[Number(select.value)];
        const jumlah = Number(document.getElementById("jumlah").value);
        const total = buku && jumlah > 0 ? angkaHarga(buku.harga) * jumlah : 0;
        document.getElementById("total").textContent = formatRupiah(total);
    }
    select.addEventListener("change", hitung);
    document.getElementById("jumlah").addEventListener("input", hitung);

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const index = Number(select.value);
        const buku = books[index];
        const jumlah = Number(document.getElementById("jumlah").value);
        if (!buku || !Number.isInteger(jumlah) || jumlah < 1) {
            alert("Silakan pilih buku dan jumlah pembelian yang benar.");
            return;
        }
        const latestBooks = ambilBuku();
        const latestBook = latestBooks.find(item => item.kodeBarang === buku.kodeBarang);
        if (!latestBook || jumlah > latestBook.stok) {
            alert("Stok buku tidak mencukupi.");
            return;
        }
        const total = angkaHarga(buku.harga) * jumlah;
        const nomorDO = "DO" + Date.now().toString().slice(-8);
        const tanggal = new Date().toLocaleString("id-ID");
        const pesanan = {
            nomorDO,
            tanggal,
            nama: document.getElementById("namaPemesan").value.trim(),
            email: document.getElementById("emailPemesan").value.trim(),
            alamat: document.getElementById("alamat").value.trim(),
            buku: buku.namaBarang,
            kodeBarang: buku.kodeBarang,
            jumlah,
            pembayaran: document.getElementById("pembayaran").value,
            total,
            status: "Pesanan diterima"
        };
        latestBook.stok -= jumlah;
        simpanBuku(latestBooks);
        const orders = ambilPesanan();
        orders.unshift(pesanan);
        simpanPesanan(orders);
        const tracking = ambilTracking();
        tracking[nomorDO] = {
            nomorDO, nama: pesanan.nama, status: "Pesanan diterima",
            ekspedisi: "Belum ditentukan", tanggalKirim: new Date().toISOString().slice(0,10),
            paket: "Reguler", total: formatRupiah(total),
            perjalanan: [{ waktu: new Date().toLocaleString("id-ID"), keterangan: "Pesanan diterima dan menunggu proses pengiriman." }]
        };
        simpanTracking(tracking);
        const result = document.getElementById("hasilPesanan");
        result.hidden = false;
        result.innerHTML = `<strong>Pesanan berhasil dicatat!</strong><br>Nomor DO: <strong>${nomorDO}</strong><br>Total: ${formatRupiah(total)}<br>Simpan nomor DO untuk mengecek status di halaman tracking.`;
        form.reset();
        document.getElementById("total").textContent = "Rp 0";
        alert("Pemesanan berhasil. Nomor DO: " + nomorDO);
    });
}

function inisialisasiTracking() {
    const form = document.getElementById("formTracking");
    const hasil = document.getElementById("hasilTracking");
    if (!form || !hasil) return;
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const nomor = document.getElementById("nomorDO").value.trim();
        const semuaTracking = ambilTracking();
        const data = semuaTracking[nomor];
        if (!data) {
            hasil.innerHTML = '<p class="error">Nomor DO tidak ditemukan. Periksa kembali nomor yang dimasukkan.</p>';
            return;
        }
        const daftar = (data.perjalanan || []).map(item =>
            `<li><strong>${item.waktu}</strong><br>${item.keterangan}</li>`
        ).join("");
        const progress = data.status === "Selesai Antar" ? 100 :
                         data.status === "Dikirim" ? 75 :
                         data.status === "Dalam Perjalanan" ? 60 : 25;
        hasil.innerHTML = `
          <div class="notice"><h2>Informasi Pengiriman</h2>
          <p><strong>Nama Pemesan:</strong> ${data.nama}</p>
          <p><strong>Status:</strong> <span class="badge badge-blue">${data.status}</span></p>
          <div class="progress"><span style="width:${progress}%"></span></div>
          <p><strong>Ekspedisi:</strong> ${data.ekspedisi}</p>
          <p><strong>Tanggal Kirim:</strong> ${data.tanggalKirim}</p>
          <p><strong>Jenis Paket:</strong> ${data.paket}</p>
          <p><strong>Total Pembayaran:</strong> ${data.total}</p></div>
          <h3>Riwayat Perjalanan</h3><ol class="timeline">${daftar || "<li>Belum ada riwayat perjalanan.</li>"}</ol>`;
    });
}

function inisialisasiLaporan() {
    const tbody = document.getElementById("tabelLaporan");
    if (!tbody) return;
    const orders = ambilPesanan();
    document.getElementById("jumlahPesanan").textContent = orders.length;
    document.getElementById("nilaiPesanan").textContent = formatRupiah(orders.reduce((sum, item) => sum + item.total, 0));
    tbody.innerHTML = orders.length ? "" : '<tr><td colspan="6">Belum ada pemesanan pada browser ini.</td></tr>';
    orders.forEach(item => {
        const tr = document.createElement("tr");
        [item.nomorDO, item.nama, item.buku, item.jumlah, formatRupiah(item.total), item.status].forEach(value => {
            const td = document.createElement("td"); td.textContent = value; tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}
function inisialisasiHistory() {
    const tbody = document.getElementById("tabelHistory");
    if (!tbody) return;
    const orders = ambilPesanan();
    tbody.innerHTML = orders.length ? "" : '<tr><td colspan="7">Belum ada riwayat transaksi.</td></tr>';
    orders.forEach(item => {
        const tr = document.createElement("tr");
        [item.tanggal, item.nomorDO, item.nama, item.buku, item.jumlah, item.pembayaran, formatRupiah(item.total)].forEach(value => {
            const td = document.createElement("td"); td.textContent = value; tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    inisialisasiLogin();
    inisialisasiDashboard();
    inisialisasiStok();
    inisialisasiCheckout();
    inisialisasiTracking();
    inisialisasiLaporan();
    inisialisasiHistory();
});
