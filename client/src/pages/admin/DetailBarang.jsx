import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
} from "@material-tailwind/react";

// Helper untuk format tanggal dan mata uang
const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatRupiah = (number) => {
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
    }).format(number);
};

export function DetailBarang() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [barang, setBarang] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const fetchDetail = async () => {
            try {
                const response = await fetch(`/api/barang/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Gagal mengambil detail barang");
                const data = await response.json();
                setBarang(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) {
        return <Typography className="text-center mt-12">Memuat data...</Typography>;
    }
    if (error) {
        return <Typography color="red" className="text-center mt-12">{error}</Typography>;
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-8">
            {/* Card untuk Informasi Utama Barang */}
            <Card>
                <CardHeader variant="gradient" color="gray" className="p-6">
                    <Typography variant="h6" color="white">
                        Detail Barang: {barang.nama_barang}
                    </Typography>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </CardBody>
            </Card>

            {/* Card Baru untuk Detail Lokasi */}
            <Card>
                <CardHeader variant="gradient" color="blue-gray" className="p-6">
                    <Typography variant="h6" color="white">
                        Detail Lokasi Penyimpanan
                    </Typography>
                </CardHeader>
                <CardBody>
                    {barang.lokasi_id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><Typography variant="small" className="font-bold">Nama Lokasi/Ruangan:</Typography><Typography>{barang.nama_lokasi}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Provinsi:</Typography><Typography>{barang.provinsi || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Kabupaten/Kota:</Typography><Typography>{barang.kab_kota || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Kecamatan:</Typography><Typography>{barang.kecamatan || '-'}</Typography></div>
                            <div><Typography variant="small" className="font-bold">Kelurahan/Desa:</Typography><Typography>{barang.kelurahan_desa || '-'}</Typography></div>
                            <div className="md:col-span-2"><Typography variant="small" className="font-bold">Deskripsi Lokasi:</Typography><Typography>{barang.deskripsi || '-'}</Typography></div>
                        </div>
                    ) : (
                        <Typography className="text-center text-blue-gray-500">
                            Lokasi untuk barang ini belum diatur.
                        </Typography>
                    )}
                </CardBody>
            </Card>

            <div className="flex justify-end">
                <Button onClick={() => navigate(-1)}>Kembali</Button>
            </div>
        </div>
    );
}

export default DetailBarang;