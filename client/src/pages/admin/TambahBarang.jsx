import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Button,
  Select,
  Option,
  Textarea,
} from "@material-tailwind/react";
import toast from 'react-hot-toast';
import { useAuth } from "@/hooks/useAuth";

const formatRupiah = (angka) => {
  if (!angka) return "";
  const number_string = angka.toString().replace(/[^,\d]/g, '');
  const split = number_string.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  return rupiah;
};

export function TambahBarang() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kategoriList, setKategoriList] = useState([]);
  const [formData, setFormData] = useState({
    nama_barang: "",
    kode_barang: "",
    kategori_id: "",
    merk: "",
    tipe: "",
    spesifikasi: "", // State untuk spesifikasi ditambahkan
    sumber_dana: "",
    tanggal_perolehan: "",
    nilai_perolehan: "",
    status: "Tersedia",
  });
  const [loading, setLoading] = useState(false);
  const [kodePrefix, setKodePrefix] = useState("");
  const [kodeSuffix, setKodeSuffix] = useState(""); 

  useEffect(() => {
    const fetchKategori = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch('/api/kategori', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        setKategoriList(data);
      } catch (error) {
        toast.error("Gagal memuat daftar kategori.");
      }
    };
    fetchKategori();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nilai_perolehan') {
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleKodeSuffixChange = (e) => {
    setKodeSuffix(e.target.value);
  };
  
  const handleKategoriChange = (value) => {
    const selectedKategori = kategoriList.find(kat => String(kat.id) === value);
    if (selectedKategori) {
      const prefix = `${selectedKategori.kode_kategori}-`;
      setKodePrefix(prefix);
      setKodeSuffix(""); 
      setFormData((prev) => ({
        ...prev,
        kategori_id: value,
      }));
    } else {
      setKodePrefix("");
      setKodeSuffix("");
      setFormData((prev) => ({
        ...prev,
        kategori_id: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading('Menyimpan data...');

    const finalFormData = {
        ...formData,
        kode_barang: kodePrefix + kodeSuffix,
    };

    try {
      const response = await fetch('/api/barang', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalFormData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menambah barang baru");
      }
      
      toast.success(data.message || "Barang baru berhasil ditambahkan!", { id: toastId });
      
      const layout = user?.role.toLowerCase().replace(/ /g, '-');
      setTimeout(() => navigate(`/${layout}/data-barang`), 1500);

    } catch (err) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Tambah Barang Baru
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nama Barang*" name="nama_barang" onChange={handleChange} required />
              <Select label="Kategori" name="kategori_id" onChange={handleKategoriChange}>
                {kategoriList.map((kat) => (
                  <Option key={kat.id} value={String(kat.id)}>{kat.nama_kategori}</Option>
                ))}
              </Select>

              <div>
                <label htmlFor="kode_barang_input" className="text-blue-gray-600 text-sm font-medium">Kode Barang*</label>
                <div className="flex items-center w-full border border-blue-gray-200 rounded-lg mt-1">
                    <span className="bg-gray-200 text-gray-700 px-3 py-2 border-r border-blue-gray-200">
                        {kodePrefix || 'KODE '}
                    </span>
                    <input
                        id="kode_barang_input"
                        type="text"
                        className="p-2 w-full focus:outline-none"
                        value={kodeSuffix}
                        onChange={handleKodeSuffixChange}
                        disabled={!formData.kategori_id}
                        required
                    />
                </div>
              </div>
              
              <Input label="Merk" name="merk" onChange={handleChange} />
              <Input label="Tipe" name="tipe" onChange={handleChange} />
              <Input label="Sumber Dana" name="sumber_dana" onChange={handleChange} />
              <Input type="date" label="Tanggal Perolehan*" name="tanggal_perolehan" onChange={handleChange} required />
              <Input type="text" label="Nilai Perolehan (Rp)*" name="nilai_perolehan" value={formatRupiah(formData.nilai_perolehan)} onChange={handleChange} required />
            </div>
            {/* Field Spesifikasi ditambahkan di sini */}
            <Textarea label="Spesifikasi" name="spesifikasi" onChange={handleChange} />
          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate(`/${layout}/data-barang`)} disabled={loading}>
              Batal
            </Button>
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TambahBarang;