import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Tooltip,
  Avatar,
} from "@material-tailwind/react";
import {
  ProfileInfoCard,
  MessageCard,
} from "@/widgets/cards";
import { platformSettingsData, conversationsData, projectsData } from "@/data";
import { useAuth } from "@/hooks/useAuth"; // Impor hook kustom kita
import { useEffect, useState } from "react";

export function Profil() {
  // Gunakan hook untuk mendapatkan data pengguna yang login
  const { user: loggedInUser } = useAuth();
  const [profileData, setProfileData] = useState(null);

  // Efek untuk mengatur data profil saat pengguna sudah didapatkan
  useEffect(() => {
    if (loggedInUser) {
      setProfileData({
        nama: loggedInUser.nama,
        username: loggedInUser.username,
        role: loggedInUser.role,
        // Anda bisa menambahkan data lain di sini jika ada
      });
    }
  }, [loggedInUser]);

  // Tampilkan pesan loading jika data belum siap
  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Typography>Memuat data profil...</Typography>
      </div>
    );
  }

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover	bg-center">
        <div className="absolute inset-0 h-full w-full bg-blue-500/50" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar
                src="/img/bruce-mars.jpeg"
                alt="bruce-mars"
                size="xl"
                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
              />
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-1">
                  {profileData.nama}
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-600"
                >
                  {profileData.role}
                </Typography>
              </div>
            </div>
          </div>
          <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
            <ProfileInfoCard
              title="Informasi Profil"
              description="Informasi dasar mengenai data diri admin yang sedang login pada sistem."
              details={{
                "nama lengkap": profileData.nama,
                username: profileData.username,
                role: profileData.role,
              }}
            />
            {/* Widget lainnya bisa dibiarkan atau disesuaikan nanti */}
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Platform Settings
              </Typography>
              {/* ... (Konten Platform Settings) ... */}
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Conversations
              </Typography>
              {/* ... (Konten Conversations) ... */}
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export default Profil;