import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardBody, Typography, Button, Select, Option, Input
} from "@material-tailwind/react";
import toast from "react-hot-toast";

export function Laporan() {
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    kategori_id: "",
    tanggal_mulai: "",
    tanggal_akhir: ""
  });
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchKategori = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        setKategoriList(await response.json());
      } catch (error) {
        toast.error("Gagal memuat kategori.");
      }
    };
    fetchKategori();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData([]); 
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Membuat laporan...");

    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.kategori_id) params.append('kategori_id', filters.kategori_id);
    if (filters.tanggal_mulai) params.append('tanggal_mulai', filters.tanggal_mulai);
    if (filters.tanggal_akhir) params.append('tanggal_akhir', filters.tanggal_akhir);

    try {
        const response = await fetch(`/api/laporan/daftar-barang?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Gagal mengambil data laporan");
        
        const data = await response.json();
        setReportData(data);
        toast.success(`Laporan berhasil dibuat! Ditemukan ${data.length} data.`, { id: toastId });

    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Generator Laporan Inventaris
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select label="Filter Status" onChange={(value) => handleFilterChange('status', value)}>
              <Option value="">Semua Status</Option>
              <Option value="Tersedia">Tersedia</Option>
              <Option value="Dipinjam">Dipinjam</Option>
              <Option value="Rusak Berat">Rusak Berat</Option>
              <Option value="Tidak Aktif">Tidak Aktif</Option>
            </Select>
            <Select label="Filter Kategori" onChange={(value) => handleFilterChange('kategori_id', value)}>
                <Option value="">Semua Kategori</Option>
                {kategoriList.map(kat => <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>)}
            </Select>
            <Input type="date" label="Dari Tanggal Perolehan" onChange={(e) => handleFilterChange('tanggal_mulai', e.target.value)} />
            <Input type="date" label="Sampai Tanggal Perolehan" onChange={(e) => handleFilterChange('tanggal_akhir', e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? "Memproses..." : "Buat Laporan"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {reportData.length > 0 && (
        <Card>
            <CardHeader variant="gradient" color="blue-gray" className="p-6">
                 <Typography variant="h6" color="white">Hasil Laporan: Daftar Barang Inventaris</Typography>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                <table className="w-full min-w-[640px] table-auto">
                    <thead>
                        <tr>
                            {["Kode Barang", "Nama Barang", "Kategori", "Merk/Tipe", "Tgl Perolehan", "Nilai", "Status", "Lokasi"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.kode_barang}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_barang}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_kategori || '-'}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.merk || ''} / {item.tipe || ''}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{new Date(item.tanggal_perolehan).toLocaleDateString('id-ID')}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">Rp {Number(item.nilai_perolehan).toLocaleString('id-ID')}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.status}</Typography></td>
                                <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_lokasi || '-'}</Typography></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Laporan;