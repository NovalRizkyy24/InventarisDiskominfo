import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button } from "@material-tailwind/react";

// Helper untuk format (tidak ada perubahan)
const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
};
const formatRupiah = (number) => {
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
};

// Komponen Label Cetak (desain labelnya di sini)
const LabelToPrint = ({ barang }) => {
    if (!barang) return null;
    return (
        <div className="p-4 border border-black w-[300px] font-sans">
            <Typography variant="h6" className="text-center font-bold mb-2 text-black">
                {barang.nama_barang}
            </Typography>
            <Typography variant="small" className="text-center mb-2 text-black">
                {barang.kode_barang}
            </Typography>
            {barang.qr_code_url ? (
                <img src={barang.qr_code_url} alt={`QR Code`} className="w-48 h-48 mx-auto" />
            ) : (
                <div className="w-48 h-48 mx-auto bg-gray-200 flex items-center justify-center">
                    <Typography variant="small" color="gray">QR Code Belum Ada</Typography>
                </div>
            )}
        </div>
    );
};

export function DetailBarang() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [barang, setBarang] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(`/api/barang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error("Gagal mengambil detail barang");
            const data = await response.json();
            setBarang(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleRegenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`/api/barang/${id}/regenerate-qr`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Gagal membuat ulang QR Code");
            await fetchDetail();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    if (loading && !barang) return <Typography className="text-center mt-12">Memuat data...</Typography>;
    if (error) return <Typography color="red" className="text-center mt-12">{error}</Typography>;

    return (
        <>
            <div className="printable-area">
                <LabelToPrint barang={barang} />
            </div>
            <style type="text/css" media="print">
                {`
                    @page { size: auto; margin: 10mm; }
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                `}
            </style>
            
            <div className="non-printable-area mt-12 mb-8 flex flex-col gap-8">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="p-6">
                        <Typography variant="h6" color="white">
                            Detail Barang: {barang?.nama_barang}
                        </Typography>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Kolom Kiri: Detail Teks */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><Typography variant="small" className="font-bold">Nama Barang:</Typography><Typography>{barang?.nama_barang}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{barang?.kode_barang}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Kategori:</Typography><Typography>{barang?.nama_kategori || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Merk / Tipe:</Typography><Typography>{barang?.merk || '-'} / {barang?.tipe || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Tanggal Perolehan:</Typography><Typography>{formatDate(barang?.tanggal_perolehan)}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Nilai Perolehan:</Typography><Typography>{formatRupiah(barang?.nilai_perolehan)}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Sumber Dana:</Typography><Typography>{barang?.sumber_dana || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Status:</Typography><Typography>{barang?.status}</Typography></div>
                                <div className="md:col-span-2"><Typography variant="small" className="font-bold">Spesifikasi:</Typography><Typography>{barang?.spesifikasi || '-'}</Typography></div>
                            </div>

                            {/* Kolom Kanan: QR Code dan Tombol Aksi */}
                            <div className="flex flex-col items-center justify-start gap-4 pt-4 lg:pt-0">
                                <Typography variant="h6" color="blue-gray">QR Code</Typography>
                                {barang?.qr_code_url ? (
                                    <img src={barang.qr_code_url} alt="QR Code" className="w-48 h-48 border p-1" />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-center p-2">
                                        <Typography variant="small" color="gray">Belum Dibuat</Typography>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-48">
                                    <Button color="blue" size="sm" onClick={handleRegenerate} disabled={loading} fullWidth>
                                        {loading ? 'Memproses...' : 'Regenerasi QR'}
                                    </Button>
                                    <Button color="green" size="sm" onClick={handlePrint} disabled={!barang?.qr_code_url} fullWidth>
                                        Cetak Label
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Card untuk Detail Lokasi */}
                <Card>
                    <CardHeader variant="gradient" color="blue-gray" className="p-6">
                        <Typography variant="h6" color="white">Detail Lokasi Penyimpanan</Typography>
                    </CardHeader>
                    <CardBody>
                        {barang?.lokasi_id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><Typography variant="small" className="font-bold">Nama Lokasi/Ruangan:</Typography><Typography>{barang.nama_lokasi}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Provinsi:</Typography><Typography>{barang.provinsi || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Kabupaten/Kota:</Typography><Typography>{barang.kab_kota || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Kecamatan:</Typography><Typography>{barang.kecamatan || '-'}</Typography></div>
                                <div><Typography variant="small" className="font-bold">Kelurahan/Desa:</Typography><Typography>{barang.kelurahan_desa || '-'}</Typography></div>
                                <div className="md:col-span-2"><Typography variant="small" className="font-bold">Deskripsi Lokasi:</Typography><Typography>{barang.deskripsi || '-'}</Typography></div>
                            </div>
                        ) : (
                            <Typography className="text-center text-blue-gray-500">Lokasi untuk barang ini belum diatur.</Typography>
                        )}
                    </CardBody>
                </Card>
                
                <div className="flex justify-end">
                    <Button onClick={() => navigate(-1)}>Kembali</Button>
                </div>
            </div>
        </>
    );
}

export default DetailBarang;