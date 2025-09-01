import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardHeader, CardBody, Button, Chip } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const getStatusChip = (status) => {
    const colors = {
      'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'teal', 
      'Menunggu Persetujuan': 'orange', 'Disetujui Kepala Dinas': 'green', 'Selesai': 'blue-gray', 'Ditolak': 'red'
    };
    return <Chip color={colors[status] || 'gray'} value={status} size="sm" className="w-fit" />;
};

const getDetailLink = (usulan) => {
    const layout = 'ppk';
    return `/${layout}/detail-${usulan.jenis.toLowerCase()}/${usulan.id}`;
}

export function Home() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            const token = localStorage.getItem("authToken");
            try {
                const response = await fetch("/api/dashboard/ppk-summary", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Gagal memuat data dashboard");
                const data = await response.json();
                setSummary(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);
    
    if (loading) {
        return <Typography className="text-center mt-12">Memuat dashboard...</Typography>;
    }

    return (
        <div className="mt-12">
            <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                <StatisticsCard
                    title="Total Usulan Pengadaan"
                    icon={<DocumentPlusIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.totalPengadaan || 0}
                />
                <StatisticsCard
                    title="Total Peminjaman Barang"
                    icon={<ClipboardDocumentListIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.totalPeminjaman || 0}
                />
                <StatisticsCard
                    title="Usulan Sedang Diproses"
                    icon={<ClockIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.usulanDiproses || 0}
                />
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
                 <Card className="border border-blue-gray-100 shadow-sm xl:col-span-2">
                    <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="blue-gray">Status Usulan Terbaru Anda</Typography>
                    </CardHeader>
                    <CardBody className="pt-0 overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Jenis", "Nomor Usulan", "Status", "Aksi"].map(h => 
                                        <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {summary?.usulanTerbaru.length > 0 ? (
                                    summary.usulanTerbaru.map((usulan) => (
                                        <tr key={`${usulan.jenis}-${usulan.id}`}>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{usulan.jenis}</Typography></td>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{usulan.nomor}</Typography></td>
                                            <td className="py-3 px-5 border-b">{getStatusChip(usulan.status)}</td>
                                            <td className="py-3 px-5 border-b">
                                                 <Link to={getDetailLink(usulan)}>
                                                    <Button variant="text" size="sm">Lihat Detail</Button>
                                                 </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-5 text-center">
                                            <Typography>Anda belum membuat usulan.</Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
                 <Card className="border border-blue-gray-100 shadow-sm">
                     <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
                        <Typography variant="h6" color="blue-gray">Aksi Cepat</Typography>
                    </CardHeader>
                    <CardBody className="flex flex-col gap-4 p-6">
                        <Link to="/ppk/tambah-pengadaan">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                               <DocumentPlusIcon className="h-5 w-5" /> Ajukan Pengadaan
                            </Button>
                        </Link>
                         <Link to="/ppk/tambah-peminjaman">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                                <ClipboardDocumentListIcon className="h-5 w-5" /> Ajukan Peminjaman
                            </Button>
                        </Link>
                         <Link to="/ppk/tambah-penghapusan">
                            <Button fullWidth color="red" className="flex items-center justify-center gap-2">
                                <TrashIcon className="h-5 w-5" /> Ajukan Penghapusan
                            </Button>
                        </Link>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

export default Home;