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

export function TambahPengguna() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    password: "",
    role: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("authToken");

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
      setSuccess("Pengguna baru berhasil dibuat!");
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
            Tambah Pengguna Baru
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            {success && <Typography color="green" className="text-center">{success}</Typography>}
            
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
             <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-pengguna")}>
              Batal
            </Button>
            <Button variant="gradient" type="submit">
              Simpan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahPengguna;