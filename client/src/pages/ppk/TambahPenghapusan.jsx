import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Button, Select, Option, Textarea,
} from "@material-tailwind/react";

export function TambahPenghapusan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ barang_id: "", alasan_penghapusan: "" });
  const [daftarBarang, setDaftarBarang] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchBarang = async () => {
      const response = await fetch('/api/barang', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      // Hanya tampilkan barang yang bisa dihapus (misal: bukan yang sedang dipinjam)
      setDaftarBarang(data.filter(b => b.status !== 'Dipinjam'));
    };
    fetchBarang();
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectChange = (value) => setFormData(prev => ({ ...prev, barang_id: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch('/api/penghapusan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSuccess("Usulan penghapusan berhasil diajukan!");
      setTimeout(() => navigate('/admin/data-penghapusan'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">Formulir Usulan Penghapusan Barang</Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            {success && <Typography color="green" className="text-center">{success}</Typography>}
            
            <Select label="Pilih Barang yang Akan Dihapus*" onChange={handleSelectChange} required>
              {daftarBarang.map(b => (
                <Option key={b.id} value={String(b.id)}>{b.nama_barang} ({b.kode_barang})</Option>
              ))}
            </Select>
            <Textarea label="Alasan Penghapusan*" name="alasan_penghapusan" onChange={handleChange} required />
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate(-1)}>Batal</Button>
            <Button variant="gradient" type="submit">Ajukan Usulan</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahPenghapusan;