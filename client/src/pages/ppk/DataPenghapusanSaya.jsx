import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Chip,
} from "@material-tailwind/react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const getStatusColor = (status) => {
  switch (status) {
    case 'Diajukan': return 'blue';
    case 'Divalidasi Pengurus Barang': return 'light-blue';
    case 'Divalidasi Penatausahaan': return 'teal';
    case 'Disetujui Kepala Dinas': return 'green';
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

export function DataPenghapusanSaya() {
  const [penghapusan, setPenghapusan] = useState([]);
  const { user } = useAuth();
  
  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  useEffect(() => {
    const fetchPenghapusanSaya = async () => {
      const token = localStorage.getItem("authToken");
      const toastId = toast.loading("Memuat data usulan penghapusan...");
      try {
        const response = await fetch('/api/penghapusan/saya', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data penghapusan Anda");
        const data = await response.json();
        setPenghapusan(data);
        toast.dismiss(toastId);
      } catch (error) {
        toast.error(error.message, { id: toastId });
      }
    };
    if (user) {
        fetchPenghapusanSaya();
    }
  }, [user]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Lacak Usulan Penghapusan Saya
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["No. Usulan", "Nama Barang", "Tanggal Usulan", "Status", "Aksi"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {penghapusan.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nomor_usulan || '-'}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang || '-'}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{formatDate(item.tanggal_pengajuan)}</Typography></td>
                  <td className="py-3 px-5 border-b">
                    <Chip variant="gradient" color={getStatusColor(item.status)} value={item.status || '...'} className="py-0.5 px-2 text-[11px]" />
                  </td>
                  <td className="py-3 px-5 border-b">
                    <Link to={`/${layout}/detail-penghapusan/${item.id}`}>
                      <Button variant="text" size="sm">Lihat Detail</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default DataPenghapusanSaya;