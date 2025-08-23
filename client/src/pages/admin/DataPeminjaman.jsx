import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card, 
  CardHeader, 
  CardBody, 
  Typography, 
  Button, 
  Chip
} from "@material-tailwind/react";
import { PlusIcon } from "@heroicons/react/24/solid";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const getStatusColor = (status) => ({ 'Diajukan': 'blue', 
                                      'Divalidasi Pengurus Barang': 'green', 
                                      'Selesai': 'gray', 
                                      'Ditolak': 'red'})[status] || 'gray';

export function DataPeminjaman() {
  const [peminjaman, setPeminjaman] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchData = async () => {
      try {
        const response = await fetch('/api/peminjaman', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data peminjaman");
        const data = await response.json();
        setPeminjaman(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <div className="flex justify-between items-center">
            <Typography variant="h6" color="white">Data Peminjaman Barang</Typography>
            <Link to="/ppk/tambah-peminjaman">
              <Button color="white" className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" /> Ajukan Peminjaman
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Nama Barang", "Pengusul", "Tgl Pinjam", "Tgl Kembali", "Jenis Peminjaman", "Status", "Aksi"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {peminjaman.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.nama_peminjam}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{formatDate(item.tanggal_mulai_pinjam)}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{formatDate(item.tanggal_rencana_kembali)}</Typography></td>
                  <td className="py-3 px-5 border-b">
                    <Chip 
                        variant="ghost"
                        size="sm"
                        color={item.jenis === 'Internal' ? 'blue' : 'teal'}
                        value={item.jenis || 'Internal'}
                        className="w-fit"
                    />
                  </td>
                  <td className="py-3 px-5 border-b">
                    <Chip variant="gradient" color={getStatusColor(item.status)} value={item.status} className="py-0.5 px-2 text-[11px]" />
                  </td>
                  <td className="py-3 px-5 border-b">
                    <Link to={`/admin/detail-peminjaman/${item.id}`}>
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

export default DataPeminjaman;