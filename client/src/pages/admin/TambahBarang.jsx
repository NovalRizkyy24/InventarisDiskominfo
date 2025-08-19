import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import toast from 'react-hot-toast'; // 1. Impor toast

export function TambahBarang() {
  const navigate = useNavigate();
  const [kategoriList, setKategoriList] = useState([]);
  const [formData, setFormData] = useState({
    nama_barang: "",
    kode_barang: "",
    kategori_id: "",
    merk: "",
    tipe: "",
    sumber_dana: "",
    tanggal_perolehan: "",
    nilai_perolehan: "",
    status: "Tersedia",
  });
  const [loading, setLoading] = useState(false); // 2. Tambahkan state loading

  useEffect(() => {
    const fetchKategori = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        setKategoriList(data);
      } catch (error) {
        toast.error("Gagal memuat daftar kategori.");
      }
    };
    fetchKategori();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleKategoriChange = (value) => {
    setFormData((prev) => ({...prev, kategori_id: value}));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({...prev, status: value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // 3. Atur loading
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading('Menyimpan data...');

    try {
      const response = await fetch('/api/barang', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menambah barang baru");
      }
      
      toast.success("Barang baru berhasil ditambahkan!", { id: toastId });
      setTimeout(() => navigate("/admin/data-barang"), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false); // 4. Atur loading false jika gagal
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Tambah Barang Baru
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nama Barang*" name="nama_barang" onChange={handleChange} required />
              <Input label="Kode Barang*" name="kode_barang" onChange={handleChange} required />
              <Select label="Kategori" name="kategori_id" onChange={handleKategoriChange}>
                {kategoriList.map((kat) => (
                  <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>
                ))}
              </Select>
              <Input label="Merk" name="merk" onChange={handleChange} />
              <Input label="Tipe" name="tipe" onChange={handleChange} />
              <Input label="Sumber Dana" name="sumber_dana" onChange={handleChange} />
              <Input type="date" label="Tanggal Perolehan*" name="tanggal_perolehan" onChange={handleChange} required />
              <Input type="number" label="Nilai Perolehan (Rp)*" name="nilai_perolehan" onChange={handleChange} required />
              <Select label="Status*" name="status" value={formData.status} onChange={handleStatusChange}>
                <Option value="Tersedia">Tersedia</Option>
                <Option value="Dipinjam">Dipinjam</Option>
                <Option value="Dalam Perbaikan">Dalam Perbaikan</Option>
                <Option value="Rusak Berat">Rusak Berat</Option>
              </Select>
            </div>
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-barang")} disabled={loading}>
              Batal
            </Button>
            {/* 5. Terapkan state loading ke tombol */}
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahBarang;