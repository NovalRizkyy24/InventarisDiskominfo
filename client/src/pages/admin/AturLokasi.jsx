import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Textarea } from "@material-tailwind/react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { useAuth } from "@/hooks/useAuth"; // Import useAuth hook

// Fix for default icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const SearchControl = (props) => {
  const map = useMap();

  useEffect(() => {
    const searchControl = new GeoSearchControl({
      provider: new OpenStreetMapProvider(),
      ...props,
    });

    map.addControl(searchControl);
    map.on('geosearch/showlocation', (result) => {
      const { x, y } = result.location;
      const latlng = { lat: y, lng: x };
      props.setPosition(latlng);
      map.flyTo(latlng, 15);
    });

    return () => map.removeControl(searchControl);
  }, [map, props]);

  return null;
};


export function AturLokasi() {
  const { id: barangId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info
  
  const [barang, setBarang] = useState(null);
  const [lokasiData, setLokasiData] = useState({
    nama_lokasi: "",
    provinsi: "Jawa Barat",
    kab_kota: "Kota Bandung",
    kecamatan: "",
    kelurahan_desa: "",
    deskripsi: "",
    latitude: null,
    longitude: null,
  });
  const [mapPosition, setMapPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchData = async () => {
      try {
        const barangResponse = await fetch(`/api/barang/${barangId}`, { headers: { Authorization: `Bearer ${token}` } });
        const barangData = await barangResponse.json();
        setBarang(barangData);

        if (barangData.lokasi_id) {
          const lokasiResponse = await fetch(`/api/lokasi/${barangData.lokasi_id}`, { headers: { Authorization: `Bearer ${token}` } });
          const existingLokasiData = await lokasiResponse.json();
          setLokasiData(existingLokasiData);
          if (existingLokasiData.latitude && existingLokasiData.longitude) {
            setMapPosition([existingLokasiData.latitude, existingLokasiData.longitude]);
          }
        } else {
          // Default map position for Bandung
          setMapPosition([-6.9175, 107.6191]);
        }
      } catch (err) {
        setError("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [barangId]);

  const handleChange = (e) => {
    setLokasiData({ ...lokasiData, [e.target.name]: e.target.value });
  };

  const handleMapPositionChange = (latlng) => {
    setMapPosition(latlng);
    setLokasiData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");

    try {
      if (barang.lokasi_id) {
        const response = await fetch(`/api/lokasi/${barang.lokasi_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(lokasiData),
        });
        if (!response.ok) throw new Error("Gagal memperbarui data lokasi.");

      } else {
        const lokasiResponse = await fetch('/api/lokasi', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(lokasiData),
        });
        const newLokasi = await lokasiResponse.json();
        if (!lokasiResponse.ok) throw new Error(newLokasi.message || "Gagal menyimpan data lokasi.");
        
        const updatedBarangData = { ...barang, lokasi_id: newLokasi.lokasi.id };
        const barangResponse = await fetch(`/api/barang/${barangId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedBarangData),
        });
        if (!barangResponse.ok) throw new Error("Gagal memperbarui lokasi pada barang.");
      }
      
      const layout = user?.role.toLowerCase().replace(/ /g, '-');
      navigate(`/${layout}/detail-barang/${barangId}`);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography className="text-center mt-12">Memuat data...</Typography>;
  }
  
  const layout = user?.role.toLowerCase().replace(/ /g, '-');

  return (
    <div className="mt-12 mb-8 flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-6">
          <Typography variant="h6" color="white">
            Atur Lokasi untuk: {barang ? barang.nama_barang : '...'}
          </Typography>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-6">
            {error && <Typography color="red" className="text-center">{error}</Typography>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nama Lokasi/Ruangan*" name="nama_lokasi" value={lokasiData.nama_lokasi || ''} onChange={handleChange} required />
                <Input label="Provinsi" name="provinsi" value={lokasiData.provinsi || ''} onChange={handleChange} />
                <Input label="Kabupaten/Kota" name="kab_kota" value={lokasiData.kab_kota || ''} onChange={handleChange} />
                <Input label="Kecamatan" name="kecamatan" value={lokasiData.kecamatan || ''} onChange={handleChange} />
                <Input label="Kelurahan/Desa" name="kelurahan_desa" value={lokasiData.kelurahan_desa || ''} onChange={handleChange} />
            </div>
            <Textarea label="Deskripsi/Keterangan Tambahan" name="deskripsi" value={lokasiData.deskripsi || ''} onChange={handleChange} />
            
            <div className="h-96 w-full">
              <MapContainer center={mapPosition || [-6.9175, 107.6191]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={mapPosition} setPosition={handleMapPositionChange} />
                <SearchControl setPosition={handleMapPositionChange} />
              </MapContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Latitude" name="latitude" value={lokasiData.latitude || ''} readOnly />
              <Input label="Longitude" name="longitude" value={lokasiData.longitude || ''} readOnly />
            </div>

          </CardBody>
          <CardFooter className="pt-0 p-6 flex justify-end gap-2">
            <Button variant="text" color="blue-gray" onClick={() => navigate(`/${layout}/detail-barang/${barangId}`)}>Batal</Button>
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Lokasi'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default AturLokasi;