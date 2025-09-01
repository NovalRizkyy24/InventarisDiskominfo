import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Tooltip } from "@material-tailwind/react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth"; 
import { MapPinIcon } from "@heroicons/react/24/solid"; 

const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatRupiah = (number) => {
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
};

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
    const { user } = useAuth(); 
    const [barang, setBarang] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            toast.error("Pilih sebuah file gambar terlebih dahulu.");
            return;
        }
        setLoading(true);
        const toastId = toast.loading("Mengunggah gambar...");
        const token = localStorage.getItem("authToken");

        const formData = new FormData();
        formData.append('foto_barang', selectedFile);

        try {
            const response = await fetch(`/api/barang/${id}/upload-foto`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error("Gagal mengunggah gambar.");
            
            toast.success("Gambar berhasil diunggah!", { id: toastId });
            setSelectedFile(null); 
            setPreviewUrl(null);
            await fetchDetail();
        } catch (err) {
            toast.error(err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`/api/barang/${id}/regenerate-qr`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Gagal membuat ulang QR Code");
            toast.success("QR Code berhasil dibuat ulang.");
            await fetchDetail();
        } catch (err) {
            toast.error(err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    const canManageLocation = user && (user.role === 'Admin' || user.role === 'Pengurus Barang');
    const layout = user?.role.toLowerCase().replace(/ /g, '-');

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
            
            <div className="ml-4 mt-4 mb-8">
                <div className="flex flex-row gap-4">
                    <Button color="blue" size="sm" onClick={handleRegenerate} disabled={loading}>
                        {loading ? 'Memproses...' : 'Regenerasi QR'}
                    </Button>
                    <Button color="green" size="sm" onClick={handlePrint} disabled={!barang?.qr_code_url}>
                        Cetak Label
                    </Button>
                </div>
            </div>
            
            <div className="non-printable-area mb-8 flex flex-col gap-8">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="p-6">
                        <Typography variant="h6" color="white">
                            Detail Barang: {barang?.nama_barang}
                        </Typography>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            <div className="flex flex-col items-center justify-start gap-4 pt-4 lg:pt-0">
                                <Typography variant="h6" color="blue-gray">Foto Barang</Typography>
                                
                                <div className="w-48 h-48 border p-1 bg-gray-100 flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview Barang" className="w-full h-full object-cover" />
                                    ) : barang?.foto_url ? (
                                        <img src={`${API_URL}/${barang.foto_url}`} alt="Foto Barang" className="w-full h-full object-cover" />
                                    ) : (
                                        <Typography variant="small" color="gray" className="text-center">Belum Ada Foto</Typography>
                                    )}
                                </div>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                                <div className="flex flex-col gap-2 w-48">
                                    <Button color="blue" size="sm" onClick={handleUploadClick} disabled={loading}>
                                        Pilih Gambar
                                    </Button>
                                    {selectedFile && (
                                        <Button color="green" size="sm" onClick={handleImageUpload} disabled={loading}>
                                            {loading ? 'Mengunggah...' : `Unggah Gambar`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader variant="gradient" color="blue-gray" className="p-6 flex justify-between items-center">
                        <Typography variant="h6" color="white">Detail Lokasi Penyimpanan</Typography>
                        {/* --- Tombol Atur Lokasi ditambahkan di sini --- */}
                        {canManageLocation && (
                            <Link to={`/${layout}/atur-lokasi/${barang.id}`}>
                                <Tooltip content="Atur atau ubah lokasi barang ini">
                                    <Button color="white" className="flex items-center gap-2">
                                        <MapPinIcon className="h-5 w-5" />
                                        Atur Lokasi
                                    </Button>
                                </Tooltip>
                            </Link>
                        )}
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