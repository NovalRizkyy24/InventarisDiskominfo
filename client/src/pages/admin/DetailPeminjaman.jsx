import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Chip } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/widgets/layout";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'green', 'Selesai': 'gray', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPeminjaman() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState(null);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchDetail = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/peminjaman/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil detail peminjaman");
      const data = await response.json();
      setPeminjaman(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);
  
  const handleUpdateStatus = async (status_baru) => {
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Memperbarui status...");
    try {
      const response = await fetch(`/api/peminjaman/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status_baru }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Status berhasil diperbarui.", { id: toastId });
      fetchDetail();
    } catch(err) {
        toast.error(err.message, { id: toastId });
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    const toastId = toast.loading("Menghapus pengajuan...");
    const token = localStorage.getItem("authToken");
    try {
        const response = await fetch(`/api/peminjaman/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        toast.success("Pengajuan berhasil dihapus.", { id: toastId });
        navigate(`/${user.role.toLowerCase().replace(/ /g, '-')}/peminjaman-saya`);
    } catch (err) {
        toast.error(err.message, { id: toastId });
    }
  };
  
  const ActionButtons = () => {
    if (!peminjaman || !user) return null;
    const { status, user_peminjam_id } = peminjaman;

    // Logika untuk peminjam
    if (user.id === user_peminjam_id && status === 'Diajukan') {
        return <Button color="red" onClick={() => setIsDeleteModalOpen(true)}>Hapus Pengajuan</Button>;
    }

    // Logika untuk Pengurus Barang
    if (user.role === 'Pengurus Barang') {
      if (status === 'Diajukan') {
        return <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Pengurus Barang')}>Setujui Peminjaman</Button>;
      }
      if (status === 'Divalidasi Pengurus Barang') {
        return <Button color="blue" onClick={() => handleUpdateStatus('Selesai')}>Tandai Sudah Kembali</Button>;
      }
    }
    return null;
  };

  if (!peminjaman) return <Typography className="text-center mt-12">Memuat...</Typography>;

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

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Anda yakin ingin menghapus pengajuan peminjaman ini?"
      />
    </div>
  );
}

export default DetailPeminjaman;