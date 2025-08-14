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

export function EditPengguna() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nama: "",
    username: "",
    role: "",
    jabatan: "", 
    nip: "",
    password: "", 
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Gagal mengambil data pengguna");
        }
        const data = await response.json();
        // Jangan sertakan password saat mengambil data awal
        setUserData({ ...data, password: "" }); 
      } catch (err) {
        setError(err.message);
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
    setError("");
    setSuccess("");
    const token = localStorage.getItem("authToken");
    
    // Siapkan data untuk dikirim
    const dataToUpdate = {
      nama: userData.nama,
      username: userData.username,
      role: userData.role,
      jabatan: userData.jabatan,
      nip: userData.nip,
    };
    
    // Hanya tambahkan password jika diisi
    if (userData.password) {
      dataToUpdate.password = userData.password;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate), // <-- Kirim data yang sudah disiapkan
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui data");
      }
      setSuccess("Data pengguna berhasil diperbarui!");
      setTimeout(() => navigate("/admin/data-pengguna"), 2000);
    } catch (err) {
      setError(err.message);
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
            {error && (
              <Typography color="red" className="text-center">
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="green" className="text-center">
                {success}
              </Typography>
            )}
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
              label="Jabatan" name="jabatan" value={userData.jabatan || ''} onChange={handleChange}
            />
            <Input
              label="NIP" name="nip" value={userData.nip || ''} onChange={handleChange}
            />
            {/* Tambahkan input password baru */}
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
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-pengguna")}>
              Batal
            </Button>
            <Button variant="gradient" type="submit">
              Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default EditPengguna;