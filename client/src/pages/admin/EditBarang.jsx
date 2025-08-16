import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Button,
  Select,
  Option,
} from "@material-tailwind/react";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export function EditBarang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kategoriList, setKategoriList] = useState([]);
  const [formData, setFormData] = useState({
    nama_barang: "",
    kode_barang: "",
    kategori_id: "",
    merk: "",
    tipe: "",
    tanggal_perolehan: "",
    nilai_perolehan: "",
    status: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    const fetchKategori = async () => {
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal memuat daftar kategori");
        const data = await response.json();
        setKategoriList(data);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchBarangData = async () => {
      try {
        const response = await fetch(`/api/barang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data barang");
        const data = await response.json();
        setFormData({ 
          ...data, 
          tanggal_perolehan: formatDate(data.tanggal_perolehan),
          kategori_id: data.kategori_id ? String(data.kategori_id) : "" // Pastikan kategori_id adalah string
        });
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchKategori();
    fetchBarangData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKategoriChange = (value) => {
    setFormData((prev) => ({ ...prev, kategori_id: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/barang/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal memperbarui data");
      setSuccess("Data barang berhasil diperbarui!");
      setTimeout(() => navigate("/admin/data-barang"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">Edit Barang</Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            {success && <Typography color="green" className="text-center">{success}</Typography>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nama Barang*" name="nama_barang" value={formData.nama_barang || ''} onChange={handleChange} required />
              <Input label="Kode Barang*" name="kode_barang" value={formData.kode_barang || ''} onChange={handleChange} required />
              <Select label="Kategori" name="kategori_id" value={formData.kategori_id} onChange={handleKategoriChange}>
                {kategoriList.map((kat) => (
                  <Option key={kat.id} value={String(kat.id)}>
                    {kat.nama_kategori}
                  </Option>
                ))}
              </Select>
              <Input label="Merk" name="merk" value={formData.merk || ''} onChange={handleChange} />
              <Input label="Tipe" name="tipe" value={formData.tipe || ''} onChange={handleChange} />
              <Input type="date" label="Tanggal Perolehan*" name="tanggal_perolehan" value={formData.tanggal_perolehan} onChange={handleChange} required />
              <Input type="number" label="Nilai Perolehan (Rp)*" name="nilai_perolehan" value={formData.nilai_perolehan || ''} onChange={handleChange} required />
              <Select label="Status*" name="status" value={formData.status} onChange={handleStatusChange}>
                <Option value="Tersedia">Tersedia</Option>
                <Option value="Dipinjam">Dipinjam</Option>
                <Option value="Dalam Perbaikan">Dalam Perbaikan</Option>
                <Option value="Rusak Berat">Rusak Berat</Option>
                <Option value="Tidak Aktif">Tidak Aktif</Option>
              </Select>
            </div>
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-barang")}>Batal</Button>
            <Button variant="gradient" type="submit">Simpan Perubahan</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default EditBarang;