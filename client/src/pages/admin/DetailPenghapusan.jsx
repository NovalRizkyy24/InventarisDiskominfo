import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Chip } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPenghapusan() {
  const { id } = useParams();
  const { user } = useAuth();
  const [usulan, setUsulan] = useState(null);
  const [error, setError] = useState("");

  const fetchDetail = async () => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`/api/penghapusan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return setError("Gagal memuat detail.");
    setUsulan(await response.json());
  };

  useEffect(() => { fetchDetail(); }, [id]);
  
  const handleUpdateStatus = async (status_baru) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/penghapusan/${id}/status`, {
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
    if (!usulan || !user) return null;
    const { status } = usulan;
    const { role } = user;

    const actions = {
        'Diajukan': { role: 'Pengurus Barang', nextStatus: 'Divalidasi Pengurus Barang' },
        'Divalidasi Pengurus Barang': { role: 'Penata Usaha Barang', nextStatus: 'Divalidasi Penatausahaan' },
        'Divalidasi Penatausahaan': { role: 'Kepala Dinas', nextStatus: 'Disetujui Kepala Dinas' },
    };

    if (actions[status] && role === actions[status].role) {
      return (
        <div className="flex gap-2">
          <Button color="green" onClick={() => handleUpdateStatus(actions[status].nextStatus)}>
            {status === 'Divalidasi Penatausahaan' ? 'Setujui' : 'Validasi'}
          </Button>
          <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button>
        </div>
      );
    }
    return null;
  };

  if (!usulan) return <Typography>Memuat...</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Usulan Penghapusan: {usulan.nama_barang}</Typography>
          <Chip variant="ghost" color={getStatusColor(usulan.status)} value={usulan.status} />
        </CardHeader>
        <CardBody>
          {error && <Typography color="red" className="mb-4 text-center">{error}</Typography>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Typography variant="small" className="font-bold">Nama Pengusul:</Typography><Typography>{usulan.nama_pengusul}</Typography></div>
            <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{usulan.kode_barang}</Typography></div>
            <div><Typography variant="small" className="font-bold">Tanggal Usulan:</Typography><Typography>{formatDate(usulan.tanggal_pengajuan)}</Typography></div>
            <div className="md:col-span-2"><Typography variant="small" className="font-bold">Alasan Penghapusan:</Typography><Typography>{usulan.alasan_penghapusan}</Typography></div>
          </div>
        </CardBody>
      </Card>
      <Card>
          <CardHeader variant="gradient" color="gray" className="p-6"><Typography variant="h6" color="white">Aksi</Typography></CardHeader>
          <CardBody><ActionButtons /></CardBody>
      </Card>
    </div>
  );
}

export default DetailPenghapusan;