import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography, IconButton, Tooltip, Button, Input } from "@material-tailwind/react";
import { TrashIcon, PencilIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { ConfirmationModal } from "@/widgets/layout";

export function DataKategori() {
  const [kategori, setKategori] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = "/api/kategori";

  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil data kategori");
      const data = await response.json();
      setKategori(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem("authToken");
    try {
      await fetch(`${API_URL}/${itemToDelete}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error(error);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-12">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
            <Typography variant="h6" color="white">Tabel Data Kategori</Typography>
            <Link to="/admin/tambah-kategori">
              <Button color="white" className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" /> Tambah Kategori
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <div className="p-4">
              <Input
                label="Cari Kategori..."
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["No", "Nama Kategori", "Kode Kategori", "Aksi"].map((el) => (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kategori.map(({ id, nama_kategori, kode_kategori }, key) => (
                  <tr key={id}>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{key + 1}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-semibold">{nama_kategori}</Typography></td>
                    <td className="py-3 px-5 border-b"><Typography className="text-xs font-normal">{kode_kategori}</Typography></td>
                    <td className="py-3 px-5 border-b flex gap-2">
                      <Tooltip content="Edit Kategori">
                        <Link to={`/admin/edit-kategori/${id}`}>
                          <IconButton variant="text"><PencilIcon className="h-4 w-4" /></IconButton>
                        </Link>
                      </Tooltip>
                      <Tooltip content="Hapus Kategori">
                        <IconButton variant="text" color="red" onClick={() => openDeleteModal(id)}><TrashIcon className="h-4 w-4" /></IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
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
        message="Anda yakin ingin menghapus kategori ini?"
      />
    </>
  );
}

export default DataKategori;