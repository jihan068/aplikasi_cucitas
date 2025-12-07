import sys
import json

# Menghitung harga (Logic Python)
try:
    # Ambil argumen dari PHP
    tipe_tas = sys.argv[1]
    layanan = sys.argv[2]
except IndexError:
    # Default value jika argumen error
    tipe_tas = "Lainnya"
    layanan = "Standard"

harga = 0

# Daftar Harga Tas Dasar
base_prices = {
    "Coach": 50000, 
    "LV": 100000, 
    "Gucci": 120000, 
    "Prada": 110000,
    "Lainnya": 40000
}

# Daftar Harga Layanan
service_prices = {
    "Standard": 30000, 
    "Deep Clean": 60000, 
    "Recolor": 150000
}

# Kalkulasi
harga += base_prices.get(tipe_tas, 40000)
harga += service_prices.get(layanan, 30000)

# Return JSON ke PHP
print(json.dumps({"harga": harga}))