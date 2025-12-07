<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// --- KONEKSI DATABASE ---
$host = "localhost"; $user = "root"; $pass = ""; $db = "db_tas";
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) { echo json_encode(["error" => "DB Gagal"]); exit(); }

$method = $_SERVER['REQUEST_METHOD'];

// --- GET (BACA DATA) ---
if ($method === 'GET') {
    $search = isset($_GET['q']) ? $conn->real_escape_string($_GET['q']) : '';
    $sql = "SELECT * FROM v_data_pesanan";
    if ($search) $sql .= " WHERE nama_customer LIKE '%$search%' OR detail_paket LIKE '%$search%'";
    $sql .= " ORDER BY id DESC";
    echo json_encode($conn->query($sql)->fetch_all(MYSQLI_ASSOC));
}

// --- POST (TAMBAH / EDIT / STATUS) ---
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    // Cek aksi apa yang diminta
    $aksi = isset($input['aksi']) ? $input['aksi'] : '';

    // 1. TAMBAH DATA BARU
    if ($aksi === 'tambah') {
        $nama = $input['nama']; $hp = $input['hp']; $tas = $input['tas']; $layanan = $input['layanan'];
        
        // Hitung Harga via Python
        $command = "python calc.py \"$tas\" \"$layanan\""; 
        $output = shell_exec($command);
        $pyData = json_decode($output, true);
        $harga = isset($pyData['harga']) ? $pyData['harga'] : 50000; // Default

        $stmt = $conn->prepare("CALL sp_tambah_pesanan(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssd", $nama, $hp, $tas, $layanan, $harga);
        
        if ($stmt->execute()) echo json_encode(["message" => "Pesanan Berhasil Disimpan!"]);
        else echo json_encode(["error" => $stmt->error]);
    }

    // 2. UPDATE STATUS (TOMBOL SELESAI)
    elseif ($aksi === 'update_status') {
        $id = $input['id'];
        // Panggil prosedur update status
        $stmt = $conn->prepare("CALL sp_update_status(?, 'Selesai')");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) echo json_encode(["message" => "Status Berubah Jadi Selesai!"]);
        else echo json_encode(["error" => $stmt->error]);
    }

    // 3. EDIT DATA
    elseif ($aksi === 'edit') {
        $id = $input['id']; 
        $nama = $input['nama']; $hp = $input['hp']; $tas = $input['tas']; $layanan = $input['layanan'];

        // Hitung ulang harga via Python (siapa tau ganti tas/layanan)
        $command = "python calc.py \"$tas\" \"$layanan\""; 
        $output = shell_exec($command);
        $pyData = json_decode($output, true);
        $hargaBaru = isset($pyData['harga']) ? $pyData['harga'] : 50000;

        $stmt = $conn->prepare("CALL sp_update_pesanan(?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issssd", $id, $nama, $hp, $tas, $layanan, $hargaBaru);

        if ($stmt->execute()) echo json_encode(["message" => "Data Berhasil Diupdate!"]);
        else echo json_encode(["error" => $stmt->error]);
    }
    
    else {
        echo json_encode(["error" => "Aksi tidak dikenali"]);
    }
}

// --- DELETE (HAPUS) ---
elseif ($method === 'DELETE') {
    $id = $_GET['id'];
    if($conn->query("DELETE FROM pesanan WHERE id=$id")) echo json_encode(["message" => "Dihapus"]);
    else echo json_encode(["error" => "Gagal hapus"]);
}
?>