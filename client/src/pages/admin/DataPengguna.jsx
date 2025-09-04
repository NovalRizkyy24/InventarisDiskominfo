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
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { ConfirmationModal } from "@/widgets/layout";

export function DataPengguna() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "Semua",
  });

  const API_URL = "/api/users";

  const fetchUsers = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role !== "Semua") params.append('role', filters.role);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Gagal mengambil data pengguna");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);


  const openDeleteModal = (userId) => {
    setUserToDelete(userId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/${userToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Gagal menghapus pengguna");
      }
      closeDeleteModal();
      fetchUsers();
    } catch (error) {
      console.error(error);
      closeDeleteModal();
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const userRoles = [
    "Pengurus Barang",
    "Penata Usaha Barang",
    "PPK",
    "Kepala Bidang",
    "Kepala Dinas",
    "Admin",
  ];

  return (
    <>
      <div className="mt-12 mb-8 flex flex-col gap-12">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <div className="flex justify-between items-center">
              <Typography variant="h6" color="white">
                Tabel Data Pengguna
              </Typography>
              <Link to="/admin/tambah-pengguna">
                <Button color="white" className="flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  Tambah Pengguna
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="px-0 pt-0 pb-2">
            <div className="p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-72">
                <Input
                  label="Cari Nama/Username"
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className="w-full md:w-72">
                <Select 
                  label="Filter Berdasarkan Peran" 
                  value={filters.role} 
                  onChange={(val) => handleFilterChange('role', val)}
                >
                  <Option value="Semua">Semua Peran</Option>
                  {userRoles.map(role => (
                    <Option key={role} value={role}>{role}</Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["No", "Nama", "Username", "Jabatan", "NIP", "Peran", "Aksi"].map((el) => (
                    <th
                      key={el}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(({ id, nama, username, role, jabatan, nip }, key) => {
                  const className = `py-3 px-5 ${
                    key === users.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={id}>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {key + 1}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {nama}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-normal text-blue-gray-500">
                          {username}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-normal text-blue-gray-500">
                          {jabatan || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-normal text-blue-gray-500">
                          {nip || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-normal text-blue-gray-500">
                          {role}
                        </Typography>
                      </td>
                      <td className={`${className} flex gap-2`}>
                        <Tooltip content="Edit Pengguna">
                          <Link to={`/admin/edit-pengguna/${id}`}>
                            <IconButton variant="text">
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                          </Link>
                        </Tooltip>
                        <Tooltip content="Hapus Pengguna">
                          <IconButton
                            variant="text"
                            color="red"
                            onClick={() => openDeleteModal(id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </CardBody>
        </Card>
      </div>
      <ConfirmationModal
        open={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Konfirmasi Penghapusan"
        message="Data pengguna yang telah dihapus tidak dapat dikembalikan lagi."
      />
    </>
  );
}

export default DataPengguna;