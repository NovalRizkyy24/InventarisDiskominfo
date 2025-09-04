import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardBody, Typography, Button, Select, Option, Input,
  Tabs, TabsHeader, Tab, TabsBody, TabPanel,
} from "@material-tailwind/react";
import { DocumentTextIcon, TableCellsIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";

export function Laporan() {
  const [activeTab, setActiveTab] = useState("barang");
  
  const [barangReportData, setBarangReportData] = useState([]);
  const [barangFilters, setBarangFilters] = useState({ status: "", kategori_id: "", tanggal_mulai: "", tanggal_akhir: "" });
  const [kategoriList, setKategoriList] = useState([]);
  const [barangLoading, setBarangLoading] = useState(false);

  const [peminjamanReportData, setPeminjamanReportData] = useState([]);
  const [peminjamanFilters, setPeminjamanFilters] = useState({ status: "", jenis: "", tanggal_mulai: "", tanggal_akhir: "" });
  const [peminjamanLoading, setPeminjamanLoading] = useState(false);

  const [penghapusanReportData, setPenghapusanReportData] = useState([]);
  const [penghapusanFilters, setPenghapusanFilters] = useState({ status: "", tanggal_mulai: "", tanggal_akhir: "" });
  const [penghapusanLoading, setPenghapusanLoading] = useState(false);

  const [pengadaanReportData, setPengadaanReportData] = useState([]);
  const [pengadaanFilters, setPengadaanFilters] = useState({ status: "", tanggal_mulai: "", tanggal_akhir: "" });
  const [pengadaanLoading, setPengadaanLoading] = useState(false);

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

  const handleBarangFilterChange = (name, value) => setBarangFilters(prev => ({ ...prev, [name]: value }));
  const handlePeminjamanFilterChange = (name, value) => setPeminjamanFilters(prev => ({ ...prev, [name]: value }));
  const handlePenghapusanFilterChange = (name, value) => setPenghapusanFilters(prev => ({ ...prev, [name]: value }));
  const handlePengadaanFilterChange = (name, value) => setPengadaanFilters(prev => ({ ...prev, [name]: value }));

  const handleGenerateBarangReport = async () => {
    setBarangLoading(true);
    setBarangReportData([]); 
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Membuat laporan daftar barang...");
    const params = new URLSearchParams(barangFilters);
    try {
        const response = await fetch(`/api/laporan/daftar-barang?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data laporan barang");
        const data = await response.json();
        setBarangReportData(data);
        toast.success(`Laporan berhasil dibuat! Ditemukan ${data.length} data.`, { id: toastId });
    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setBarangLoading(false);
    }
  };
  
  const handleGeneratePeminjamanReport = async () => {
    setPeminjamanLoading(true);
    setPeminjamanReportData([]);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Membuat laporan peminjaman...");
    const params = new URLSearchParams(peminjamanFilters);
    try {
        const response = await fetch(`/api/laporan/peminjaman?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data laporan peminjaman");
        const data = await response.json();
        setPeminjamanReportData(data);
        toast.success(`Laporan berhasil dibuat! Ditemukan ${data.length} data.`, { id: toastId });
    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setPeminjamanLoading(false);
    }
  };

  const handleGeneratePenghapusanReport = async () => {
    setPenghapusanLoading(true);
    setPenghapusanReportData([]);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Membuat laporan penghapusan...");
    const params = new URLSearchParams(penghapusanFilters);
    try {
        const response = await fetch(`/api/laporan/penghapusan?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data laporan penghapusan");
        const data = await response.json();
        setPenghapusanReportData(data);
        toast.success(`Laporan berhasil dibuat! Ditemukan ${data.length} data.`, { id: toastId });
    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setPenghapusanLoading(false);
    }
  };

  const handleGeneratePengadaanReport = async () => {
    setPengadaanLoading(true);
    setPengadaanReportData([]);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Membuat laporan pengadaan...");
    const params = new URLSearchParams(pengadaanFilters);
    try {
        const response = await fetch(`/api/laporan/pengadaan?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil data laporan pengadaan");
        const data = await response.json();
        setPengadaanReportData(data);
        toast.success(`Laporan berhasil dibuat! Ditemukan ${data.length} data.`, { id: toastId });
    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setPengadaanLoading(false);
    }
  };

  const handleExport = async (format) => {
    let reportData, reportTitle, reportHeaders;

    switch(activeTab) {
        case 'barang':
            reportData = barangReportData;
            reportTitle = 'Laporan Daftar Barang';
            reportHeaders = ["Kode Barang", "Nama Barang", "Kategori", "Merk/Tipe", "Tanggal Perolehan", "Nilai", "Status", "Lokasi"];
            break;
        case 'peminjaman':
            reportData = peminjamanReportData;
            reportTitle = 'Laporan Riwayat Peminjaman';
            reportHeaders = ["No. Usulan", "Tanggal Pengajuan", "Nama Barang", "Peminjam", "Jenis", "Tanggal Pinjam", "Tanggal Kembali", "Status"];
            break;
        case 'penghapusan':
            reportData = penghapusanReportData;
            reportTitle = 'Laporan Riwayat Penghapusan';
            reportHeaders = ["No. Usulan", "Tanggal Pengajuan", "Nama Barang", "Kode Barang", "Pengusul", "Alasan", "Status"];
            break;
        case 'pengadaan':
            reportData = pengadaanReportData;
            reportTitle = 'Laporan Rencana Pengadaan';
            reportHeaders = ["No. Usulan", "Tanggal Usulan", "Program", "Pengusul", "Status"];
            break;
        default:
            toast.error("Jenis laporan tidak valid.");
            return;
    }

    if (reportData.length === 0) {
        toast.error("Tidak ada data untuk diekspor.");
        return;
    }

    const toastId = toast.loading(`Mengekspor ke ${format.toUpperCase()}...`);
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch('/api/laporan/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: reportTitle, headers: reportHeaders, data: reportData, format: format })
        });
        if (!response.ok) throw new Error(`Gagal mengekspor ${format.toUpperCase()}`);

        const disposition = response.headers.get('content-disposition');
        let filename = `${reportTitle.toLowerCase().replace(/ /g, '_')}.${format}`;
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("File berhasil diekspor!", { id: toastId });
    } catch (err) {
        toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">Generator Laporan</Typography>
        </CardHeader>
        <CardBody>
          <Tabs value={activeTab}>
            <TabsHeader>
              <Tab value="barang" onClick={() => setActiveTab("barang")}>Daftar Barang</Tab>
              <Tab value="peminjaman" onClick={() => setActiveTab("peminjaman")}>Riwayat Peminjaman</Tab>
              <Tab value="penghapusan" onClick={() => setActiveTab("penghapusan")}>Riwayat Penghapusan</Tab>
              <Tab value="pengadaan" onClick={() => setActiveTab("pengadaan")}>Rencana Pengadaan</Tab>
            </TabsHeader>
            <TabsBody>
              <TabPanel value="barang">
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select label="Filter Status" onChange={(value) => handleBarangFilterChange('status', value)} menuProps={{ strategy: "fixed" }}>
                      <Option value="">Semua Status</Option>
                      <Option value="Tersedia">Tersedia</Option>
                      <Option value="Dipinjam">Dipinjam</Option>
                      <Option value="Rusak Berat">Rusak Berat</Option>
                      <Option value="Tidak Aktif">Tidak Aktif</Option>
                    </Select>
                    <Select label="Filter Kategori" onChange={(value) => handleBarangFilterChange('kategori_id', value)} menuProps={{ strategy: "fixed" }}>
                        <Option value="">Semua Kategori</Option>
                        {kategoriList.map(kat => <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>)}
                    </Select>
                    <Input type="date" label="Dari Tanggal Perolehan" onChange={(e) => handleBarangFilterChange('tanggal_mulai', e.target.value)} />
                    <Input type="date" label="Sampai Tanggal Perolehan" onChange={(e) => handleBarangFilterChange('tanggal_akhir', e.target.value)} />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleGenerateBarangReport} disabled={barangLoading}>
                      {barangLoading ? "Memproses..." : "Buat Laporan"}
                    </Button>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="peminjaman">
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select label="Filter Status" onChange={(value) => handlePeminjamanFilterChange('status', value)} menuProps={{ strategy: "fixed" }}>
                            <Option value="">Semua Status</Option>
                            <Option value="Selesai">Selesai</Option>
                            <Option value="Ditolak">Ditolak</Option>
                        </Select>
                        <Select label="Filter Jenis" onChange={(value) => handlePeminjamanFilterChange('jenis', value)} menuProps={{ strategy: "fixed" }}>
                            <Option value="">Semua Jenis</Option>
                            <Option value="Internal">Internal</Option>
                            <Option value="Eksternal">Eksternal</Option>
                        </Select>
                        <Input type="date" label="Dari Tanggal Pengajuan" onChange={(e) => handlePeminjamanFilterChange('tanggal_mulai', e.target.value)} />
                        <Input type="date" label="Sampai Tanggal Pengajuan" onChange={(e) => handlePeminjamanFilterChange('tanggal_akhir', e.target.value)} />
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleGeneratePeminjamanReport} disabled={peminjamanLoading}>
                        {peminjamanLoading ? "Memproses..." : "Buat Laporan"}
                        </Button>
                    </div>
                </div>
              </TabPanel>
              <TabPanel value="penghapusan">
                 <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select label="Filter Status" onChange={(value) => handlePenghapusanFilterChange('status', value)} menuProps={{ strategy: "fixed" }}>
                            <Option value="">Semua Status</Option>
                            <Option value="Selesai">Selesai</Option>
                            <Option value="Ditolak">Ditolak</Option>
                        </Select>
                        <Input type="date" label="Dari Tanggal Pengajuan" onChange={(e) => handlePenghapusanFilterChange('tanggal_mulai', e.target.value)} />
                        <Input type="date" label="Sampai Tanggal Pengajuan" onChange={(e) => handlePenghapusanFilterChange('tanggal_akhir', e.target.value)} />
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleGeneratePenghapusanReport} disabled={penghapusanLoading}>
                        {penghapusanLoading ? "Memproses..." : "Buat Laporan"}
                        </Button>
                    </div>
                </div>
              </TabPanel>
              <TabPanel value="pengadaan">
                 <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select label="Filter Status" onChange={(value) => handlePengadaanFilterChange('status', value)} menuProps={{ strategy: "fixed" }}>
                            <Option value="">Semua Status</Option>
                            <Option value="Selesai">Selesai</Option>
                            <Option value="Ditolak">Ditolak</Option>
                        </Select>
                        <Input type="date" label="Dari Tanggal Usulan" onChange={(e) => handlePengadaanFilterChange('tanggal_mulai', e.target.value)} />
                        <Input type="date" label="Sampai Tanggal Usulan" onChange={(e) => handlePengadaanFilterChange('tanggal_akhir', e.target.value)} />
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleGeneratePengadaanReport} disabled={pengadaanLoading}>
                        {pengadaanLoading ? "Memproses..." : "Buat Laporan"}
                        </Button>
                    </div>
                </div>
              </TabPanel>
            </TabsBody>
          </Tabs>
        </CardBody>
      </Card>

      {barangReportData.length > 0 && activeTab === 'barang' && (
        <Card>
            <CardHeader variant="gradient" color="blue-gray" className="p-6 flex justify-between items-center">
                 <Typography variant="h6" color="white">Hasil Laporan: Daftar Barang</Typography>
                 <div className="flex gap-2">
                    <Button color="red" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2">
                        <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> PDF
                    </Button>
                    <Button color="blue" size="sm" onClick={() => handleExport('docx')} className="flex items-center gap-2">
                        <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> Word
                    </Button>
                    <Button color="green" size="sm" onClick={() => handleExport('xlsx')} className="flex items-center gap-2">
                        <TableCellsIcon strokeWidth={2} className="h-4 w-4" /> Excel
                    </Button>
                </div>
            </CardHeader>
            <CardBody className="px-0 pt-0 pb-2">
                <div className="overflow-x-scroll">
                  <table className="w-full min-w-[640px] table-auto">
                      <thead>
                          <tr>{["Kode Barang", "Nama Barang", "Kategori", "Merk/Tipe", "Tanggal Perolehan", "Nilai", "Status", "Lokasi"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}</tr>
                      </thead>
                      <tbody>
                          {barangReportData.map((item, index) => (
                              <tr key={index}>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.kode_barang}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_barang}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_kategori || '-'}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.merk || ''} / {item.tipe || ''}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_perolehan)}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">Rp {Number(item.nilai_perolehan).toLocaleString('id-ID')}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.status}</Typography></td>
                                  <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_lokasi || '-'}</Typography></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
            </CardBody>
        </Card>
      )}

      {peminjamanReportData.length > 0 && activeTab === 'peminjaman' && (
          <Card>
              <CardHeader variant="gradient" color="blue-gray" className="p-6 flex justify-between items-center">
                   <Typography variant="h6" color="white">Hasil Laporan: Peminjaman</Typography>
                   <div className="flex gap-2">
                        <Button color="red" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> PDF
                        </Button>
                        <Button color="blue" size="sm" onClick={() => handleExport('docx')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> Word
                        </Button>
                        <Button color="green" size="sm" onClick={() => handleExport('xlsx')} className="flex items-center gap-2">
                            <TableCellsIcon strokeWidth={2} className="h-4 w-4" /> Excel
                        </Button>
                    </div>
              </CardHeader>
              <CardBody className="px-0 pt-0 pb-2">
                  <div className="overflow-x-scroll">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>{["No. Usulan", "Tanggal Pengajuan", "Nama Barang", "Peminjam", "Jenis", "Tanggal Pinjam", "Tanggal Kembali", "Status"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}</tr>
                        </thead>
                        <tbody>
                            {peminjamanReportData.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nomor_usulan}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_pengajuan)}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_barang}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_peminjam}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.jenis}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_mulai_pinjam)}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_aktual_kembali)}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.status}</Typography></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </CardBody>
          </Card>
      )}

      {penghapusanReportData.length > 0 && activeTab === 'penghapusan' && (
          <Card>
              <CardHeader variant="gradient" color="blue-gray" className="p-6 flex justify-between items-center">
                   <Typography variant="h6" color="white">Hasil Laporan: Penghapusan</Typography>
                   <div className="flex gap-2">
                        <Button color="red" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> PDF
                        </Button>
                        <Button color="blue" size="sm" onClick={() => handleExport('docx')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> Word
                        </Button>
                        <Button color="green" size="sm" onClick={() => handleExport('xlsx')} className="flex items-center gap-2">
                            <TableCellsIcon strokeWidth={2} className="h-4 w-4" /> Excel
                        </Button>
                    </div>
              </CardHeader>
              <CardBody className="px-0 pt-0 pb-2">
                  <div className="overflow-x-scroll">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>{["No. Usulan", "Tanggal Pengajuan", "Nama Barang", "Kode Barang", "Pengusul", "Alasan", "Status"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}</tr>
                        </thead>
                        <tbody>
                            {penghapusanReportData.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nomor_usulan}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_pengajuan)}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_barang}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.kode_barang}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_pengusul}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.alasan_penghapusan}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.status}</Typography></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </CardBody>
          </Card>
      )}

      {pengadaanReportData.length > 0 && activeTab === 'pengadaan' && (
          <Card>
              <CardHeader variant="gradient" color="blue-gray" className="p-6 flex justify-between items-center">
                   <Typography variant="h6" color="white">Hasil Laporan: Pengadaan</Typography>
                   <div className="flex gap-2">
                        <Button color="red" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> PDF
                        </Button>
                        <Button color="blue" size="sm" onClick={() => handleExport('docx')} className="flex items-center gap-2">
                            <DocumentTextIcon strokeWidth={2} className="h-4 w-4" /> Word
                        </Button>
                        <Button color="green" size="sm" onClick={() => handleExport('xlsx')} className="flex items-center gap-2">
                            <TableCellsIcon strokeWidth={2} className="h-4 w-4" /> Excel
                        </Button>
                    </div>
              </CardHeader>
              <CardBody className="px-0 pt-0 pb-2">
                  <div className="overflow-x-scroll">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>{["No. Usulan", "Tanggal Usulan", "Program", "Pengusul", "Status"].map(h => <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left"><Typography variant="small" className="font-bold uppercase text-blue-gray-400">{h}</Typography></th>)}</tr>
                        </thead>
                        <tbody>
                            {pengadaanReportData.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{item.nomor_usulan}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{formatDate(item.tanggal_usulan)}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.program}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.nama_pengusul}</Typography></td>
                                    <td className="py-3 px-5 border-b"><Typography className="text-xs">{item.status}</Typography></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </CardBody>
          </Card>
      )}
    </div>
  );
}

export default Laporan;