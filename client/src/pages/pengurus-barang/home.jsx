import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardHeader, CardBody, Button, Chip } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import {
  ClipboardDocumentCheckIcon,
  TrashIcon,
  ArchiveBoxIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const getJenisChip = (jenis) => {
    switch (jenis) {
        case 'Peminjaman':
            return <Chip color="blue" value="Peminjaman" size="sm" className="w-fit" />;
        case 'Penghapusan':
            return <Chip color="red" value="Penghapusan" size="sm" className="w-fit" />;
        default:
            return <Chip color="gray" value={jenis} size="sm" className="w-fit" />;
    }
};


export function Home() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            const token = localStorage.getItem("authToken");
            try {
                const response = await fetch("/api/dashboard/pengurus-barang-summary", {
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
                    title="Validasi Peminjaman"
                    icon={<ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiPeminjaman || 0}
                />
                <StatisticsCard
                    title="Validasi Penghapusan"
                    icon={<TrashIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiPenghapusan || 0}
                />
                <StatisticsCard
                    title="Validasi Barang Baru"
                    icon={<ArchiveBoxIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiBarang || 0}
                />
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
                 <Card className="border border-blue-gray-100 shadow-sm xl:col-span-2">
                    <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="blue-gray">Tugas Validasi Terbaru</Typography>
                        <Link to="/pengurus-barang/data-peminjaman">
                             <Button variant="text" size="sm">Lihat Semua</Button>
                        </Link>
                    </CardHeader>
                    <CardBody className="pt-0 overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Jenis", "Nomor Usulan", "Tanggal", "Aksi"].map(h => 
                                        <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {summary?.daftarTugas.map((tugas) => (
                                    <tr key={`${tugas.jenis}-${tugas.id}`}>
                                        <td className="py-3 px-5 border-b">{getJenisChip(tugas.jenis)}</td>
                                        <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{tugas.nomor}</Typography></td>
                                        <td className="py-3 px-5 border-b"><Typography className="text-xs">{new Date(tugas.tanggal).toLocaleDateString('id-ID')}</Typography></td>
                                        <td className="py-3 px-5 border-b">
                                             <Link to={`/pengurus-barang/detail-${tugas.jenis.toLowerCase()}/${tugas.id}`}>
                                                <Button variant="text" size="sm">Lihat Detail</Button>
                                             </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
                 <Card className="border border-blue-gray-100 shadow-sm">
                     <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
                        <Typography variant="h6" color="blue-gray">Aksi Cepat</Typography>
                    </CardHeader>
                    <CardBody className="flex flex-col gap-4 p-6">
                        <Link to="/pengurus-barang/tambah-pengadaan">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                               <DocumentPlusIcon className="h-5 w-5" /> Buat Usulan Pengadaan
                            </Button>
                        </Link>
                         <Link to="/pengurus-barang/tambah-peminjaman">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                                <ClipboardDocumentListIcon className="h-5 w-5" /> Buat Usulan Peminjaman
                            </Button>
                        </Link>
                         <Link to="/pengurus-barang/tambah-barang">
                            <Button fullWidth variant="outlined" className="flex items-center justify-center gap-2">
                                <ArchiveBoxIcon className="h-5 w-5" /> Tambah Barang Baru
                            </Button>
                        </Link>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

export default Home;