import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardHeader, CardBody, Button, Chip } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import {
  BanknotesIcon,
  ArchiveBoxIcon,
  DocumentCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);


const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number);
};

const getJenisChip = (jenis) => {
    switch (jenis) {
        case 'Pengadaan':
            return <Chip color="green" value="Pengadaan" size="sm" className="w-fit" />;
        case 'Penghapusan':
            return <Chip color="red" value="Penghapusan" size="sm" className="w-fit" />;
        default:
            return <Chip color="gray" value={jenis} size="sm" className="w-fit" />;
    }
};

const getDetailLink = (tugas) => {
    const layout = 'kepala-dinas';
    switch (tugas.jenis.toLowerCase()) {
        case 'pengadaan':
            return `/${layout}/detail-pengadaan/${tugas.id}`;
        case 'penghapusan':
             return `/${layout}/detail-penghapusan/${tugas.id}`;
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
                const response = await fetch("/api/dashboard/kepala-dinas-summary", {
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

    const kategoriChartData = {
        labels: summary?.komposisiKategori.map(k => k.nama_kategori) || [],
        datasets: [{
            label: 'Jumlah Barang',
            data: summary?.komposisiKategori.map(k => k.jumlah) || [],
            backgroundColor: ['rgba(54, 162, 235, 0.7)','rgba(255, 99, 132, 0.7)','rgba(255, 206, 86, 0.7)','rgba(75, 192, 192, 0.7)','rgba(153, 102, 255, 0.7)','rgba(255, 159, 64, 0.7)'],
            borderWidth: 1,
        }],
    };
    
    const statusChartData = {
        labels: summary?.komposisiStatus.map(s => s.status) || [],
        datasets: [{
            label: 'Jumlah Barang',
            data: summary?.komposisiStatus.map(s => s.jumlah) || [],
            backgroundColor: ['rgba(75, 192, 192, 0.7)','rgba(54, 162, 235, 0.7)','rgba(255, 159, 64, 0.7)','rgba(255, 99, 132, 0.7)','rgba(153, 102, 255, 0.7)'],
            borderWidth: 1,
        }]
    };

    const pieChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } },
    };
    
    if (loading) {
        return <Typography className="text-center mt-12">Memuat dashboard...</Typography>;
    }

    return (
        <div className="mt-12">
            <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
                <StatisticsCard
                    title="Total Nilai Aset"
                    icon={<BanknotesIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={formatRupiah(summary?.totalAsetValue || 0)}
                />
                <StatisticsCard
                    title="Total Barang"
                    icon={<ArchiveBoxIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.totalBarang || 0}
                />
                <StatisticsCard
                    title="Persetujuan Pengadaan"
                    icon={<DocumentCheckIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.persetujuanPengadaan || 0}
                />
                <StatisticsCard
                    title="Persetujuan Penghapusan"
                    icon={<TrashIcon className="w-6 h-6 text-white" />}
                    color="gray"
                    value={summary?.persetujuanPenghapusan || 0}
                />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-1 xl:grid-cols-2">
                <Card className="border border-blue-gray-100 shadow-sm">
                    <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
                         <Typography variant="h6" color="white">Komposisi Barang per Kategori</Typography>
                    </CardHeader>
                    <CardBody className="flex justify-center items-center h-80">
                        {summary?.komposisiKategori && summary.komposisiKategori.length > 0 ? (
                             <Pie data={kategoriChartData} options={pieChartOptions} />
                        ) : (
                            <Typography>Data kategori tidak tersedia.</Typography>
                        )}
                    </CardBody>
                </Card>
                <Card className="border border-blue-gray-100 shadow-sm">
                    <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
                         <Typography variant="h6" color="white">Jumlah Barang per Status</Typography>
                    </CardHeader>
                    <CardBody className="flex justify-center items-center h-80">
                        {summary?.komposisiStatus && summary.komposisiStatus.length > 0 ? (
                             <Bar data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}/>
                        ) : (
                            <Typography>Data status tidak tersedia.</Typography>
                        )}
                    </CardBody>
                </Card>
            </div>
            
            <div className="mb-4">
                 <Card className="border border-blue-gray-100 shadow-sm">
                    <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="blue-gray">Menunggu Persetujuan Anda</Typography>
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
                                {summary?.daftarPersetujuan.length > 0 ? (
                                    summary.daftarPersetujuan.map((tugas) => (
                                        <tr key={`${tugas.jenis}-${tugas.id}`}>
                                            <td className="py-3 px-5 border-b">{getJenisChip(tugas.jenis)}</td>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{tugas.nomor}</Typography></td>
                                            <td className="py-3 px-5 border-b"><Typography className="text-xs">{new Date(tugas.tanggal).toLocaleDateString('id-ID')}</Typography></td>
                                            <td className="py-3 px-5 border-b">
                                                 <Link to={getDetailLink(tugas)}>
                                                    <Button variant="text" size="sm">Lihat Detail & Beri Persetujuan</Button>
                                                 </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-5 text-center">
                                            <Typography>Tidak ada usulan yang memerlukan persetujuan saat ini.</Typography>
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