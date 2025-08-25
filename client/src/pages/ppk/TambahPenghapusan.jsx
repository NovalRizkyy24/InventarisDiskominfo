import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Button, Select, Option, Textarea
} from "@material-tailwind/react";
import toast from 'react-hot-toast';
import { ConfirmationProses } from "@/widgets/layout";

// Komponen baru untuk menampilkan detail dengan lebih jelas
const DetailItem = ({ label, value }) => (
  <div>
    <Typography variant="small" color="blue-gray" className="font-semibold">
      {label}
    </Typography>
    <Typography variant="paragraph" color="blue-gray" className="mt-1 font-normal p-2 bg-gray-100 rounded-md">
      {value || '-'}
    </Typography>
  </div>
);


export function TambahPenghapusan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    barang_id: "", 
    alasan_penghapusan: "" 
  });
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [daftarBarang, setDaftarBarang] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchBarang = async () => {
      try {
        const response = await fetch('/api/barang', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal memuat data barang.");
        const data = await response.json();
        setDaftarBarang(data.filter(b => b.status !== 'Dipinjam' && b.status !== 'Menunggu Validasi'));
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchBarang();
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleSelectChange = (value) => {
    const barangTerpilih = daftarBarang.find(b => String(b.id) === value);
    setSelectedBarang(barangTerpilih);
    setFormData(prev => ({ ...prev, barang_id: value }));
  };

  const handleAjukanClick = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    const toastId = toast.loading("Mengajukan usulan...");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch('/api/penghapusan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success("Usulan penghapusan berhasil diajukan!", { id: toastId });
      setTimeout(() => navigate('/admin/data-penghapusan'), 1500);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-12 mb-8 flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
            <Typography variant="h6" color="white">Formulir Usulan Penghapusan Barang</Typography>
          </CardHeader>
          <form>
            <CardBody className="flex flex-col gap-6 p-6">
              {error && <Typography color="red" className="text-center">{error}</Typography>}
              
              <Select label="Pilih Barang yang Akan Dihapus*" onChange={handleSelectChange} required disabled={loading}>
                {daftarBarang.map(b => (
                  <Option key={b.id} value={String(b.id)}>
                    {b.nama_barang} ({b.kode_barang})
                  </Option>
                ))}
              </Select>

              {selectedBarang && (
                <div className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-gray-50/50">
                  <Typography variant="h6" color="blue-gray" className="md:col-span-2 -mb-2">
                    Detail Barang Terpilih
                  </Typography>
                  <DetailItem 
                    label="Kategori Barang" 
                    value={selectedBarang?.nama_kategori} 
                  />
                  <DetailItem 
                    label="Merk / Tipe" 
                    value={selectedBarang ? `${selectedBarang.merk || '-'} / ${selectedBarang.tipe || '-'}` : '-'} 
                  />
                  <DetailItem 
                    label="Status Saat Ini" 
                    value={selectedBarang?.status}
                  />
                  <DetailItem 
                    label="Lokasi" 
                    value={selectedBarang?.nama_lokasi || 'Belum diatur'}
                  />
                </div>
              )}

              <Textarea 
                label="Alasan Penghapusan*" 
                name="alasan_penghapusan" 
                onChange={handleChange} 
                required 
                disabled={loading}
              />
            </CardBody>
            <CardFooter className="pt-0 p-6 flex justify-end gap-2">
              <Button variant="text" color="blue-gray" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
              <Button variant="gradient" type="button" onClick={handleAjukanClick} disabled={loading || !selectedBarang}>
                {loading ? "Mengajukan..." : "Ajukan Penghapusan"}
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
        message="Apakah Anda yakin data usulan penghapusan ini sudah benar?"
        actionText="Ya, Ajukan"
        actionColor="green"
      />
    </>
  );
}

export default TambahPenghapusan;