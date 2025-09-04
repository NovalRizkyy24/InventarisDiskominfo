import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, Button, Chip, Input, Select, Option } from "@material-tailwind/react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID");
const getStatusColor = (status) => {
  switch (status) {
    case 'Diajukan': return 'blue';
    case 'Divalidasi Pengurus Barang': return 'light-blue';
    case 'Divalidasi Penatausahaan': return 'teal'; 
    case 'Menunggu Persetujuan': return 'orange';
    case 'Disetujui Kepala Dinas': return 'green';
    case 'Selesai': return 'blue-gray'; 
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

export function DataPenghapusan() {
  const [usulan, setUsulan] = useState([]);
  const [filters, setFilters] = useState({
    status: "Semua",
    search: "",
    startDate: "",
    endDate: "",
  });
  const { user } = useAuth();
  
  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.status !== "Semua") params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await fetch(`/api/penghapusan?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data penghapusan");
        setUsulan(await response.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">Data Usulan Penghapusan Barang</Typography>
          <Link to="/ppk/tambah-penghapusan">
            <Button color="white" className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" /> Ajukan Penghapusan
            </Button>
          </Link>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-2">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
                label="Cari No. Usulan/Barang/Pengusul"
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select label="Filter Status" value={filters.status} onChange={(val) => handleFilterChange('status', val)}>
                <Option value="Semua">Semua Status</Option>
                <Option value="Diajukan">Diajukan</Option>
                <Option value="Divalidasi Pengurus Barang">Divalidasi Pengurus Barang</Option>
                <Option value="Selesai">Selesai</Option>
                <Option value="Ditolak">Ditolak</Option>
            </Select>
            <Input type="date" label="Dari Tanggal" onChange={(e) => handleFilterChange('startDate', e.target.value)} />
            <Input type="date" label="Sampai Tanggal" onChange={(e) => handleFilterChange('endDate', e.target.value)} />
          </div>
          <div className="overflow-x-scroll">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["No. Usulan", "Nama Barang", "Pengusul", "Tanggal Usulan", "Status", "Aksi"].map((el) => (
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
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nama_barang}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{item.nama_pengusul}</Typography></td>
                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{formatDate(item.tanggal_pengajuan)}</Typography></td>
                  <td className="py-3 px-5 border-b">
                    <Chip variant="gradient" color={getStatusColor(item.status)} value={item.status} className="py-0.5 px-2 text-[11px]" />
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
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default DataPenghapusan;