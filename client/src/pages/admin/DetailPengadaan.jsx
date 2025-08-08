import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, Typography, Button, Chip, Textarea,
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";

// Fungsi helper dari file sebelumnya
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'teal', 'Selesai': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPengadaan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Dapatkan info user yang login

  const [usulan, setUsulan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    const token = localStorage.getItem("authToken");
    try {
      setLoading(true);
      const response = await fetch(`/api/pengadaan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal mengambil detail usulan");
      const data = await response.json();
      setUsulan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (status_baru, catatan = "") => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/pengadaan/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_baru, catatan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal update status');
      
      // Refresh data untuk menampilkan status terbaru
      fetchDetail(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // Komponen untuk menampilkan tombol aksi berdasarkan peran dan status usulan
  const ActionButtons = () => {
    if (!usulan || !user) return null;

    const { status } = usulan;
    const { role } = user;

    if (status === 'Diajukan' && role === 'Pengurus Barang') {
      return (
        <div className="flex gap-2">
          <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Pengurus Barang')}>Validasi</Button>
          <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button>
        </div>
      );
    }
    if (status === 'Divalidasi Pengurus Barang' && role === 'Penata Usaha Barang') {
      return (
        <div className="flex gap-2">
          <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Penatausahaan')}>Validasi</Button>
          <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button>
        </div>
      );
    }
    if (status === 'Divalidasi Penatausahaan' && role === 'Kepala Dinas') {
      return (
        <div className="flex gap-2">
          <Button color="green" onClick={() => handleUpdateStatus('Disetujui Kepala Dinas')}>Setujui</Button>
          <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button>
        </div>
      );
    }
    if (status === 'Disetujui Kepala Dinas' && role === 'Admin') {
         return <Button color="green" onClick={() => handleUpdateStatus('Selesai')}>Tandai Selesai</Button>;
    }

    return null; // Tidak ada aksi untuk peran lain atau status ini
  };
  
  if (loading) return <Typography>Memuat data...</Typography>;
  if (error) return <Typography color="red">Error: {error}</Typography>;
  if (!usulan) return <Typography>Data usulan tidak ditemukan.</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      {/* Kartu Informasi Usulan */}
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Usulan: {usulan.nomor_usulan}</Typography>
          <Chip variant="ghost" color={getStatusColor(usulan.status)} value={usulan.status} />
        </CardHeader>
        <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><Typography variant="small" className="font-bold">Program:</Typography><Typography>{usulan.program}</Typography></div>
                <div><Typography variant="small" className="font-bold">Kegiatan:</Typography><Typography>{usulan.kegiatan}</Typography></div>
                <div><Typography variant="small" className="font-bold">Output:</Typography><Typography>{usulan.output}</Typography></div>
                <div><Typography variant="small" className="font-bold">Tanggal Usulan:</Typography><Typography>{formatDate(usulan.tanggal_usulan)}</Typography></div>
            </div>
            {usulan.catatan_penolakan && (
                <div className="mt-4"><Typography variant="small" className="font-bold text-red-500">Catatan Penolakan:</Typography><Typography className="text-red-500">{usulan.catatan_penolakan}</Typography></div>
            )}
        </CardBody>
      </Card>

      {/* Kartu Detail Barang */}
      <Card>
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6"><Typography variant="h6" color="white">Rincian Barang Usulan</Typography></CardHeader>
          <CardBody className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] table-auto">
                  <thead>
                      <tr>
                          {["Nama Barang", "Jumlah", "Satuan", "Harga Satuan", "Total", "Spesifikasi"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}
                      </tr>
                  </thead>
                  <tbody>
                      {usulan.details.map((item, key) => (
                          <tr key={key}>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang_usulan}</Typography></td>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.jumlah}</Typography></td>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.satuan}</Typography></td>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</Typography></td>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</Typography></td>
                              <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.spesifikasi_usulan}</Typography></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </CardBody>
      </Card>
      
      {/* Kartu Aksi */}
      <Card>
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6"><Typography variant="h6" color="white">Aksi Persetujuan</Typography></CardHeader>
          <CardBody>
              <ActionButtons />
          </CardBody>
      </Card>
    </div>
  );
}

export default DetailPengadaan;