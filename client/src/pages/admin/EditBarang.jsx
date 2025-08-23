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
import toast from 'react-hot-toast';

const formatRupiah = (angka) => {
  if (!angka) return "";
  const number_string = angka.toString().replace(/[^,\d]/g, '');
  const split = number_string.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  return rupiah;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export function EditBarang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_barang: "",
    kode_barang: "",
    kategori_id: "",
    merk: "",
    tipe: "",
    sumber_dana: "",
    tanggal_perolehan: "",
    nilai_perolehan: "",
    status: "",
  });
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    const fetchKategori = async () => {
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        setKategoriList(await response.json());
      } catch (error) {
        toast.error("Gagal memuat daftar kategori.");
      }
    };
    
    const fetchBarangData = async () => {
      try {
        const response = await fetch(`/api/barang/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data barang");
        const data = await response.json();
        setFormData({ ...data, tanggal_perolehan: formatDate(data.tanggal_perolehan) });
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchKategori();
    fetchBarangData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nilai_perolehan') {
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleKategoriChange = (value) => {
    setFormData((prev) => ({ ...prev, kategori_id: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading('Memperbarui data...');

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
      
      toast.success("Data barang berhasil diperbarui!", { id: toastId });
      setTimeout(() => navigate("/admin/data-barang"), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nama Barang*" name="nama_barang" value={formData.nama_barang || ''} onChange={handleChange} required />
              <Input label="Kode Barang*" name="kode_barang" value={formData.kode_barang || ''} onChange={handleChange} required />
              <Select label="Kategori" name="kategori_id" value={String(formData.kategori_id || '')} onChange={handleKategoriChange}>
                {kategoriList.map((kat) => (
                  <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>
                ))}
              </Select>
              <Input label="Merk" name="merk" value={formData.merk || ''} onChange={handleChange} />
              <Input label="Tipe" name="tipe" value={formData.tipe || ''} onChange={handleChange} />
              <Input label="Sumber Dana" name="sumber_dana" value={formData.sumber_dana || ''} onChange={handleChange} />
              <Input type="date" label="Tanggal Perolehan*" name="tanggal_perolehan" value={formData.tanggal_perolehan} onChange={handleChange} required />
              <Input type="text" label="Nilai Perolehan (Rp)*" name="nilai_perolehan" value={formatRupiah(formData.nilai_perolehan)} onChange={handleChange} required />
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
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-barang")} disabled={loading}>Batal</Button>
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default EditBarang;