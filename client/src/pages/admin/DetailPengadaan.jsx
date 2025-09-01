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
    Checkbox,
    Textarea
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from 'react-hot-toast';
import { ConfirmationModal, ConfirmationProses } from "@/widgets/layout";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
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

const ValidationRow = ({ item, isPenatausahaan, checkedItems, handleCheckboxChange }) => {
    const total = item.jumlah * item.harga_satuan;
    const isChecked = checkedItems[item.id];

    let approvalStatus;
    if (item.disetujui === true) {
        approvalStatus = <Chip variant="ghost" color="green" size="sm" value="Disetujui" className="w-fit" />;
    } else if (item.disetujui === false) {
        approvalStatus = <Chip variant="ghost" color="red" size="sm" value="Ditolak" className="w-fit" />;
    }

    return (
        <tr key={item.id}>
            {isPenatausahaan && (
                <td className="py-3 px-5 border-b">
                    <Checkbox checked={!!isChecked} onChange={() => handleCheckboxChange(item.id)} />
                </td>
            )}
            <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang_usulan}</Typography></td>
            <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.jumlah}</Typography></td>
            <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.satuan}</Typography></td>
            <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</Typography></td>
            <td className="py-3 px-5 border-b min-w-[120px]"><Typography className="text-xs font-semibold">Rp {total.toLocaleString('id-ID')}</Typography></td>
            <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.spesifikasi_usulan}</Typography></td>
            {approvalStatus && (
                 <td className="py-3 px-5 border-b">{approvalStatus}</td>
            )}
        </tr>
    );
};

const ActionButtons = ({ usulan, user, handleUpdateStatus, openConfirmModal, setIsDeleteModalOpen, catatan, setCatatan, handleSaveValidation }) => {
    if (!usulan || !user) return null;
    const { status, user_pengusul_id } = usulan;
    const { role, id: userId } = user;

    if (status === 'Diajukan' && (user_pengusul_id === userId || role === 'Admin')) {
        return ( <Button color="red" onClick={() => setIsDeleteModalOpen(true)}>Hapus Usulan</Button> );
    }
    if (status === 'Diajukan' && role === 'Penata Usaha Barang') {
        return ( <Button color="green" onClick={() => openConfirmModal(handleSaveValidation, 'Konfirmasi Validasi', 'Anda yakin ingin menyimpan hasil validasi barang? Proses ini akan mengubah status usulan.', 'Ya, Simpan', 'green')}>Simpan Validasi Barang</Button> );
    }
    if (status === 'Menunggu Persetujuan' && role === 'Kepala Dinas') {
        return (
            <div className="flex flex-col gap-4">
                <Textarea 
                    label="Catatan (Wajib diisi jika menolak)" 
                    value={catatan} 
                    onChange={(e) => setCatatan(e.target.value)} 
                />
                <div className="flex gap-2">
                    <Button color="green" onClick={() => openConfirmModal(() => handleUpdateStatus('Disetujui Kepala Dinas'), 'Konfirmasi Persetujuan', 'Anda yakin ingin menyetujui usulan ini?', 'Ya, Setujui', 'green')} disabled={!!catatan}>
                        Setujui
                    </Button>
                    <Button color="red" onClick={() => openConfirmModal(() => handleUpdateStatus('Ditolak', catatan), 'Konfirmasi Penolakan', 'Anda yakin ingin menolak usulan ini?', 'Ya, Tolak', 'red')} disabled={!catatan}>
                        Tolak
                    </Button>
                </div>
            </div>
        );
    }
    if (status === 'Disetujui Kepala Dinas' && role === 'Admin') {
        return <Button color="green" onClick={() => openConfirmModal(() => handleUpdateStatus('Selesai'), 'Konfirmasi Selesai', 'Apakah Anda yakin ingin menandai usulan ini sebagai "Selesai"?', 'Ya, Tandai Selesai', 'green')}>Tandai Selesai</Button>;
    }
    return <Typography variant="small" color="blue-gray">Tidak ada aksi yang tersedia untuk peran Anda.</Typography>;
};

