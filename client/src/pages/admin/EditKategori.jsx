import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button } from "@material-tailwind/react";

export function EditKategori() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nama_kategori: "", kode_kategori: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchKategori = async () => {
      const response = await fetch(`/api/kategori/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      setFormData(data);
    };
    fetchKategori();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/kategori/${id}`, {
        method: "PUT",
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
          <Typography variant="h6" color="white">Edit Kategori</Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            <Input label="Nama Kategori" name="nama_kategori" value={formData.nama_kategori || ''} onChange={handleChange} required />
            <Input label="Kode Kategori" name="kode_kategori" value={formData.kode_kategori || ''} onChange={handleChange} required />
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate("/admin/data-kategori")}>Batal</Button>
            <Button variant="gradient" type="submit">Simpan Perubahan</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default EditKategori;