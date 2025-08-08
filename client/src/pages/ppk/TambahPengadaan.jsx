import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Textarea
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";

export function TambahPengadaan() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    program: "",
    kegiatan: "",
    output: "",
  });
  const [details, setDetails] = useState([
    { nama_barang_usulan: "", jumlah: 1, satuan: "", harga_satuan: 0, spesifikasi_usulan: "" },
  ]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, e) => {
    const { name, value } = e.target;
    const newDetails = [...details];
    newDetails[index][name] = value;
    setDetails(newDetails);
  };

  const addDetailRow = () => {
    setDetails([...details, { nama_barang_usulan: "", jumlah: 1, satuan: "", harga_satuan: 0, spesifikasi_usulan: "" }]);
  };

  const removeDetailRow = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const payload = { ...formData, details };

    try {
      const response = await fetch('/api/pengadaan', {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal membuat usulan");
      setSuccess("Usulan pengadaan berhasil dibuat!");
      // Arahkan ke halaman daftar pengadaan sesuai peran, misalnya admin
      setTimeout(() => navigate("/admin/data-pengadaan"), 2000); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-6xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">Formulir Rencana Pengadaan Barang</Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="p-6">
            {error && <Typography color="red" className="mb-4 text-center">{error}</Typography>}
            {success && <Typography color="green" className="mb-4 text-center">{success}</Typography>}

            <Typography variant="h6" color="blue-gray" className="mb-4">Informasi Usulan</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Input label="Program*" name="program" onChange={handleHeaderChange} required />
              <Input label="Kegiatan*" name="kegiatan" onChange={handleHeaderChange} required />
              <Input label="Output*" name="output" onChange={handleHeaderChange} required />
            </div>

            <Typography variant="h6" color="blue-gray" className="mb-4">Detail Barang Usulan</Typography>
            <div className="flex flex-col gap-4">
              {details.map((item, index) => (
                <div key={index} className="flex flex-wrap items-start gap-4 p-4 border rounded-lg">
                  <Input containerProps={{className: "min-w-[200px] flex-1"}} label="Nama Barang" name="nama_barang_usulan" value={item.nama_barang_usulan} onChange={(e) => handleDetailChange(index, e)} />
                  <Input containerProps={{className: "w-20"}} type="number" label="Jumlah" name="jumlah" value={item.jumlah} onChange={(e) => handleDetailChange(index, e)} />
                  <Input containerProps={{className: "w-24"}} label="Satuan" name="satuan" value={item.satuan} onChange={(e) => handleDetailChange(index, e)} />
                  <Input containerProps={{className: "min-w-[150px] flex-1"}} type="number" label="Harga Satuan (Rp)" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleDetailChange(index, e)} />
                  <Textarea containerProps={{className: "min-w-[200px] flex-1"}} label="Spesifikasi" name="spesifikasi_usulan" value={item.spesifikasi_usulan} onChange={(e) => handleDetailChange(index, e)} />
                  {details.length > 1 && (
                    <Button color="red" className="p-2" onClick={() => removeDetailRow(index)}>
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button color="blue" variant="text" className="mt-4 flex items-center gap-2" onClick={addDetailRow}>
              <PlusIcon className="h-5 w-5" /> Tambah Barang
            </Button>
          </CardBody>
          <CardFooter className="pt-4 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate(-1)}>Batal</Button>
            <Button variant="gradient" type="submit">Kirim Usulan</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahPengadaan;