import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Button, Textarea, Input, Checkbox
} from "@material-tailwind/react";
import toast from 'react-hot-toast';
import { ConfirmationProses } from "@/widgets/layout";
import { useAuth } from "@/hooks/useAuth";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

const getNextDay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export function TambahPeminjaman() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tanggal_mulai_pinjam: "",
    tanggal_rencana_kembali: "",
    keperluan: "",
    jenis: "Internal",
    surat_peminjaman: null,
  });
  const [barangTersedia, setBarangTersedia] = useState([]);
  const [selectedBarangIds, setSelectedBarangIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        jenis: user.role === 'Pengurus Barang' ? 'Eksternal' : 'Internal'
      }));
    }
  }, [user]);

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

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, surat_peminjaman: e.target.files[0] }));
  };

  const handleCheckboxChange = (barangId) => {
    setSelectedBarangIds(prev =>
      prev.includes(barangId)
        ? prev.filter(id => id !== barangId)
        : [...prev, barangId]
    );
  };

  const handleAjukanClick = (e) => {
    e.preventDefault(); 
    if (selectedBarangIds.length === 0) {
        toast.error("Harap pilih minimal satu barang untuk dipinjam.");
        return;
    }
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

    // --- PERUBAHAN UTAMA DI SINI ---
    // 1. Buat objek FormData
    const dataToSend = new FormData();
    
    // 2. Tambahkan semua data ke FormData
    // Mengubah array menjadi string JSON agar bisa dikirim
    dataToSend.append('barang_ids', JSON.stringify(selectedBarangIds)); 
    dataToSend.append('tanggal_mulai_pinjam', formData.tanggal_mulai_pinjam);
    dataToSend.append('tanggal_rencana_kembali', formData.tanggal_rencana_kembali);
    dataToSend.append('keperluan', formData.keperluan);
    dataToSend.append('jenis', formData.jenis);
    
    // Tambahkan file jika ada
    if (formData.surat_peminjaman) {
      dataToSend.append('surat_peminjaman', formData.surat_peminjaman);
    }
    
    try {
      const response = await fetch('/api/peminjaman', {
        method: 'POST',
        headers: { 
            // 3. Hapus 'Content-Type'. Browser akan mengaturnya secara otomatis
            // 'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        // 4. Kirim FormData sebagai body
        body: dataToSend,
      });
      // --- AKHIR PERUBAHAN ---

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success("Permintaan peminjaman berhasil diajukan!", { id: toastId });
      
      const navigateTo = user?.role === 'Pengurus Barang' ? '/pengurus-barang/data-peminjaman' : '/ppk/peminjaman-saya';
      setTimeout(() => navigate(navigateTo), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };
  
  const filteredBarang = barangTersedia.filter(item =>
    item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="mt-12 mb-8 flex justify-center">
        <Card className="w-full max-w-6xl">
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
            <Typography variant="h6" color="white">Formulir Peminjaman Barang</Typography>
          </CardHeader>
          <form>
            <CardBody className="flex flex-col gap-6 p-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    Jenis Peminjaman: {formData.jenis}
                  </Typography>
                  <Typography variant="small" className="text-xs">
                    {formData.jenis === 'Internal' 
                      ? 'Anda mengajukan peminjaman sebagai PPK.'
                      : 'Anda mengajukan peminjaman eksternal sebagai Pengurus Barang.'
                    }
                  </Typography>
                </div>

                {/* Input file akan tetap sama */}
                {user?.role === 'Pengurus Barang' && (
                  <Input 
                    type="file" 
                    label="Upload Surat Peminjaman (Wajib untuk Eksternal)" 
                    name="surat_peminjaman" 
                    onChange={handleFileChange}
                    required 
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="date" label="Tanggal Mulai Pinjam*" name="tanggal_mulai_pinjam" min={today} value={formData.tanggal_mulai_pinjam} onChange={handleChange} required disabled={loading} />
                  <Input type="date" label="Tanggal Rencana Kembali*" name="tanggal_rencana_kembali" min={getNextDay(formData.tanggal_mulai_pinjam)} value={formData.tanggal_rencana_kembali} onChange={handleChange} required disabled={loading || !formData.tanggal_mulai_pinjam} />
                </div>
                <Textarea label="Keperluan*" name="keperluan" onChange={handleChange} required disabled={loading} />
                
                <div className="mt-4">
                    <Typography variant="h6" color="blue-gray" className="mb-2">Pilih Barang yang Akan Dipinjam</Typography>
                    <div className="mb-4 w-full md:w-72">
                         <Input
                            label="Cari Barang Tersedia..."
                            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Card className="h-96 w-full overflow-auto border">
                         <table className="w-full min-w-max table-auto text-left">
                            <thead>
                                <tr>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-12"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Pilih</Typography></th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Nama Barang</Typography></th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Merk</Typography></th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Kode Barang</Typography></th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Kategori</Typography></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBarang.map((barang) => (
                                    <tr key={barang.id} className="even:bg-blue-gray-50/50">
                                        <td className="p-4"><Checkbox onChange={() => handleCheckboxChange(barang.id)} checked={selectedBarangIds.includes(barang.id)} /></td>
                                        <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{barang.nama_barang}</Typography></td>
                                        <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{barang.merk || '-'}</Typography></td>
                                        <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{barang.kode_barang}</Typography></td>
                                        <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{barang.nama_kategori || '-'}</Typography></td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </Card>
                </div>

            </CardBody>
            <CardFooter className="pt-0 p-6 flex justify-end gap-2">
              <Button variant="text" color="blue-gray" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
              <Button variant="gradient" type="button" onClick={handleAjukanClick} disabled={loading || selectedBarangIds.length === 0}>
                {loading ? "Mengajukan..." : `Ajukan Peminjaman (${selectedBarangIds.length} Barang)`}
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
        message={`Anda akan meminjam ${selectedBarangIds.length} barang. Apakah Anda yakin data sudah benar?`}
        actionText="Ya, Ajukan"
        actionColor="green"
      />
    </>
  );
}

export default TambahPeminjaman;