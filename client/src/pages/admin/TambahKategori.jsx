import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button } from "@material-tailwind/react";

export function TambahKategori() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nama_kategori: "", kode_kategori: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch('/api/kategori', {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      navigate("/admin/data-kategori");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">Tambah Kategori Baru</Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            <Input label="Nama Kategori" name="nama_kategori" onChange={handleChange} required />
            <Input label="Kode Kategori" name="kode_kategori" onChange={handleChange} required />
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-kategori")}>Batal</Button>
            <Button variant="gradient" type="submit">Simpan</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahKategori;