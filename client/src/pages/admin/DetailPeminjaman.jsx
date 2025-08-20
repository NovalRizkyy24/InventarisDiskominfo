import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Button, Chip, Input } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/widgets/layout";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'green', 'Selesai': 'gray', 'Ditolak': 'red'})[status] || 'gray';

// --- Komponen Form Berita Acara ---
const BeritaAcaraForm = ({ peminjamanId, dataPeminjaman, onSaveSuccess }) => {
  const [pihakKedua, setPihakKedua] = useState({
    nama_pihak_kedua: "",
    nip_pihak_kedua: "",
    jabatan_pihak_kedua: ""
  });
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  useEffect(() => {
    if (dataPeminjaman) {
      setPihakKedua({
        nama_pihak_kedua: dataPeminjaman.nama_pihak_kedua || "",
        nip_pihak_kedua: dataPeminjaman.nip_pihak_kedua || "",
        jabatan_pihak_kedua: dataPeminjaman.jabatan_pihak_kedua || ""
      });
    }
  }, [dataPeminjaman]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPihakKedua(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoadingSave(true);
    const toastId = toast.loading("Menyimpan data Pihak Kedua...");
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`/api/peminjaman/${peminjamanId}/pihak-kedua`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(pihakKedua),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan data.");
      
      toast.success("Data berhasil disimpan!", { id: toastId });
      onSaveSuccess(); // Memanggil fungsi untuk me-refresh data di halaman detail
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoadingSave(false);
    }
  };
  
  const handleDownload = async () => {
    setLoadingDownload(true);
    const toastId = toast.loading("Mempersiapkan PDF...");
    const token = localStorage.getItem("authToken");

    try {
      // Pastikan method tidak dispesifikasi agar menjadi GET request
      const response = await fetch(`/api/peminjaman/${peminjamanId}/download-berita-acara`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengunduh Berita Acara.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `berita-acara-peminjaman-${peminjamanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Unduhan dimulai!", { id: toastId });

    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoadingDownload(false);
    }
  };

  const isDataSaved = dataPeminjaman?.nama_pihak_kedua && dataPeminjaman?.nip_pihak_kedua && dataPeminjaman?.jabatan_pihak_kedua;

  return (
    <Card>
      <CardHeader variant="gradient" color="blue-gray" className="p-6">
        <Typography variant="h6" color="white">
          Cetak Berita Acara Pinjam Pakai
        </Typography>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Typography variant="small" color="blue-gray" className="font-semibold">
          Data Pihak Kedua (Peminjam):
        </Typography>
        <Input label="Nama Lengkap Pihak Kedua*" name="nama_pihak_kedua" value={pihakKedua.nama_pihak_kedua} onChange={handleChange} required disabled={loadingSave} />
        <Input label="NIP Pihak Kedua*" name="nip_pihak_kedua" value={pihakKedua.nip_pihak_kedua} onChange={handleChange} required disabled={loadingSave} />
        <Input label="Jabatan Pihak Kedua*" name="jabatan_pihak_kedua" value={pihakKedua.jabatan_pihak_kedua} onChange={handleChange} required disabled={loadingSave} />
      </CardBody>
      <CardFooter className="flex justify-end gap-2">
        <Button onClick={handleSave} variant="gradient" color="blue" disabled={loadingSave}>
          {loadingSave ? 'Menyimpan...' : 'Simpan Data'}
        </Button>
        <Button onClick={handleDownload} variant="gradient" color="green" disabled={!isDataSaved || loadingDownload}>
          {loadingDownload ? 'Memproses...' : 'Download PDF'}
        </Button>
      </CardFooter>
    </Card>
  );
};

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
      // Menghapus toast error agar tidak duplikat saat gagal fetch
      // toast.error(err.message); 
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);
  
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

    if (user.id === user_peminjam_id && status === 'Diajukan') {
        return <Button color="red" onClick={() => setIsDeleteModalOpen(true)}>Hapus Pengajuan</Button>;
    }

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
      
      {peminjaman.status === 'Divalidasi Pengurus Barang' && 
        <BeritaAcaraForm 
          peminjamanId={id} 
          dataPeminjaman={peminjaman} 
          onSaveSuccess={fetchDetail}
        />
      }

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