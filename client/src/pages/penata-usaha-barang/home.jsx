import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardHeader, CardBody, Button, Chip } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import {
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const getJenisChip = (jenis) => {
    switch (jenis) {
        case 'Peminjaman':
            return <Chip color="blue" value="Peminjaman" size="sm" className="w-fit" />;
        case 'Pengadaan':
            return <Chip color="green" value="Pengadaan" size="sm" className="w-fit" />;
        case 'Barang Baru':
            return <Chip color="amber" value="Barang Baru" size="sm" className="w-fit" />;
        default:
            return <Chip color="gray" value={jenis} size="sm" className="w-fit" />;
    }
};

const getDetailLink = (tugas) => {
    const layout = 'penata-usaha-barang';
    switch (tugas.jenis) {
        case 'Peminjaman':
            return `/${layout}/detail-peminjaman/${tugas.id}`;
        case 'Pengadaan':
            return `/${layout}/detail-pengadaan/${tugas.id}`;
        case 'Barang Baru':
            return `/${layout}/validasi-barang/${tugas.id}`;
        default:
            return '#';
    }
}

export function Home() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            const token = localStorage.getItem("authToken");
            try {
                const response = await fetch("/api/dashboard/penata-usaha-summary", {
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
                    title="Validasi Barang Baru"
                    icon={<ArchiveBoxIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiBarang || 0}
                />
                <StatisticsCard
                    title="Validasi Peminjaman"
                    icon={<ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiPeminjaman || 0}
                />
                <StatisticsCard
                    title="Validasi Pengadaan"
                    icon={<DocumentPlusIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.validasiPengadaan || 0}
                />
            </div>
            
            <div className="mb-4">
                 <Card className="border border-blue-gray-100 shadow-sm">
                    <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="blue-gray">Tugas Validasi Anda</Typography>
                    </CardHeader>
                    <CardBody className="pt-0 overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Jenis", "Nomor / Nama Barang", "Tanggal", "Aksi"].map(h => 
                                        <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {summary?.daftarTugas.length > 0 ? (
                                    summary.daftarTugas.map((tugas) => (
                                        <tr key={`${tugas.jenis}-${tugas.id}`}>
                                            <td className="py-3 px-5 border-b">{getJenisChip(tugas.jenis)}</td>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{tugas.nomor}</Typography></td>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs">{new Date(tugas.tanggal).toLocaleDateString('id-ID')}</Typography></td>
                                            <td className="py-3 px-5 border-b">
                                                 <Link to={getDetailLink(tugas)}>
                                                    <Button variant="text" size="sm">Proses Validasi</Button>
                                                 </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-5 text-center">
                                            <Typography>Tidak ada tugas validasi saat ini.</Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

export default Home;