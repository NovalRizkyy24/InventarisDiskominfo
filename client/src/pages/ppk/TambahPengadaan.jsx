import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Textarea, Select, Option
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import toast from 'react-hot-toast';
import { ConfirmationProses } from "@/widgets/layout"; // Impor komponen popup

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

const unformatRupiah = (rupiah) => {
    return rupiah ? parseInt(rupiah.replace(/\./g, ''), 10) : 0;
};

export function TambahPengadaan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    program: "",
    kegiatan: "",
    output: "",
    rekening_belanja: "", 
  });
  const [details, setDetails] = useState([
    { nama_barang_usulan: "", jumlah: 1, satuan: "", harga_satuan: 0, spesifikasi_usulan: "", jenis_belanja: "Belanja Modal" },
  ]);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // State baru untuk popup

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, e) => {
    const { name, value } = e.target;
    const newDetails = [...details];

    if (name === 'harga_satuan') {
        const numericValue = value.replace(/[^0-9]/g, '');
        newDetails[index][name] = numericValue;
    } else {
        newDetails[index][name] = value;
    }

    setDetails(newDetails);
  };

  const addDetailRow = () => {
    setDetails([...details, { nama_barang_usulan: "", jumlah: 1, satuan: "", harga_satuan: 0, spesifikasi_usulan: "", jenis_belanja: "Belanja Modal" }]);
  };

  const removeDetailRow = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  const handleAjukanClick = (e) => {
    e.preventDefault(); // Mencegah submit form langsung
    
    // Validasi sederhana sebelum membuka popup
    if (!formData.program || !formData.kegiatan || !formData.output || details.some(d => !d.nama_barang_usulan)) {
        toast.error("Harap isi semua field yang wajib diisi (*).");
        return;
    }
    setIsConfirmOpen(true); // Buka popup jika validasi lolos
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false); // Tutup popup
    setLoading(true);
    const token = localStorage.getItem("authToken");
    
    const payload = {
        ...formData,
        details: details.map(d => ({
            ...d,
            harga_satuan: unformatRupiah(d.harga_satuan)
        }))
    };

    const toastId = toast.loading('Mengirim usulan...');

    try {
      const response = await fetch('/api/pengadaan', {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal membuat usulan");
      
      toast.success("Usulan pengadaan berhasil dibuat!", { id: toastId });
      
      setTimeout(() => navigate("/ppk/usulan-saya"), 1500); 

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-12 mb-8 flex justify-center">
        <Card className="w-full max-w-6xl">
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
            <Typography variant="h6" color="white">Formulir Rencana Pengadaan Barang</Typography>
          </CardHeader>
          <form>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">Informasi Usulan</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Input label="Program*" name="program" onChange={handleHeaderChange} required disabled={loading} />
                <Input label="Kegiatan*" name="kegiatan" onChange={handleHeaderChange} required disabled={loading} />
                <Input label="Output*" name="output" onChange={handleHeaderChange} required disabled={loading} />
                <Input label="Rekening Belanja" name="rekening_belanja" onChange={handleHeaderChange} disabled={loading} />
              </div>

              <Typography variant="h6" color="blue-gray" className="mb-4">Detail Barang Usulan</Typography>
              <div className="flex flex-col gap-4">
                {details.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-start gap-4 p-4 border rounded-lg">
                    <Input containerProps={{className: "min-w-[200px] flex-1"}} label="Nama Barang*" name="nama_barang_usulan" value={item.nama_barang_usulan} onChange={(e) => handleDetailChange(index, e)} required disabled={loading} />
                    <Input containerProps={{className: "w-20"}} type="number" label="Jumlah*" name="jumlah" value={item.jumlah} onChange={(e) => handleDetailChange(index, e)} required disabled={loading} />
                    <Input containerProps={{className: "w-24"}} label="Satuan*" name="satuan" value={item.satuan} onChange={(e) => handleDetailChange(index, e)} required disabled={loading} />
                    <Input containerProps={{className: "min-w-[150px] flex-1"}} type="text" label="Harga Satuan (Rp)*" name="harga_satuan" value={formatRupiah(item.harga_satuan)} onChange={(e) => handleDetailChange(index, e)} required disabled={loading} />
                    <Input containerProps={{className: "min-w-[150px] flex-1"}} label="Jenis Belanja" name="jenis_belanja" value={item.jenis_belanja} onChange={(e) => handleDetailChange(index, e)} disabled={loading} />
                    <Textarea containerProps={{className: "min-w-[200px] flex-1"}} label="Spesifikasi" name="spesifikasi_usulan" value={item.spesifikasi_usulan} onChange={(e) => handleDetailChange(index, e)} disabled={loading} />
                    {details.length > 1 && (
                      <Button color="red" className="p-2" onClick={() => removeDetailRow(index)} disabled={loading}>
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button color="blue" variant="text" className="mt-4 flex items-center gap-2" onClick={addDetailRow} disabled={loading}>
                <PlusIcon className="h-5 w-5" /> Tambah Barang
              </Button>
            </CardBody>
            <CardFooter className="pt-4 p-6 flex justify-end gap-2">
              <Button variant="text" color="blue-gray" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
              <Button variant="gradient" type="button" onClick={handleAjukanClick} disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Usulan'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <ConfirmationProses
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Konfirmasi Pengajuan"
        message="Apakah Anda yakin data pengadaan yang dimasukkan sudah benar?"
        actionText="Ya, Kirim Usulan"
        actionColor="green"
      />
    </>
  );
}

export default TambahPengadaan;