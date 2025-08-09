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
} from "@material-tailwind/react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { ConfirmationModal } from "@/widgets/layout";
import { useAuth } from "@/hooks/useAuth";

export function DataBarang() {
  const [barang, setBarang] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { user } = useAuth(); // Dapatkan info pengguna

  const API_URL = "/api/barang";

  const fetchBarang = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal mengambil data barang");
      const data = await response.json();
      setBarang(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

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
      fetchBarang();
    } catch (error) {
      console.error(error);
      setIsModalOpen(false);
    }
  };
  
  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  // Tentukan header tabel berdasarkan peran
  const tableHeaders = user && user.role === 'Admin' 
    ? ["No", "Nama Barang", "Kode", "Kategori", "Status", "Aksi"]
    : ["No", "Nama Barang", "Kode", "Kategori", "Status"];

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-12">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <div className="flex justify-between items-center">
              <Typography variant="h6" color="white">
                Tabel Data Barang
              </Typography>
              {/* Tampilkan tombol HANYA untuk Admin */}
              {user && user.role === 'Admin' && (
                <Link to="/admin/tambah-barang">
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
                {barang.map(({ id, nama_barang, kode_barang, nama_kategori, status }, key) => {
                  const className = "py-3 px-5 border-b border-blue-gray-50";
                  return (
                    <tr key={id}>
                      <td className={className}><Typography className="text-xs font-semibold">{key + 1}</Typography></td>
                      <td className={className}><Typography className="text-xs font-semibold">{nama_barang}</Typography></td>
                      <td className={className}><Typography className="text-xs font-normal">{kode_barang}</Typography></td>
                      <td className={className}><Typography className="text-xs font-normal">{nama_kategori || '-'}</Typography></td>
                      <td className={className}><Typography className="text-xs font-normal">{status}</Typography></td>
                      {/* Tampilkan kolom Aksi HANYA untuk Admin */}
                      {user && user.role === 'Admin' && (
                        <td className={className}>
                          <div className="flex gap-2">
                            <Tooltip content="Edit Barang">
                              <Link to={`/admin/edit-barang/${id}`}>
                                <IconButton variant="text"><PencilIcon className="h-4 w-4" /></IconButton>
                              </Link>
                            </Tooltip>
                            <Tooltip content="Hapus Barang">
                              <IconButton variant="text" color="red" onClick={() => openDeleteModal(id)}><TrashIcon className="h-4 w-4" /></IconButton>
                            </Tooltip>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
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