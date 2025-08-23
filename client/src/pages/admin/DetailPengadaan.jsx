import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
    Chip,
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from 'react-hot-toast';
import { ConfirmationModal, ConfirmationProses } from "@/widgets/layout";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
const formatDateTime = (dateString) => {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return new Date(dateString)
        .toLocaleString("id-ID", options)
        .replace(/\./g, ':')
        .replace('pukul', 'Pukul');
};
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'teal', 'Selesai': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPengadaan() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [usulan, setUsulan] = useState(null);
    const [logData, setLogData] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: "",
        message: "",
        action: null,
        actionText: "Ya, Lanjutkan",
        actionColor: "green",
    });

    const fetchDetailAndLogs = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        try {
            const usulanResponse = await fetch(`/api/pengadaan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!usulanResponse.ok) throw new Error("Gagal mengambil detail usulan");
            const usulanData = await usulanResponse.json();
            setUsulan(usulanData);

            const logResponse = await fetch(`/api/pengadaan/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
            if (!logResponse.ok) throw new Error("Gagal mengambil riwayat validasi");
            const logs = await logResponse.json();
            setLogData(logs);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetailAndLogs();
    }, [id]);

    const handleUpdateStatus = async (status_baru, catatan = "") => {
        const token = localStorage.getItem("authToken");
        const toastId = toast.loading('Memperbarui status...');
        try {
            const response = await fetch(`/api/pengadaan/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status_baru, catatan }),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Gagal update status');
            
            toast.success('Status berhasil diperbarui!', { id: toastId });
            fetchDetailAndLogs();
        } catch (err) {
            toast.error(err.message, { id: toastId });
            setError(err.message);
        }
    };
    
    const handleDelete = async () => {
        setIsDeleteModalOpen(false);
        const toastId = toast.loading('Menghapus usulan...');
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(`/api/pengadaan/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Usulan berhasil dihapus.', { id: toastId });
            navigate(`/${user.role.toLowerCase().replace(/ /g, '-')}/usulan-saya`);
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

    const ActionButtons = () => {
        if (!usulan || !user) return null;
        const { status, user_pengusul_id } = usulan;
        const { role, id: userId } = user;

        const handleValidationClick = (newStatus, type = 'validasi') => {
            const actionText = type === 'setujui' ? 'Ya, Setujui' : 'Ya, Validasi';
            openConfirmModal(
                () => handleUpdateStatus(newStatus),
                `Konfirmasi ${type === 'setujui' ? 'Persetujuan' : 'Validasi'}`,
                `Apakah Anda yakin ingin ${type} usulan ini? Proses tidak dapat dibatalkan.`,
                actionText,
                "green"
            );
        };
    
        const handleRejectClick = () => {
            openConfirmModal(
                () => handleUpdateStatus('Ditolak'),
                'Konfirmasi Penolakan',
                'Apakah Anda yakin ingin menolak usulan ini? Proses tidak dapat dibatalkan.',
                'Ya, Tolak',
                "red"
            );
        };

        if (status === 'Diajukan' && user_pengusul_id === userId) {
            return ( <Button color="red" onClick={() => setIsDeleteModalOpen(true)}>Hapus Usulan</Button> );
        }
        if (status === 'Diajukan' && role === 'Pengurus Barang') {
            return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleValidationClick('Divalidasi Pengurus Barang')}>Validasi</Button> <Button color="red" onClick={handleRejectClick}>Tolak</Button> </div> );
        }
        if (status === 'Divalidasi Pengurus Barang' && role === 'Penata Usaha Barang') {
            return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleValidationClick('Divalidasi Penatausahaan')}>Validasi</Button> <Button color="red" onClick={handleRejectClick}>Tolak</Button> </div> );
        }
        if (status === 'Divalidasi Penatausahaan' && role === 'Kepala Dinas') {
            return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleValidationClick('Disetujui Kepala Dinas', 'setujui')}>Setujui</Button> <Button color="red" onClick={handleRejectClick}>Tolak</Button> </div> );
        }
        if (status === 'Disetujui Kepala Dinas' && role === 'Admin') {
            return <Button color="green" onClick={() => openConfirmModal(() => handleUpdateStatus('Selesai'), 'Konfirmasi Selesai', 'Apakah Anda yakin ingin menandai usulan ini sebagai "Selesai"?', 'Ya, Tandai Selesai', 'green')}>Tandai Selesai</Button>;
        }
        return <Typography variant="small" color="blue-gray">Tidak ada aksi yang tersedia untuk peran Anda.</Typography>;
    };

    const handleDownload = async () => {
        setError("");
        const toastId = toast.loading('Mempersiapkan file unduhan...');
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(`/api/pengadaan/${id}/download-surat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Gagal mengunduh surat.");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `surat-pengadaan-${usulan.nomor_usulan}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Unduhan dimulai!', { id: toastId });
        } catch (err) {
            toast.error(err.message, { id: toastId });
            setError(err.message);
        }
    };

    if (loading) return <Typography className="text-center mt-12">Memuat data...</Typography>;
    if (error && !usulan) return <Typography color="red" className="text-center font-semibold mt-12">Error: {error}</Typography>;
    if (!usulan) return <Typography className="text-center mt-12">Data usulan tidak ditemukan.</Typography>;

    return (
        <div className="mt-12 mb-8 flex flex-col gap-8">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-4 p-6 flex justify-between items-center">
                    <div>
                        <Typography variant="h6" color="white">Rincian Proses Pengadaan Barang</Typography>
                        <Typography variant="small" color="white" className="opacity-80">{usulan.nomor_usulan}</Typography>
                    </div>
                    {/* --- PERBAIKAN DI SINI --- */}
                    <Chip variant="gradient" color={getStatusColor(usulan.status)} value={usulan.status} />
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div><Typography variant="small" className="font-bold">Program:</Typography><Typography>{usulan.program}</Typography></div>
                        <div><Typography variant="small" className="font-bold">Kegiatan:</Typography><Typography>{usulan.kegiatan}</Typography></div>
                        <div><Typography variant="small" className="font-bold">Output:</Typography><Typography>{usulan.output}</Typography></div>
                        <div><Typography variant="small" className="font-bold">Tanggal Usulan:</Typography><Typography>{formatDate(usulan.tanggal_usulan)}</Typography></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Nama Barang", "Jumlah", "Satuan", "Harga Satuan", "Total", "Spesifikasi"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {usulan.details && usulan.details.map((item, key) => (
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
                    </div>
                </CardBody>
                <CardFooter className="pt-4 p-6 flex justify-between items-center">
                    <div><ActionButtons /></div>
                    <div>
                        <Button variant="gradient" onClick={handleDownload} disabled={usulan.status !== 'Disetujui Kepala Dinas' && usulan.status !== 'Selesai'}>
                            Download Surat (PDF)
                        </Button>
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
                            Belum ada riwayat validasi untuk usulan ini.
                        </Typography>
                    )}
                </CardBody>
            </Card>
            
            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus Usulan"
                message="Anda yakin ingin menghapus usulan pengadaan ini? Aksi ini tidak dapat dibatalkan."
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

export default DetailPengadaan;