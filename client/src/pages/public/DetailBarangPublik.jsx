import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";

const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
};
const formatRupiah = (number) => {
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
};

export function DetailBarangPublik() {
    const { id } = useParams();
    const [barang, setBarang] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    //const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.6:5000';

    useEffect(() => {
        const fetchPublicDetail = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/barang/public/${id}`);
                if (!response.ok) throw new Error("Gagal mengambil data barang atau barang tidak ditemukan.");
                const data = await response.json();
                setBarang(data);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicDetail();
    }, [id]);

    if (loading) return <Typography className="text-center mt-12">Memuat data...</Typography>;
    if (error) return <Typography color="red" className="text-center mt-12">{error}</Typography>;
    if (!barang) return <Typography className="text-center mt-12">Data barang tidak ditemukan.</Typography>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader variant="gradient" color="gray" className="p-6">
                    <Typography variant="h5" color="white">
                        Informasi Aset: {barang.nama_barang}
                    </Typography>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Kolom Informasi Teks */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><Typography variant="small" className="font-bold">Nama Barang:</Typography><Typography>{barang.nama_barang}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{barang.kode_barang}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Kategori:</Typography><Typography>{barang.nama_kategori || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Merk / Tipe:</Typography><Typography>{barang.merk || '-'} / {barang.tipe || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Tanggal Perolehan:</Typography><Typography>{formatDate(barang.tanggal_perolehan)}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Nilai Perolehan:</Typography><Typography>{formatRupiah(barang.nilai_perolehan)}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Sumber Dana:</Typography><Typography>{barang.sumber_dana || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Status:</Typography><Typography>{barang.status}</Typography></div>
                            <div className="md:col-span-2"><Typography variant="small" className="font-bold">Spesifikasi:</Typography><Typography>{barang.spesifikasi || '-'}</Typography></div>
                        </div>
                        {/* Kolom Gambar */}
                        <div className="flex flex-col items-center justify-start gap-4 pt-4 lg:pt-0">
                            <Typography variant="h6" color="blue-gray">Foto Barang</Typography>
                            <div className="w-48 h-48 border p-1 bg-gray-100 flex items-center justify-center">
                                {barang.foto_url ? (
                                    <img src={`${API_URL}/${barang.foto_url}`} alt="Foto Barang" className="w-full h-full object-cover" />
                                ) : (
                                    <Typography variant="small" color="gray" className="text-center">Belum Ada Foto</Typography>
                                )}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default DetailBarangPublik;