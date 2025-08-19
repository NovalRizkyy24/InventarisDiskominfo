import React, { useState } from "react";
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
import toast from 'react-hot-toast'; // <-- 1. Impor toast

export function TambahPengguna() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false); // <-- 2. Tambahkan state untuk loading

  const userRoles = [
    "Pengurus Barang",
    "Penata Usaha Barang",
    "PPK",
    "Kepala Bidang",
    "Kepala Dinas",
    "Admin",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // <-- 3. Set loading menjadi true saat proses dimulai
    const token = localStorage.getItem("authToken");

    // Tampilkan notifikasi "loading"
    const toastId = toast.loading('Menyimpan data...');

    try {
      const response = await fetch(`/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat pengguna baru");
      }

      // Tampilkan notifikasi sukses
      toast.success('Pengguna baru berhasil dibuat!', { id: toastId });
      
      setTimeout(() => navigate("/admin/data-pengguna"), 1500); // Beri jeda agar user bisa lihat notifikasi

    } catch (err) {
      // Tampilkan notifikasi error
      toast.error(err.message || 'Terjadi kesalahan.', { id: toastId });
      setLoading(false); // <-- 4. Set loading false jika gagal
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Tambah Pengguna Baru
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            <Input label="Nama Lengkap" name="nama" onChange={handleChange} required />
            <Input label="Username" name="username" onChange={handleChange} required />
            <Input type="password" label="Password" name="password" onChange={handleChange} required />
            
            <Select label="Peran" name="role" onChange={handleRoleChange} required>
              {userRoles.map((role) => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-pengguna")} disabled={loading}>
              Batal
            </Button>
            {/* <-- 5. Tambahkan logika loading pada tombol simpan --> */}
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahPengguna;