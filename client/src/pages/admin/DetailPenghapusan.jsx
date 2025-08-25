import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Chip, Textarea } from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmationProses } from "@/widgets/layout";
import toast from "react-hot-toast";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString("id-ID", options).replace(/\./g, ':').replace('pukul', 'Pukul');
};
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'green', 'Ditolak': 'red'})[status] || 'gray';

// --- KOMPONEN ACTIONBUTTONS DIPISAH KELUAR ---
const ActionButtons = ({ usulan, user, openConfirmModal, handleUpdateStatus, catatan, setCatatan }) => {
  if (!usulan || !user) return null;
  const { status } = usulan;
  const { role } = user;

  const actions = {
      'Diajukan': { role: 'Pengurus Barang', nextStatus: 'Divalidasi Pengurus Barang' },
      'Divalidasi Pengurus Barang': { role: 'Penata Usaha Barang', nextStatus: 'Divalidasi Penatausahaan' },
      'Divalidasi Penatausahaan': { role: 'Kepala Dinas', nextStatus: 'Disetujui Kepala Dinas' },
  };

  if (actions[status] && role === actions[status].role) {
    const actionType = status === 'Divalidasi Penatausahaan' ? 'Setujui' : 'Validasi';
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
                onClick={() => openConfirmModal(() => handleUpdateStatus(actions[status].nextStatus), `Konfirmasi ${actionType}`, `Anda yakin ingin ${actionType.toLowerCase()} usulan penghapusan ini?`, `Ya, ${actionType}`, 'green')}
                disabled={!!catatan}
            >
                {actionType}
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
  return null;
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

  if (!usulan) return <Typography>Memuat...</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Detail Usulan Penghapusan: {usulan.nama_barang}</Typography>
          <Chip variant="gradient" color={getStatusColor(usulan.status)} value={usulan.status} />
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
    </div>
  );
}

export default DetailPenghapusan;