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

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
const getStatusColor = (status) => ({'Diajukan': 'blue', 'Divalidasi Pengurus Barang': 'light-blue', 'Divalidasi Penatausahaan': 'cyan', 'Disetujui Kepala Dinas': 'teal', 'Selesai': 'green', 'Ditolak': 'red'})[status] || 'gray';

export function DataUsulanSaya() {
  const [usulan, setUsulan] = useState([]);
  const { user } = useAuth();
  
  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  useEffect(() => {
    const fetchUsulanSaya = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/pengadaan/saya', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data usulan Anda");
        const data = await response.json();
        setUsulan(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsulanSaya();
  }, []);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Lacak Usulan Saya
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Nomor Usulan", "Tanggal Usulan", "Program", "Status", "Aksi"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usulan.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nomor_usulan}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{formatDate(item.tanggal_usulan)}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal max-w-xs truncate">{item.program}</Typography></td>
                  <td className="py-3 px-5 border-b">
                    <Chip variant="gradient" color={getStatusColor(item.status)} value={item.status} className="py-0.5 px-2 text-[11px] font-medium" />
                  </td>
                  <td className="py-3 px-5 border-b">
                    <Link to={`/${layout}/detail-pengadaan/${item.id}`}>
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

export default DataUsulanSaya;