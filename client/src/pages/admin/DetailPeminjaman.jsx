import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Button, Chip, Input, Textarea } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { ConfirmationModal, ConfirmationProses } from "@/widgets/layout";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString("id-ID", options).replace(/\./g, ':').replace('pukul', 'Pukul');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Diajukan': return 'blue';
    case 'Divalidasi Pengurus Barang': return 'light-blue';
    case 'Divalidasi Penatausahaan': return 'teal'; 
    case 'Menunggu Persetujuan': return 'orange';
    case 'Disetujui Kepala Dinas': return 'green';
    case 'Selesai': return 'blue-gray'; 
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

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
    
    if (name === 'nip_pihak_kedua') {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 18) {
            setPihakKedua(prev => ({ ...prev, [name]: numericValue }));
        }
    } else {
        setPihakKedua(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    // --- PERUBAHAN DI SINI: Validasi NIP ---
    if (pihakKedua.nip_pihak_kedua.length !== 18) {
        toast.error("NIP Pihak Kedua harus terdiri dari 18 angka.");
        return; // Hentikan proses jika NIP tidak valid
    }
    // --- AKHIR PERUBAHAN ---

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
      onSaveSuccess();
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
          Cetak Berita Acara (Eksternal)
        </Typography>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Typography variant="small" color="blue-gray" className="font-semibold">
          Data Pihak Kedua (Peminjam Eksternal):
        </Typography>
        <Input label="Nama Lengkap Pihak Kedua*" name="nama_pihak_kedua" value={pihakKedua.nama_pihak_kedua} onChange={handleChange} required disabled={loadingSave} />
        <Input 
            label="NIP Pihak Kedua (18 Angka)*" 
            name="nip_pihak_kedua" 
            value={pihakKedua.nip_pihak_kedua} 
            onChange={handleChange} 
            required 
            disabled={loadingSave} 
            maxLength={18}
            type="text"
        />
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

const ActionButtons = ({ peminjaman, user, openConfirmModal, handleUpdateStatus, setIsDeleteModalOpen, catatan, setCatatan }) => {
  if (!peminjaman || !user) return null;
  const { status, user_peminjam_id, jenis } = peminjaman;

  if (user.id === user_peminjam_id && status === 'Diajukan') {
      return <Button color="red" onClick={() => setIsDeleteModalOpen(true)}>Hapus Pengajuan</Button>;
  }

  const renderValidationButtons = (actionText, nextStatus, confirmationMessage) => (
    <div className="flex flex-col gap-4">
      <Textarea 
        label="Catatan (Wajib diisi jika menolak)" 
        value={catatan} 
        onChange={(e) => setCatatan(e.target.value)} 
      />
      <div className="flex gap-2">
        <Button 
          color="green" 
          onClick={() => openConfirmModal(() => handleUpdateStatus(nextStatus), `Konfirmasi ${actionText}`, confirmationMessage, `Ya, ${actionText}`, 'green')}
          disabled={!!catatan} 
        >
          {actionText}
        </Button>
        <Button 
          color="red" 
          onClick={() => openConfirmModal(() => handleUpdateStatus('Ditolak', catatan), 'Konfirmasi Penolakan', 'Anda yakin ingin menolak pengajuan ini?', 'Ya, Tolak', 'red')}
          disabled={!catatan} 
        >
          Tolak
        </Button>
      </div>
    </div>
  );

  if (jenis === 'Internal') {
    if (user.role === 'Pengurus Barang' && status === 'Diajukan') {
      return renderValidationButtons('Validasi', 'Divalidasi Pengurus Barang', 'Anda yakin ingin memvalidasi peminjaman ini?');
    }
    if (user.role === 'Penata Usaha Barang' && status === 'Divalidasi Pengurus Barang') {
      return renderValidationButtons('Setujui', 'Divalidasi Penatausahaan', 'Anda yakin ingin menyetujui peminjaman ini?');
    }
  }

  if (jenis === 'Eksternal') {
    if (user.role === 'Penata Usaha Barang' && status === 'Diajukan') {
      return renderValidationButtons('Setujui', 'Divalidasi Penatausahaan', 'Anda yakin ingin menyetujui peminjaman eksternal ini?');
    }
  }
  
  if (status === 'Divalidasi Penatausahaan' && (user.role === 'Pengurus Barang' || user.role === 'Admin')) {
    return <Button color="blue" onClick={() => openConfirmModal(() => handleUpdateStatus('Selesai'), 'Konfirmasi Pengembalian', 'Anda yakin ingin menandai barang ini sudah kembali?', 'Ya, Tandai Kembali', 'blue')}>Tandai Sudah Kembali</Button>;
  }

  return null;
};

export function DetailPeminjaman() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState(null);
  const [logData, setLogData] = useState([]);
  const [error, setError] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, title: "", message: "", actionText: "Ya", actionColor: "green" });

  const fetchDetailAndLogs = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const peminjamanResponse = await fetch(`/api/peminjaman/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!peminjamanResponse.ok) throw new Error("Gagal mengambil detail peminjaman");
      const peminjamanData = await peminjamanResponse.json();
      setPeminjaman(peminjamanData);

      const logResponse = await fetch(`/api/peminjaman/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (logResponse.ok) {
        const logs = await logResponse.json();
        setLogData(logs);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchDetailAndLogs();
  }, [id]);
  
  const handleUpdateStatus = async (status_baru, catatanPenolakan = null) => {
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Memperbarui status...");
    try {
      const response = await fetch(`/api/peminjaman/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status_baru, catatan: catatanPenolakan }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Status berhasil diperbarui.", { id: toastId });
      fetchDetailAndLogs();
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

  const handleDownloadInternalBA = async () => {
    const toastId = toast.loading("Mempersiapkan PDF...");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/peminjaman/${id}/download-berita-acara`, {
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
      link.setAttribute('download', `berita-acara-peminjaman-${id}.pdf`);
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
    setConfirmState({ isOpen: true, title, message, action, actionText, actionColor });
  };

  const handleConfirmAction = () => {
    if (confirmState.action) {
      confirmState.action();
    }
    setConfirmState({ isOpen: false, action: null });
  };
  
  if (!peminjaman) return <Typography className="text-center mt-12">Memuat...</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Peminjaman: {peminjaman?.nomor_usulan || '...'}</Typography>
          <Chip variant="gradient" color={getStatusColor(peminjaman?.status)} value={peminjaman?.status || '...'} />
        </CardHeader>
        <CardBody>
            {error && <Typography color="red" className="mb-4 text-center">{error}</Typography>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Typography variant="small" className="font-bold">Nama Peminjam:</Typography><Typography>{peminjaman?.nama_peminjam || '-'}</Typography></div>
                <div><Typography variant="small" className="font-bold">Jenis Peminjaman:</Typography><Typography>{peminjaman?.jenis || '-'}</Typography></div>
                <div><Typography variant="small" className="font-bold">Tanggal Pinjam:</Typography><Typography>{formatDate(peminjaman?.tanggal_mulai_pinjam)}</Typography></div>
                <div><Typography variant="small" className="font-bold">Tanggal Rencana Kembali:</Typography><Typography>{formatDate(peminjaman?.tanggal_rencana_kembali)}</Typography></div>
                <div className="md:col-span-2"><Typography variant="small" className="font-bold">Keperluan:</Typography><Typography>{peminjaman?.keperluan || '-'}</Typography></div>
                {peminjaman?.jenis === 'Eksternal' && (user?.role === 'Penata Usaha Barang' || user?.role === 'Admin') && (
                  <div className="md:col-span-2">
                    <Typography variant="small" className="font-bold">Surat Peminjaman:</Typography>
                    <a href={`http://localhost:5000/${peminjaman.surat_peminjaman_url}`} target="_blank" rel="noopener noreferrer">
                      <Button color="blue" size="sm" className="mt-1">
                        Lihat Surat
                      </Button>
                    </a>
                  </div>
                )}
            </div>
            
            <div className="mt-6">
                <Typography variant="h6" color="blue-gray" className="mb-2">Daftar Barang Dipinjam</Typography>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>
                                {["Nama Barang", "Kode Barang", "Merk/Tipe"].map(h => 
                                    <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                        <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {peminjaman?.details?.map(barang => (
                                <tr key={barang.id}>
                                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold">{barang.nama_barang}</Typography></td>
                                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs">{barang.kode_barang}</Typography></td>
                                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs">{barang.merk || '-'} / {barang.tipe || '-'}</Typography></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </CardBody>
      </Card>
      
      {peminjaman?.status === 'Divalidasi Penatausahaan' && peminjaman?.jenis === 'Eksternal' && 
        <BeritaAcaraForm 
          peminjamanId={id} 
          dataPeminjaman={peminjaman} 
          onSaveSuccess={fetchDetailAndLogs}
        />
      }

      {peminjaman?.status === 'Divalidasi Penatausahaan' && peminjaman?.jenis === 'Internal' &&
        <Card>
            <CardHeader variant="gradient" color="blue-gray" className="p-6">
                <Typography variant="h6" color="white">
                Cetak Berita Acara (Internal)
                </Typography>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
                <Typography>
                    Data Pihak Kedua (peminjam) diambil otomatis dari data akun Anda. Pihak Pertama adalah Pengurus Barang yang melakukan validasi.
                </Typography>
            </CardBody>
            <CardFooter className="flex justify-end">
                <Button onClick={handleDownloadInternalBA} color="green">Download PDF</Button>
            </CardFooter>
        </Card>
      }

      <Card>
          <CardHeader variant="gradient" color="gray" className="p-6"><Typography variant="h6" color="white">Aksi</Typography></CardHeader>
          <CardBody>
              <ActionButtons
                peminjaman={peminjaman}
                user={user}
                openConfirmModal={openConfirmModal}
                handleUpdateStatus={handleUpdateStatus}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                catatan={catatan}
                setCatatan={setCatatan}
              />
          </CardBody>
      </Card>

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
              Belum ada riwayat validasi untuk peminjaman ini.
            </Typography>
          )}
        </CardBody>
      </Card>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Anda yakin ingin menghapus pengajuan peminjaman ini?"
      />
      <ConfirmationProses
        open={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
        actionText={confirmState.actionText}
        actionColor={confirmState.actionColor}
      />
    </div>
  );
}

export default DetailPeminjaman;