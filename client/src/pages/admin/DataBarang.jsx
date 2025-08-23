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
} from "@material-tailwind/react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { ConfirmationModal } from "@/widgets/layout";
import { useAuth } from "@/hooks/useAuth";
import { EyeIcon, MapPinIcon } from "@heroicons/react/24/solid"; 

const getStatusColor = (status) => {
  switch (status) {
    case 'Menunggu Validasi': return 'orange';
    case 'Tersedia': return 'green';
    case 'Dipinjam': return 'blue';
    case 'Dalam Perbaikan': return 'amber';
    case 'Rusak Berat': return 'red';
    case 'Tidak Aktif': return 'blue-gray';
    case 'Ditolak': return 'red';
    default: return 'gray';
  }
};

export function DataBarang() {
  const [barang, setBarang] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { user } = useAuth();

  const API_URL = "/api/barang";

  const fetchBarang = async () => {
    if (!user) return; 
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal mengambil data barang");
      let data = await response.json();

      const rolesAllowedToSeeValidation = ['Admin', 'Pengurus Barang', 'Penata Usaha Barang'];
      if (!rolesAllowedToSeeValidation.includes(user.role)) {
        data = data.filter(item => item.status !== 'Menunggu Validasi');
      }
      
      setBarang(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, [user]); 

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
      await fetchBarang(); 
    } catch (error) {
      console.error(error);
      setIsModalOpen(false);
    }
  };
  
  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  const canAdd = user && (user.role === 'Admin' || user.role === 'Pengurus Barang');
  const canEditOrDelete = user && user.role === 'Admin';
  const canManageLocation = user && (user.role === 'Admin' || user.role === 'Pengurus Barang');
  const canValidate = user && user.role === 'Penata Usaha Barang';
  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  const tableHeaders = ["No", "Nama Barang", "Kode", "Kategori", "Status", "Aksi"];

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-12">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
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
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
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
                          
                          {/* === TOMBOL ATUR LOKASI BARU === */}
                          {/* {canEditOrDelete && (
                            <Tooltip content="Atur Lokasi">
                              <Link to={`/admin/atur-lokasi/${item.id}`}>
                                <IconButton variant="text"><MapPinIcon className="h-4 w-4 text-green-500" /></IconButton>
                              </Link>
                            </Tooltip>
                          )} */}

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