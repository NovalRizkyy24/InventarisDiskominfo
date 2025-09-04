import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  EyeIcon, 
  MapPinIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { ConfirmationModal } from "@/widgets/layout";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const getStatusColor = (status) => {
  switch (status) {
    case 'Menunggu Validasi': return 'orange';
    case 'Tersedia': return 'green';
    case 'Dipinjam': return 'blue';
    case 'Dalam Perbaikan': return 'amber';
    case 'Tidak Aktif': return 'blue-gray';
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

export function DataBarang() {
  const [barang, setBarang] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "Semua",
    kategori_id: "",
    startDate: "",
    endDate: "",
  });
  const { user } = useAuth();

  const API_URL = "/api/barang";

  useEffect(() => {
    const fetchBarang = async () => {
      if (!user) return; 
      const token = localStorage.getItem("authToken");
      try {
        const params = new URLSearchParams();
        if (filters.status !== "Semua") params.append('status', filters.status);
        if (filters.kategori_id) params.append('kategori_id', filters.kategori_id);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        
        const response = await fetch(`${API_URL}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil data barang");
        let data = await response.json();
        setBarang(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBarang();
  }, [user, filters]); 

  useEffect(() => {
    const fetchKategori = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal memuat daftar kategori.");
        const data = await response.json();
        setKategoriList(data);
      } catch (error) {
        toast.error(error.message);
      }
    };
    fetchKategori();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/${itemToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal menghapus barang");
      setIsModalOpen(false);
      setItemToDelete(null);
      // Data akan di-refetch oleh useEffect
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus barang.");
      setIsModalOpen(false);
    }
  };

  const canAdd = user && (user.role === 'Admin' || user.role === 'Pengurus Barang');
  const canEditOrDelete = user && user.role === 'Admin';
  const canManageLocation = user && (user.role === 'Admin' || user.role === 'Pengurus Barang');
  const canValidate = user && user.role === 'Penata Usaha Barang';
  const layout = user?.role.toLowerCase().replace(/ /g, '-');
  
  const tableHeaders = ["No", "Nama Barang", "Kode", "Kategori", "Merk/Tipe", "Status", "Aksi"];

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-12">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
            <div className="flex justify-between items-center">
              <Typography variant="h6" color="white">
                Tabel Data Barang
              </Typography>
              {canAdd && (
                <Link to={`/${layout}/tambah-barang`}>
                  <Button color="white" className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    Tambah Barang
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-4 pt-0 pb-2">
            <div className="mb-4 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="w-full">
                    <Input
                        label="Cari Barang..."
                        icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div className="w-full">
                    <Select label="Filter Status" value={filters.status} onChange={(val) => handleFilterChange('status', val)}>
                      <Option value="Semua">Semua Status</Option>
                      <Option value="Tersedia">Tersedia</Option>
                      <Option value="Dipinjam">Dipinjam</Option>
                      <Option value="Dalam Perbaikan">Dalam Perbaikan</Option>
                      <Option value="Tidak Aktif">Tidak Aktif</Option>
                      <Option value="Ditolak">Ditolak</Option>
                      <Option value="Menunggu Validasi">Menunggu Validasi</Option>
                    </Select>
                </div>
                <div className="w-full">
                    <Select label="Filter Kategori" value={filters.kategori_id} onChange={(val) => handleFilterChange('kategori_id', val)}>
                        <Option value="">Semua Kategori</Option>
                        {kategoriList.map((kat) => (
                            <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>
                        ))}
                    </Select>
                </div>
                <Input type="date" label="Dari Tanggal Perolehan" onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                <Input type="date" label="Sampai Tanggal Perolehan" onChange={(e) => handleFilterChange('endDate', e.target.value)} />
            </div>

            <div className="overflow-x-scroll">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {tableHeaders.map((el) => (
                      <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {barang.map((item, key) => (
                      <tr key={item.id}>
                        <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold">{key + 1}</Typography></td>
                        <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold">{item.nama_barang}</Typography></td>
                        <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal">{item.kode_barang}</Typography></td>
                        <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal">{item.nama_kategori || '-'}</Typography></td>
                        <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-normal">{item.merk || ''}{item.tipe ? ` / ${item.tipe}` : ''}</Typography></td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Chip
                            variant="gradient"
                            color={getStatusColor(item.status)}
                            value={item.status}
                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                          />
                        </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <div className="flex gap-1">
                            <Tooltip content="Lihat Detail">
                              <Link to={`/${layout}/detail-barang/${item.id}`}>
                                <IconButton variant="text">
                                  <EyeIcon className="h-4 w-4 text-blue-gray-500" />
                                </IconButton>
                              </Link>
                            </Tooltip>
                            
                            {canManageLocation && (
                              <Tooltip content="Atur Lokasi">
                                <Link to={`/${layout}/atur-lokasi/${item.id}`}>
                                  <IconButton variant="text"><MapPinIcon className="h-4 w-4 text-green-500" /></IconButton>
                                </Link>
                              </Tooltip>
                            )}

                            {canValidate && item.status === 'Menunggu Validasi' && (
                              <Link to={`/penata-usaha-barang/validasi-barang/${item.id}`}>
                                <Button variant="text" size="sm">Validasi</Button>
                              </Link>
                            )}
                            
                            {canEditOrDelete && (
                              <>
                                <Tooltip content="Edit Barang">
                                  <Link to={`/${layout}/edit-barang/${item.id}`}>
                                    <IconButton variant="text"><PencilIcon className="h-4 w-4" /></IconButton>
                                  </Link>
                                </Tooltip>
                                <Tooltip content="Hapus Barang">
                                  <IconButton variant="text" color="red" onClick={() => openDeleteModal(item.id)}><TrashIcon className="h-4 w-4" /></IconButton>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Penghapusan"
        message="Anda yakin ingin menghapus barang ini? Data yang dihapus tidak dapat dikembalikan."
      />
    </>
  );
}

export default DataBarang;