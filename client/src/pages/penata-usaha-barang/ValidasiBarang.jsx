import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Textarea
} from "@material-tailwind/react";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");

export function ValidasiBarang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barang, setBarang] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/barang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data barang");
        setBarang(await response.json());
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDetail();
  }, [id]);

  const handleValidation = async (disetujui) => {
    setError("");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/barang/${id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disetujui, catatan }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      navigate("/penata-usaha-barang/data-barang");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!barang) return <Typography>Memuat...</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="p-6">
          <Typography variant="h6" color="white">Validasi Pendataan Barang</Typography>
        </CardHeader>
        <CardBody className="p-6">
          {error && <Typography color="red" className="mb-4">{error}</Typography>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Typography variant="small" className="font-bold">Nama Barang:</Typography><Typography>{barang.nama_barang}</Typography></div>
            <div><Typography variant="small" className="font-bold">Kode Barang:</Typography><Typography>{barang.kode_barang}</Typography></div>
            <div><Typography variant="small" className="font-bold">Merk/Tipe:</Typography><Typography>{barang.merk || '-'} / {barang.tipe || '-'}</Typography></div>
            <div><Typography variant="small" className="font-bold">Tanggal Perolehan:</Typography><Typography>{formatDate(barang.tanggal_perolehan)}</Typography></div>
            <div><Typography variant="small" className="font-bold">Nilai Perolehan:</Typography><Typography>Rp {Number(barang.nilai_perolehan).toLocaleString('id-ID')}</Typography></div>
            <div className="md:col-span-2"><Typography variant="small" className="font-bold">Spesifikasi:</Typography><Typography>{barang.spesifikasi || '-'}</Typography></div>
          </div>
        </CardBody>
        <CardFooter className="p-6">
          <Textarea label="Catatan (Opsional, diisi jika menolak)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          <div className="flex gap-4 mt-4">
            <Button color="green" onClick={() => handleValidation(true)}>Setujui</Button>
            <Button color="red" onClick={() => handleValidation(false)}>Tolak</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ValidasiBarang;