export function DetailPengadaan() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [usulan, setUsulan] = useState(null);
    const [logData, setLogData] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [catatan, setCatatan] = useState("");
    const [checkedItems, setCheckedItems] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, title: "", message: "", actionText: "Ya", actionColor: "green" });

    const fetchDetailAndLogs = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        try {
            const usulanResponse = await fetch(`/api/pengadaan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!usulanResponse.ok) throw new Error("Gagal mengambil detail usulan");
            const usulanData = await usulanResponse.json();
            setUsulan(usulanData);

            if (usulanData.details) {
                const initialChecks = {};
                usulanData.details.forEach(item => {
                    initialChecks[item.id] = item.disetujui === null ? false : item.disetujui;
                });
                setCheckedItems(initialChecks);
            }

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

    const handleUpdateStatus = async (status_baru, catatanPenolakan = null) => {
        const token = localStorage.getItem("authToken");
        const toastId = toast.loading('Memperbarui status...');
        try {
            const response = await fetch(`/api/pengadaan/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status_baru, catatan: catatanPenolakan }),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Gagal update status');
            
            toast.success('Status berhasil diperbarui!', { id: toastId });
            fetchDetailAndLogs();
        } catch (err) {
            toast.error(err.message, { id: toastId });
            setError(err.message);
        }
    };

    const handleSaveValidation = async () => {
        const token = localStorage.getItem("authToken");
        const toastId = toast.loading('Menyimpan hasil validasi...');
        try {
            const response = await fetch(`/api/pengadaan/${id}/validate-items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ validatedItems: checkedItems }),
            });
            if (!response.ok) throw new Error("Gagal menyimpan validasi.");
            toast.success("Validasi berhasil disimpan!", { id: toastId });
            fetchDetailAndLogs();
        } catch (err) {
            toast.error(err.message, { id: toastId });
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

    const handleCheckboxChange = (detailId) => {
        setCheckedItems(prev => ({
            ...prev,
            [detailId]: !prev[detailId]
        }));
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

    const isPenatausahaan = user?.role === 'Penata Usaha Barang' && usulan?.status === 'Diajukan';
    const isAfterValidation = ['Menunggu Persetujuan', 'Disetujui Kepala Dinas', 'Selesai', 'Ditolak'].includes(usulan?.status);

    let tableHeaders = ["Nama Barang", "Jumlah", "Satuan", "Harga Satuan", "Total", "Spesifikasi"];
    if(isPenatausahaan) tableHeaders.unshift("Pilih");
    if(isAfterValidation) tableHeaders.push("Status");

    return (
        <div className="mt-12 mb-8 flex flex-col gap-8">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-4 p-6 flex justify-between items-center">
                    <div>
                        <Typography variant="h6" color="white">Rincian Proses Pengadaan Barang</Typography>
                        <Typography variant="small" color="white" className="opacity-80">{usulan.nomor_usulan}</Typography>
                    </div>
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
                                    {tableHeaders.map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {usulan.details && usulan.details.map((item) => (
                                    <ValidationRow 
                                        key={item.id}
                                        item={item}
                                        isPenatausahaan={isPenatausahaan}
                                        checkedItems={checkedItems}
                                        handleCheckboxChange={handleCheckboxChange}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button variant="gradient" onClick={handleDownload} disabled={usulan.status !== 'Disetujui Kepala Dinas' && usulan.status !== 'Selesai'}>
                            Download Surat (PDF)
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader variant="gradient" color="gray" className="p-6">
                    <Typography variant="h6" color="white">Aksi</Typography>
                </CardHeader>
                <CardBody>
                    <ActionButtons 
                        usulan={usulan}
                        user={user}
                        handleUpdateStatus={handleUpdateStatus}
                        openConfirmModal={openConfirmModal}
                        setIsDeleteModalOpen={setIsDeleteModalOpen}
                        catatan={catatan}
                        setCatatan={setCatatan}
                        handleSaveValidation={handleSaveValidation}
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