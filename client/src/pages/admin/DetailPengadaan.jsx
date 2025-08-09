import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Chip,
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";

// Helper functions
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'teal', 'Selesai': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function DetailPengadaan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [usulan, setUsulan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    const token = localStorage.getItem("authToken");
    try {
      setLoading(true);
      const response = await fetch(`/api/pengadaan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil detail usulan");
      const data = await response.json();
      setUsulan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (status_baru, catatan = "") => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/pengadaan/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_baru, catatan }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Gagal update status');
      fetchDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const ActionButtons = () => {
    if (!usulan || !user) return null;
    const { status } = usulan;
    const { role } = user;

    if (status === 'Diajukan' && role === 'Pengurus Barang') {
      return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Pengurus Barang')}>Validasi</Button> <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button> </div> );
    }
    if (status === 'Divalidasi Pengurus Barang' && role === 'Penata Usaha Barang') {
      return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleUpdateStatus('Divalidasi Penatausahaan')}>Validasi</Button> <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button> </div> );
    }
    if (status === 'Divalidasi Penatausahaan' && role === 'Kepala Dinas') {
      return ( <div className="flex gap-2"> <Button color="green" onClick={() => handleUpdateStatus('Disetujui Kepala Dinas')}>Setujui</Button> <Button color="red" onClick={() => handleUpdateStatus('Ditolak')}>Tolak</Button> </div> );
    }
    if (status === 'Disetujui Kepala Dinas' && role === 'Admin') {
         return <Button color="green" onClick={() => handleUpdateStatus('Selesai')}>Tandai Selesai</Button>;
    }
    return <Typography variant="small" color="blue-gray">Tidak ada aksi yang tersedia.</Typography>;
  };

    const handleDownload = async () => {
    setError("");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/pengadaan/${id}/download-surat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengunduh surat. Server memberikan respons error.");
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      link.setAttribute('download', `surat-pengadaan-${usulan.nomor_usulan}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); 

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) return <Typography>Memuat data...</Typography>;
  if (error) return <Typography color="red" className="text-center font-semibold">Error: {error}</Typography>;
  if (!usulan) return <Typography>Data usulan tidak ditemukan.</Typography>;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6 flex justify-between items-center">
          <div>
            <Typography variant="h6" color="white">Rincian Proses Pengadaan Barang</Typography>
            <Typography variant="small" color="white" className="opacity-80">{usulan.nomor_usulan}</Typography>
          </div>
          <Chip variant="ghost" color={getStatusColor(usulan.status)} value={usulan.status} />
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div><Typography variant="small" className="font-bold">Program:</Typography><Typography>{usulan.program}</Typography></div>
            <div><Typography variant="small" className="font-bold">Kegiatan:</Typography><Typography>{usulan.kegiatan}</Typography></div>
            <div><Typography variant="small" className="font-bold">Output:</Typography><Typography>{usulan.output}</Typography></div>
            <div><Typography variant="small" className="font-bold">Tanggal Usulan:</Typography><Typography>{formatDate(usulan.tanggal_usulan)}</Typography></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Nama Barang", "Jumlah", "Satuan", "Harga Satuan", "Total", "Spesifikasi"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}
                </tr>
              </thead>
              <tbody>
                {usulan.details && usulan.details.map((item, key) => (
                  <tr key={key}>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang_usulan}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.jumlah}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.satuan}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.spesifikasi_usulan}</Typography></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="pt-4 p-6 flex justify-between items-center">
          <div>
            <ActionButtons />
          </div>
          <div>
              <Button
                variant="gradient"
                onClick={handleDownload}
                disabled={usulan.status !== 'Disetujui Kepala Dinas' && usulan.status !== 'Selesai'}
              >
                Download Surat (PDF)
              </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default DetailPengadaan;