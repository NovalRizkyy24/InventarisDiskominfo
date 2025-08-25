import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Button, Select, Option, Textarea, Input, Radio
} from "@material-tailwind/react";
import toast from 'react-hot-toast';
import { ConfirmationProses } from "@/widgets/layout";

// --- FUNGSI HELPER BARU UNTUK MENDAPATKAN HARI BERIKUTNYA ---
const getNextDay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1); // Tambah satu hari
  return date.toISOString().split('T')[0];
};

// --- KOMPONEN BARU UNTUK MENAMPILKAN DETAIL BARANG ---
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

export function TambahPeminjaman() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    barang_id: "",
    tanggal_mulai_pinjam: "",
    tanggal_rencana_kembali: "",
    keperluan: "",
    jenis: "Internal",
  });
  const [barangTersedia, setBarangTersedia] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchBarang = async () => {
      try {
        const response = await fetch('/api/barang', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal memuat daftar barang.");
        const data = await response.json();
        setBarangTersedia(data.filter(b => b.status === 'Tersedia'));
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchBarang();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'tanggal_mulai_pinjam') {
        const minReturnDate = getNextDay(value);
        if (newFormData.tanggal_rencana_kembali && newFormData.tanggal_rencana_kembali < minReturnDate) {
            newFormData.tanggal_rencana_kembali = minReturnDate;
        }
    }

    setFormData(newFormData);
  };

  const handleSelectChange = (value) => {
    const barangTerpilih = barangTersedia.find(b => String(b.id) === value);
    setSelectedBarang(barangTerpilih); 
    setFormData(prev => ({ ...prev, barang_id: value }));
  };

  const handleAjukanClick = (e) => {
    e.preventDefault(); 
    
    if (new Date(formData.tanggal_rencana_kembali) <= new Date(formData.tanggal_mulai_pinjam)) {
        toast.error("Tanggal kembali harus setidaknya satu hari setelah tanggal pinjam.");
        return;
    }
    setIsConfirmOpen(true); 
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading('Mengajukan peminjaman...');

    try {
      const response = await fetch('/api/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success("Permintaan peminjaman berhasil diajukan!", { id: toastId });
      setTimeout(() => navigate('/ppk/peminjaman-saya'), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-12 mb-8 flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
            <Typography variant="h6" color="white">Formulir Peminjaman Barang</Typography>
          </CardHeader>
          <form>
            <CardBody className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-2">
                  <Typography variant="small" color="blue-gray" className="font-semibold">Jenis Peminjaman</Typography>
                  <div className="flex gap-10">
                      <Radio name="jenis" label="Internal (Untuk Diri Sendiri)" value="Internal" checked={formData.jenis === 'Internal'} onChange={handleChange} />
                      <Radio name="jenis" label="Eksternal (Untuk Pihak Lain)" value="Eksternal" checked={formData.jenis === 'Eksternal'} onChange={handleChange} />
                  </div>
              </div>

              <Select label="Pilih Barang*" onChange={handleSelectChange} required disabled={loading}>
                {barangTersedia.map(b => {
                  const detailText = [b.merk, b.tipe].filter(Boolean).join(' / ');
                  return (
                    <Option key={b.id} value={String(b.id)}>
                      {`${b.nama_barang} (${b.kode_barang}) ${detailText ? `- ${detailText}` : ''}`}
                    </Option>
                  );
                })}
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
                    value={`${selectedBarang.merk || '-'} / ${selectedBarang.tipe || '-'}`} 
                  />
                  <DetailItem 
                    label="Lokasi" 
                    value={selectedBarang?.nama_lokasi || 'Belum diatur'}
                  />
                  <DetailItem 
                    label="Status Saat Ini" 
                    value={selectedBarang?.status}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="date" label="Tanggal Mulai Pinjam*" name="tanggal_mulai_pinjam" min={today} value={formData.tanggal_mulai_pinjam} onChange={handleChange} required disabled={loading} />
                  <Input type="date" label="Tanggal Rencana Kembali*" name="tanggal_rencana_kembali" min={getNextDay(formData.tanggal_mulai_pinjam)} value={formData.tanggal_rencana_kembali} onChange={handleChange} required disabled={loading || !formData.tanggal_mulai_pinjam} />
              </div>
              <Textarea label="Keperluan*" name="keperluan" onChange={handleChange} required disabled={loading} />
            </CardBody>
            <CardFooter className="pt-0 p-6 flex justify-end gap-2">
              <Button variant="text" color="blue-gray" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
              <Button variant="gradient" type="button" onClick={handleAjukanClick} disabled={loading || !selectedBarang}>
                {loading ? "Mengajukan..." : "Ajukan Peminjaman"}
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
        message="Apakah Anda yakin data peminjaman yang dimasukkan sudah benar?"
        actionText="Ya, Ajukan"
        actionColor="green"
      />
    </>
  );
}

export default TambahPeminjaman;