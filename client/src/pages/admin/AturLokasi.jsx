import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Textarea } from "@material-tailwind/react";

export function AturLokasi() {
  const { id: barangId } = useParams();
  const navigate = useNavigate();
  
  const [barang, setBarang] = useState(null);
  const [lokasiData, setLokasiData] = useState({
    nama_lokasi: "",
    provinsi: "Jawa Barat",
    kab_kota: "Kota Bandung",
    kecamatan: "",
    kelurahan_desa: "",
    deskripsi: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Efek ini akan berjalan saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchData = async () => {
      try {
        // 1. Ambil data barang
        const barangResponse = await fetch(`/api/barang/${barangId}`, { headers: { Authorization: `Bearer ${token}` } });
        const barangData = await barangResponse.json();
        setBarang(barangData);

        // 2. Cek apakah barang sudah punya lokasi_id
        if (barangData.lokasi_id) {
          // Jika sudah ada, ambil detail lokasi tersebut
          const lokasiResponse = await fetch(`/api/lokasi/${barangData.lokasi_id}`, { headers: { Authorization: `Bearer ${token}` } });
          const existingLokasiData = await lokasiResponse.json();
          setLokasiData(existingLokasiData); // Isi form dengan data yang ada
        }
      } catch (err) {
        setError("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [barangId]);

  const handleChange = (e) => {
    setLokasiData({ ...lokasiData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");

    try {
      // Cek apakah barang sudah punya lokasi_id untuk menentukan mode (EDIT atau CREATE)
      if (barang.lokasi_id) {
        // MODE EDIT: Perbarui data lokasi yang sudah ada
        const response = await fetch(`/api/lokasi/${barang.lokasi_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(lokasiData),
        });
        if (!response.ok) throw new Error("Gagal memperbarui data lokasi.");

      } else {
        // MODE CREATE: Buat lokasi baru, lalu tautkan ke barang
        // 1. Buat entri lokasi baru
        const lokasiResponse = await fetch('/api/lokasi', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(lokasiData),
        });
        const newLokasi = await lokasiResponse.json();
        if (!lokasiResponse.ok) throw new Error(newLokasi.message || "Gagal menyimpan data lokasi.");
        
        // 2. Update barang dengan ID lokasi yang baru
        const updatedBarangData = { ...barang, lokasi_id: newLokasi.lokasi.id };
        const barangResponse = await fetch(`/api/barang/${barangId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedBarangData),
        });
        if (!barangResponse.ok) throw new Error("Gagal memperbarui lokasi pada barang.");
      }
      
      navigate("/admin/data-barang");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography className="text-center mt-12">Memuat data...</Typography>;
  }

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Atur Lokasi untuk: {barang ? barang.nama_barang : '...'}
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nama Lokasi/Ruangan*" name="nama_lokasi" value={lokasiData.nama_lokasi || ''} onChange={handleChange} required />
                <Input label="Provinsi" name="provinsi" value={lokasiData.provinsi || ''} onChange={handleChange} />
                <Input label="Kabupaten/Kota" name="kab_kota" value={lokasiData.kab_kota || ''} onChange={handleChange} />
                <Input label="Kecamatan" name="kecamatan" value={lokasiData.kecamatan || ''} onChange={handleChange} />
                <Input label="Kelurahan/Desa" name="kelurahan_desa" value={lokasiData.kelurahan_desa || ''} onChange={handleChange} />
            </div>
            <Textarea label="Deskripsi/Keterangan Tambahan" name="deskripsi" value={lokasiData.deskripsi || ''} onChange={handleChange} />
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-barang")}>Batal</Button>
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Lokasi'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default AturLokasi;