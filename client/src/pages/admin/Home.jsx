import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardHeader, CardBody, Button } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import {
  UsersIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  ArrowUpRightIcon,
  PlusIcon,
  DocumentTextIcon,
  UserPlusIcon,
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

export function Home() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            const token = localStorage.getItem("authToken");
            try {
                const response = await fetch("/api/dashboard/admin-summary", {
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
        datasets: [
            {
                label: 'Jumlah Barang',
                data: summary?.komposisiKategori.map(k => k.jumlah) || [],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const statusChartData = {
        labels: summary?.komposisiStatus.map(s => s.status) || [],
        datasets: [{
            label: 'Jumlah Barang',
            data: summary?.komposisiStatus.map(s => s.jumlah) || [],
            backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(255, 99, 132, 0.7)', 
                'rgba(153, 102, 255, 0.7)',
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
        }]
    };
    
    if (loading) {
        return <Typography className="text-center mt-12">Memuat dashboard...</Typography>;
    }

    return (
        <div className="mt-12">
            <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
                <StatisticsCard title="Total Pengguna" icon={<UsersIcon className="w-6 h-6 text-white" />} color="gray" value={summary?.totalUsers || 0} />
                <StatisticsCard title="Total Barang" icon={<ArchiveBoxIcon className="w-6 h-6 text-white" />} color="gray" value={summary?.totalBarang || 0} />
                <StatisticsCard title="Barang Dipinjam" icon={<ArrowUpRightIcon className="w-6 h-6 text-white" />} color="gray" value={summary?.barangDipinjam || 0} />
                <StatisticsCard title="Total Nilai Aset" icon={<BanknotesIcon className="w-6 h-6 text-white" />} color="gray" value={formatRupiah(summary?.totalAsetValue || 0)} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-1 xl:grid-cols-2">
                <Card className="border border-blue-gray-100 shadow-sm">
                    <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
                         <Typography variant="h6" color="white">Komposisi Barang per Kategori</Typography>
                    </CardHeader>
                    <CardBody className="flex justify-center items-center h-80">
                        {summary?.komposisiKategori.length > 0 ? (
                             <Pie data={kategoriChartData} />
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
                        {summary?.komposisiStatus.length > 0 ? (
                             <Bar data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}/>
                        ) : (
                            <Typography>Data status tidak tersedia.</Typography>
                        )}
                    </CardBody>
                </Card>
            </div>
            
             <div className="mb-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
                 <Card className="border border-blue-gray-100 shadow-sm xl:col-span-2">
                    <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
                        <Typography variant="h6" color="blue-gray">Aktivitas Peminjaman Terbaru</Typography>
                    </CardHeader>
                    <CardBody className="pt-0">
                        {summary?.aktivitasTerbaru.map((aktivitas, index) => (
                             <div key={index} className="flex items-start gap-4 py-3">
                                <div className="flex-shrink-0">
                                    <DocumentTextIcon className="h-6 w-6 text-blue-gray-400" />
                                </div>
                                <div>
                                    <Typography variant="small" color="blue-gray" className="block font-medium">
                                       {aktivitas.nama_peminjam} meminjam {aktivitas.nama_barang}
                                    </Typography>
                                    <Typography as="span" variant="small" className="text-xs font-medium text-blue-gray-500">
                                       {new Date(aktivitas.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Typography>
                                </div>
                            </div>
                        ))}
                    </CardBody>
                </Card>
                <Card className="border border-blue-gray-100 shadow-sm">
                     <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
                        <Typography variant="h6" color="blue-gray">Aksi Cepat</Typography>
                    </CardHeader>
                    <CardBody className="flex flex-col gap-4 p-6">
                        <Link to="/admin/tambah-pengguna">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                               <UserPlusIcon className="h-5 w-5" /> Tambah Pengguna
                            </Button>
                        </Link>
                         <Link to="/admin/tambah-barang">
                            <Button fullWidth className="flex items-center justify-center gap-2">
                                <PlusIcon className="h-5 w-5" /> Tambah Barang
                            </Button>
                        </Link>
                         <Link to="/admin/laporan">
                            <Button fullWidth variant="outlined" className="flex items-center justify-center gap-2">
                                <DocumentTextIcon className="h-5 w-5" /> Buat Laporan
                            </Button>
                        </Link>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

export default Home;