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
import { PlusIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/useAuth"; 

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Diajukan': return 'blue';
    case 'Divalidasi Pengurus Barang': return 'light-blue';
    case 'Divalidasi Penatausahaan': return 'cyan';
    case 'Disetujui Kepala Dinas': return 'teal';
    case 'Selesai': return 'green';
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

export function DataPengadaan() {
  const [usulan, setUsulan] = useState([]);
  const { user } = useAuth(); 

  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  useEffect(() => {
    const fetchPengadaan = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/pengadaan', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data pengadaan");
        const data = await response.json();
        setUsulan(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPengadaan();
  }, []);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <div className="flex justify-between items-center">
            <Typography variant="h6" color="white">
              Data Rencana Pengadaan Barang
            </Typography>
            <Link to="/ppk/tambah-pengadaan">
              <Button color="white" className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                Buat Usulan Baru
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["No", "Nomor Usulan", "Tanggal Usalan", "Program", "Pengusul", "Status", "Aksi"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{usulan.map(({ id, nomor_usulan, tanggal_usulan, program, nama_pengusul, status }, key) => (
              <tr key={id}>
                <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold">{key + 1}</Typography></td>
                <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold">{nomor_usulan}</Typography></td>
                <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal">{formatDate(tanggal_usulan)}</Typography></td>
                <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal max-w-xs truncate">{program}</Typography></td>
                <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal">{nama_pengusul}</Typography></td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                  <Chip variant="gradient" color={getStatusColor(status)} value={status} className="py-0.5 px-2 text-[11px] font-medium" />
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                  <Link to={`/${layout}/detail-pengadaan/${id}`}>
                    <Button variant="text" size="sm">Lihat Detail</Button>
                  </Link>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default DataPengadaan;