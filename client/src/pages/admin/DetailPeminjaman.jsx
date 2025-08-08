import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Chip } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'green', 'Selesai': 'gray', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPeminjaman() {
  const { id } = useParams();
  const { user } = useAuth();
  const [peminjaman, setPeminjaman] = useState(null);
  const [error, setError] = useState("");

  const fetchDetail = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/peminjaman/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil detail peminjaman");
      const data = await response.json();
      setPeminjaman(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);
  
  const handleUpdateStatus = async (status_baru) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/peminjaman/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status_baru }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      fetchDetail();
    } catch(err) {
        setError(err.message);
    }
  };
  
  const ActionButtons = () => {
    if (!peminjaman || !user) return null;
    if (user.role === 'Pengurus Barang') {
      if (peminjaman.status === 'Diajukan') {
        return <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Pengurus Barang')}>Setujui Peminjaman</Button>;
      }
      if (peminjaman.status === 'Divalidasi Pengurus Barang') {
        return <Button color="blue" onClick={() => handleUpdateStatus('Selesai')}>Tandai Sudah Kembali</Button>;
      }
    }
    return null;
  };

  if (!peminjaman) return <Typography>Memuat...</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Peminjaman: {peminjaman.nama_barang}</Typography>
          <Chip variant="ghost" color={getStatusColor(peminjaman.status)} value={peminjaman.status} />
        </CardHeader>
        <CardBody>
            {error && <Typography color="red" className="mb-4 text-center">{error}</Typography>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Typography variant="small" className="font-bold">Nama Peminjam:</Typography><Typography>{peminjaman.nama_peminjam}</Typography></div>
                <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{peminjaman.kode_barang}</Typography></div>
                <div><Typography variant="small" className="font-bold">Tanggal Pinjam:</Typography><Typography>{formatDate(peminjaman.tanggal_mulai_pinjam)}</Typography></div>
                <div><Typography variant="small" className="font-bold">Tanggal Kembali:</Typography><Typography>{formatDate(peminjaman.tanggal_rencana_kembali)}</Typography></div>
                <div className="md:col-span-2"><Typography variant="small" className="font-bold">Keperluan:</Typography><Typography>{peminjaman.keperluan}</Typography></div>
            </div>
        </CardBody>
      </Card>
      <Card>
          <CardHeader variant="gradient" color="gray" className="p-6"><Typography variant="h6" color="white">Aksi</Typography></CardHeader>
          <CardBody>
              <ActionButtons />
          </CardBody>
      </Card>
    </div>
  );
}

export default DetailPeminjaman;