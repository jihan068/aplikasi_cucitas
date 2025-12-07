const API_URL = "api.php";

document.addEventListener("DOMContentLoaded", () => {
    loadData();

    // 1. Live Search
    document.getElementById("search").addEventListener("keyup", (e) => loadData(e.target.value));

    // 2. Tambah Pesanan (AKSI: TAMBAH)
    document.getElementById("formPesanan").addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            aksi: 'tambah', // PENTING
            nama: document.getElementById("nama").value,
            hp: document.getElementById("hp").value,
            tas: document.getElementById("tas").value,
            layanan: document.getElementById("layanan").value
        };
        await sendData(data);
        document.getElementById("formPesanan").reset();
    });

    // 3. Simpan Edit (AKSI: EDIT)
    document.getElementById("formEdit").addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            aksi: 'edit', // PENTING
            id: document.getElementById("editId").value,
            nama: document.getElementById("editNama").value,
            hp: document.getElementById("editHp").value,
            tas: document.getElementById("editTas").value,
            layanan: document.getElementById("editLayanan").value
        };
        await sendData(data);
        
        // Tutup Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEdit'));
        modal.hide();
    });
});

// --- FUNGSI KIRIM DATA (POST) ---
async function sendData(dataJson) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataJson)
        });
        const result = await res.json();
        
        if(result.error) {
            alert("Gagal: " + result.error);
        } else {
            alert(result.message);
            loadData(); // Refresh tabel otomatis
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem!");
    }
}

// --- LOAD DATA ---
async function loadData(query = "") {
    const res = await fetch(`${API_URL}?q=${query}`);
    const data = await res.json();
    let html = "";
    
    data.forEach(item => {
        let harga = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga);
        
        // Warna Status: Hijau jika Selesai, Kuning jika Pending
        let badgeClass = item.status === 'Selesai' ? 'bg-success' : 'bg-warning text-dark';
        
        // Tombol Selesai hanya muncul kalau statusnya masih Pending
        let btnSelesai = item.status === 'Pending' 
            ? `<button class="btn btn-sm btn-success me-1" onclick="updateStatus(${item.id})"><i class="fas fa-check"></i> Selesai</button>` 
            : `<button class="btn btn-sm btn-secondary me-1" disabled><i class="fas fa-check-double"></i> Beres</button>`;

        // Siapkan data untuk tombol edit (handle kutip biar gak error)
        let safeData = JSON.stringify(item).replace(/"/g, "&quot;");

        html += `
            <tr>
                <td><b>${item.nama_customer}</b><br><small>${item.no_hp}</small></td>
                <td>${item.detail_paket}</td>
                <td class="fw-bold">${harga}</td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
                <td>
                    ${btnSelesai}
                    <button class="btn btn-sm btn-primary me-1" onclick="openEditModal(${safeData})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="hapusData(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById("tableBody").innerHTML = html;
}

// --- UPDATE STATUS (AKSI: UPDATE_STATUS) ---
async function updateStatus(id) {
    if(confirm("Apakah cucian ini sudah selesai?")) {
        const data = {
            aksi: 'update_status', // PENTING
            id: id
        };
        await sendData(data);
    }
}

// --- HELPER LAIN ---
function openEditModal(item) {
    document.getElementById("editId").value = item.id;
    document.getElementById("editNama").value = item.nama_customer;
    document.getElementById("editHp").value = item.no_hp;
    
    // Set dropdown (Fallback jika data gabungan)
    document.getElementById("editTas").value = item.tipe_tas || "Lainnya"; 
    document.getElementById("editLayanan").value = item.layanan || "Standard";
    
    new bootstrap.Modal(document.getElementById('modalEdit')).show();
}

async function hapusData(id) {
    if(confirm("Hapus pesanan ini?")) {
        await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
        loadData();
    }
}