import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Textarea,
  Chip
} from "@material-tailwind/react";
import { ConfirmationProses } from "@/widgets/layout";
import toast from "react-hot-toast";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return new Date(dateString).toLocaleString("id-ID", options).replace(/\./g, ':').replace('pukul', 'Pukul');
};
const getStatusColor = (status) => ({'Menunggu Validasi': 'orange', 'Tersedia': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function ValidasiBarang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barang, setBarang] = useState(null);
  const [logData, setLogData] = useState([]); 
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, title: "", message: "", actionText: "Ya", actionColor: "green" });

  const fetchDetailAndLogs = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const barangResponse = await fetch(`/api/barang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!barangResponse.ok) throw new Error("Gagal mengambil data barang");
      setBarang(await barangResponse.json());
      
      const logResponse = await fetch(`/api/barang/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (logResponse.ok) {
        setLogData(await logResponse.json());
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDetailAndLogs();
  }, [id]);

  const _handleValidation = async (disetujui) => {
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Memproses validasi...");
    try {
      const response = await fetch(`/api/barang/${id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disetujui, catatan }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Validasi berhasil diproses.", { id: toastId });
      navigate("/penata-usaha-barang/data-barang");
    } catch (err) {
      toast.error(err.message, { id: toastId });
      setError(err.message);
    }
  };

  const openConfirmModal = (disetujui) => {
    const action = disetujui ? 'menyetujui' : 'menolak';
    setConfirmState({
      isOpen: true,
      title: `Konfirmasi ${disetujui ? 'Persetujuan' : 'Penolakan'}`,
      message: `Anda yakin ingin ${action} pendataan barang ini?`,
      action: () => _handleValidation(disetujui),
      actionText: `Ya, ${disetujui ? 'Setujui' : 'Tolak'}`,
      actionColor: disetujui ? 'green' : 'red',
    });
  };

  const handleConfirmAction = () => {
    if (confirmState.action) confirmState.action();
    setConfirmState({ isOpen: false, action: null });
  };

  if (!barang) return <Typography className="text-center mt-12">Memuat...</Typography>;

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-8">
        <Card>
          <CardHeader variant="gradient" color="gray" className="p-6">
            <Typography variant="h6" color="white">Validasi Pendataan Barang</Typography>
          </CardHeader>
          <CardBody className="p-6">
            {error && <Typography color="red" className="mb-4">{error}</Typography>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Typography variant="small" className="font-bold">Nama Barang:</Typography><Typography>{barang.nama_barang}</Typography></div>
              <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{barang.kode_barang}</Typography></div>
              <div><Typography variant="small" className="font-bold">Merk/Tipe:</Typography><Typography>{barang.merk || '-'} / {barang.tipe || '-'}</Typography></div>
              <div><Typography variant="small" className="font-bold">Tanggal Perolehan:</Typography><Typography>{formatDate(barang.tanggal_perolehan)}</Typography></div>
              <div><Typography variant="small" className="font-bold">Nilai Perolehan:</Typography><Typography>Rp {Number(barang.nilai_perolehan).toLocaleString('id-ID')}</Typography></div>
              <div className="md:col-span-2"><Typography variant="small" className="font-bold">Spesifikasi:</Typography><Typography>{barang.spesifikasi || '-'}</Typography></div>
            </div>
          </CardBody>
          <CardFooter className="p-6">
            <Textarea label="Catatan (Opsional, diisi jika menolak)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <div className="flex gap-4 mt-4">
              {/* --- PERUBAHAN DI SINI --- */}
              <Button color="green" onClick={() => openConfirmModal(true)} disabled={!!catatan}>Setujui</Button>
              <Button color="red" onClick={() => openConfirmModal(false)} disabled={!catatan}>Tolak</Button>
              {/* --- AKHIR PERUBAHAN --- */}
            </div>
          </CardFooter>
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
                Belum ada riwayat validasi untuk barang ini.
                </Typography>
            )}
            </CardBody>
        </Card>
      </div>
      <ConfirmationProses
        open={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
        actionText={confirmState.actionText}
        actionColor={confirmState.actionColor}
      />
    </>
  );
}

export default ValidasiBarang;