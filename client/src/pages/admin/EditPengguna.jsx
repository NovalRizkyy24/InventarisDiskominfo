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
import toast from 'react-hot-toast'; // 1. Impor toast

export function EditPengguna() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nama: "",
    username: "",
    role: "",
    password: "", 
  });
  const [loading, setLoading] = useState(false); // 2. Tambahkan state loading

  const userRoles = [
    "Pengurus Barang",
    "Penata Usaha Barang",
    "PPK",
    "Kepala Bidang",
    "Kepala Dinas",
    "Admin",
  ];

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Gagal mengambil data pengguna");
        }
        const data = await response.json();
        setUserData({ ...data, password: "" }); 
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchUserData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setUserData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // 3. Atur loading
    const token = localStorage.getItem("authToken");
    
    const dataToUpdate = {
      nama: userData.nama,
      username: userData.username,
      role: userData.role,
    };
    
    if (userData.password) {
      dataToUpdate.password = userData.password;
    }

    const toastId = toast.loading('Memperbarui data...');

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui data");
      }
      
      toast.success("Data pengguna berhasil diperbarui!", { id: toastId });
      setTimeout(() => navigate("/admin/data-pengguna"), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false); // 4. Atur loading false jika gagal
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Edit Pengguna
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            <Input
              label="Nama Lengkap"
              name="nama"
              value={userData.nama}
              onChange={handleChange}
              required
            />
            <Input
              label="Username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              label="Password Baru (opsional)"
              name="password"
              value={userData.password}
              onChange={handleChange}
            />
            <Select
              label="Peran"
              name="role"
              value={userData.role}
              onChange={handleRoleChange}
              required
            >
              {userRoles.map((role) => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-pengguna")} disabled={loading}>
              Batal
            </Button>
            {/* 5. Terapkan state loading ke tombol */}
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default EditPengguna;