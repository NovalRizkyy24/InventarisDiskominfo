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

export function DataPengguna() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const API_URL = "/api/users";

  const fetchUsers = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(API_URL, {
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
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
                      {/* === PERBAIKAN DI SINI === */}
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
                      {/* === AKHIR PERBAIKAN === */}
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