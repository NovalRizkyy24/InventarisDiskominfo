import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
    Chip,
    Textarea,
    Input,
    IconButton,
    Tooltip
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmationProses, ConfirmationModal } from "@/widgets/layout";
import toast from "react-hot-toast";
import { TrashIcon } from "@heroicons/react/24/solid";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString("id-ID", options).replace(/\./g, ':').replace('pukul', 'Pukul');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Diajukan': return 'blue';
    case 'Divalidasi Pengurus Barang': return 'light-blue';
    case 'Selesai': return 'green';
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

const UploadBA = ({ usulanId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Pilih file Berita Acara terlebih dahulu.");
            return;
        }
        setLoading(true);
        const toastId = toast.loading("Mengunggah Berita Acara...");
        const token = localStorage.getItem("authToken");
        
        const formData = new FormData();
        formData.append('berita_acara', file);

        try {
            const response = await fetch(`/api/penghapusan/${usulanId}/upload-ba`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success("Berita Acara berhasil diunggah.", { id: toastId });
            onUploadSuccess(); 
        } catch (err) {
            toast.error(err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader variant="gradient" color="blue-gray" className="p-6">
                <Typography variant="h6" color="white">
                    Unggah Berita Acara & Selesaikan Proses
                </Typography>
            </CardHeader>
            <CardBody>
                <Typography variant="small" className="mb-4">
                    Silakan unduh Berita Acara, tandatangani, lalu unggah kembali untuk menyelesaikan proses penghapusan.
                </Typography>
                <Input
                    type="file"
                    label="Pilih Berita Acara (PDF/JPG/PNG)"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                />
            </CardBody>
            <CardFooter className="flex justify-end">
                <Button onClick={handleUpload} disabled={loading || !file}>
                    {loading ? "Mengunggah..." : "Unggah & Selesaikan"}
                </Button>
            </CardFooter>
        </Card>
    );
};


const ActionButtons = ({ usulan, user, openConfirmModal, handleUpdateStatus, catatan, setCatatan }) => {
  if (!usulan || !user) return null;
  const { status } = usulan;
  const { role } = user;

  if (role === 'Pengurus Barang' && status === 'Diajukan') {
    return (
      <div className="flex flex-col gap-4">
        <Textarea 
            label="Catatan (Wajib diisi jika menolak)" 
            value={catatan} 
            onChange={(e) => setCatatan(e.target.value)} 
        />
        <div className="flex gap-2">
            <Button 
                color="green" 
                onClick={() => openConfirmModal(() => handleUpdateStatus('Divalidasi Pengurus Barang'), `Konfirmasi Validasi`, `Anda yakin ingin memvalidasi usulan penghapusan ini?`, `Ya, Validasi`, 'green')}
                disabled={!!catatan}
            >
                Validasi
            </Button>
            <Button 
                color="red" 
                onClick={() => openConfirmModal(() => handleUpdateStatus('Ditolak', catatan), 'Konfirmasi Penolakan', 'Anda yakin ingin menolak usulan penghapusan ini?', 'Ya, Tolak', 'red')}
                disabled={!catatan}
            >
                Tolak
            </Button>
        </div>
      </div>
    );
  }
  return <Typography variant="small">Tidak ada aksi yang tersedia untuk Anda pada tahap ini.</Typography>;
};

export function DetailPenghapusan() {
  const { id } = useParams();
  const { user } = useAuth();
  const [usulan, setUsulan] = useState(null);
  const [logData, setLogData] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
    actionText: "Ya, Lanjutkan",
    actionColor: "green",
  });
  const [isBaDeleteModalOpen, setIsBaDeleteModalOpen] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchDetailAndLogs = async () => {
    const token = localStorage.getItem("authToken");
    try {
        const usulanResponse = await fetch(`/api/penghapusan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!usulanResponse.ok) throw new Error("Gagal memuat detail usulan.");
        setUsulan(await usulanResponse.json());
        
        const logResponse = await fetch(`/api/penghapusan/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
        if(logResponse.ok) {
            setLogData(await logResponse.json());
        }
    } catch (err) {
        setError(err.message);
        toast.error(err.message);
    }
  };

  useEffect(() => { fetchDetailAndLogs(); }, [id]);

  const handleUpdateStatus = async (status_baru, catatanPenolakan = null) => {
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading('Memperbarui status...');
    try {
      const response = await fetch(`/api/penghapusan/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_baru, catatan: catatanPenolakan }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Status berhasil diperbarui.", { id: toastId });
      fetchDetailAndLogs();
    } catch(err) {
      toast.error(err.message, { id: toastId });
      setError(err.message);
    }
  };
  
  const handleDownload = async () => {
    const toastId = toast.loading("Mempersiapkan Berita Acara...");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/api/penghapusan/${id}/download-berita-acara`, {
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
      link.setAttribute('download', `berita-acara-penghapusan-${usulan.nomor_usulan}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Unduhan dimulai!", { id: toastId });

    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const openConfirmModal = (action, title, message, actionText, actionColor) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      action,
      actionText,
      actionColor,
    });
  };

  const handleConfirmAction = () => {
    if (confirmState.action) {
      confirmState.action();
    }
    setConfirmState({ isOpen: false, action: null });
  };

  const handleDeleteBeritaAcara = async () => {
    setIsBaDeleteModalOpen(false);
    const toastId = toast.loading("Menghapus Berita Acara...");
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`/api/penghapusan/${id}/delete-ba`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        toast.success(data.message, { id: toastId });
        fetchDetailAndLogs(); 
    } catch (err) {
        toast.error(err.message, { id: toastId });
    }
  };

  if (!usulan) return <Typography>Memuat...</Typography>;

  const canDownload = (usulan.status === 'Divalidasi Pengurus Barang' || usulan.status === 'Selesai') && user?.role !== 'Kepala Dinas';
  const isImage = usulan.berita_acara_url && /\.(jpg|jpeg|png)$/i.test(usulan.berita_acara_url);

    return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Usulan Penghapusan: {usulan.nomor_usulan}</Typography>
          <Chip variant="gradient" color={getStatusColor(usulan.status)} value={usulan.status} />
        </CardHeader>
        <CardBody>
          {error && <Typography color="red" className="mb-4 text-center">{error}</Typography>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Typography variant="small" className="font-bold">Nama Barang:</Typography><Typography>{usulan.nama_barang}</Typography></div>
            <div><Typography variant="small" className="font-bold">Nama Pengusul:</Typography><Typography>{usulan.nama_pengusul}</Typography></div>
            <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{usulan.kode_barang}</Typography></div>
            <div><Typography variant="small" className="font-bold">Tanggal Usulan:</Typography><Typography>{formatDate(usulan.tanggal_pengajuan)}</Typography></div>
            <div className="md:col-span-2"><Typography variant="small" className="font-bold">Alasan Penghapusan:</Typography><Typography>{usulan.alasan_penghapusan}</Typography></div>
            
            <div className="md:col-span-2">
                <Typography variant="small" className="font-bold">Bukti Kerusakan:</Typography>
                {usulan.foto_kerusakan_url ? (
                    <a href={`${API_URL}/${usulan.foto_kerusakan_url}`} target="_blank" rel="noopener noreferrer">
                        <Button color="blue" size="sm" className="mt-1">
                            Lihat Bukti Kerusakan
                        </Button>
                    </a>
                ) : (
                    <Typography className="text-sm text-blue-gray-500 mt-1">Tidak ada bukti yang diunggah.</Typography>
                )}
            </div>
            
            {usulan.berita_acara_url && (
              <div className="md:col-span-2">
                <Typography variant="small" className="font-bold mb-2">Dokumen Berita Acara:</Typography>
                {isImage && (
                    <img src={`${API_URL}/${usulan.berita_acara_url}`} alt="Preview Berita Acara" className="w-full max-w-lg h-auto rounded-lg border shadow-md mb-2" />
                )}
                <div className="flex items-center gap-2">
                    <a href={`${API_URL}/${usulan.berita_acara_url}`} target="_blank" rel="noopener noreferrer">
                        <Button color="blue" size="sm">
                            Lihat Dokumen
                        </Button>
                    </a>
                    {user?.role === 'Pengurus Barang' && (
                        <Tooltip content="Hapus Berita Acara">
                            <IconButton color="red" size="sm" onClick={() => setIsBaDeleteModalOpen(true)}>
                                <TrashIcon className="h-4 w-4" />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
              </div>
            )}
          </div>
           <div className="mt-6 flex justify-end">
            {canDownload && (
              <Button color="green" onClick={handleDownload}>
                Download Berita Acara
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {usulan.status === 'Diajukan' && user?.role === 'Pengurus Barang' && (
          <Card>
              <CardHeader variant="gradient" color="gray" className="p-6"><Typography variant="h6" color="white">Aksi Validasi</Typography></CardHeader>
              <CardBody>
                  <ActionButtons
                    usulan={usulan}
                    user={user}
                    openConfirmModal={openConfirmModal}
                    handleUpdateStatus={handleUpdateStatus}
                    catatan={catatan}
                    setCatatan={setCatatan}
                  />
              </CardBody>
          </Card>
      )}

      {(usulan.status === 'Divalidasi Pengurus Barang' || usulan.status === 'Selesai') && user?.role === 'Pengurus Barang' && (
          <UploadBA usulanId={id} onUploadSuccess={fetchDetailAndLogs} />
      )}

      <Card>
        <CardHeader variant="gradient" color="blue-gray" className="p-6">
          <Typography variant="h6" color="white">Riwayat Proses Validasi</Typography>
        </CardHeader>
        <CardBody className="p-0">
          {logData.length > 0 ? (
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Waktu", "Validator", "Aksi", "Catatan"].map(h => (
                    <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logData.map((log, key) => (
                  <tr key={key}>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDateTime(log.waktu_validasi)}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{log.nama_validator}</Typography></td>
                    <td className="py-3 px-5 border-b">
                      <div className="flex items-center gap-2">
                        <Chip variant="ghost" color={getStatusColor(log.status_sebelum)} value={log.status_sebelum || 'Awal'} size="sm" />
                        <span>→</span>
                        <Chip variant="ghost" color={getStatusColor(log.status_sesudah)} value={log.status_sesudah} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{log.catatan || '-'}</Typography></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Typography className="text-center p-6 text-blue-gray-500">
              Belum ada riwayat validasi untuk usulan ini.
            </Typography>
          )}
        </CardBody>
      </Card>

      <ConfirmationProses
        open={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
        actionText={confirmState.actionText}
        actionColor={confirmState.actionColor}
      />

      <ConfirmationModal
        open={isBaDeleteModalOpen}
        onClose={() => setIsBaDeleteModalOpen(false)}
        onConfirm={handleDeleteBeritaAcara}
        title="Konfirmasi Hapus"
        message="Anda yakin ingin menghapus Berita Acara ini? Anda perlu mengunggahnya kembali untuk menyelesaikan proses."
      />
    </div>
  );
}

export default DetailPenghapusan;