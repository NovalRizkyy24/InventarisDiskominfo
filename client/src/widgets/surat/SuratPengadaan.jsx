import React from "react";
import { Typography } from "@material-tailwind/react";

// Komponen ini menerima data surat sebagai props
export const SuratPengadaan = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    return (
        // 'ref' ini penting untuk library pencetakan
        <div ref={ref} className="p-8 bg-white text-black">
            {/* KOP SURAT */}
            <div className="text-center border-b-4 border-black pb-2 mb-4">
                <Typography variant="h4">PEMERINTAH KOTA BANDUNG</Typography>
                <Typography variant="h5">DINAS KOMUNIKASI DAN INFORMATIKA</Typography>
                <Typography variant="small">Jl. Wastukencana No.2, Babakan Ciamis, Bandung</Typography>
            </div>

            {/* NOMOR & TANGGAL SURAT */}
            <Typography className="text-right mb-4">Bandung, {new Date(data.tanggal_usulan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</Typography>
            <Typography>Nomor: {data.nomor_usulan}</Typography>
            <Typography>Perihal: Usulan Rencana Pengadaan Barang</Typography>
            <br/>

            {/* ISI SURAT */}
            <Typography className="mb-4">Dengan hormat,</Typography>
            <Typography className="mb-4 text-justify">
                Berdasarkan program kerja yang telah ditetapkan, bersama ini kami sampaikan usulan rencana pengadaan barang untuk kegiatan <strong>{data.kegiatan}</strong> dengan rincian sebagai berikut:
            </Typography>

            {/* TABEL BARANG */}
            <table className="w-full min-w-max table-auto text-left border border-black">
                <thead>
                    <tr>
                        <th className="border border-black p-2"><Typography>No</Typography></th>
                        <th className="border border-black p-2"><Typography>Nama Barang</Typography></th>
                        <th className="border border-black p-2"><Typography>Jumlah</Typography></th>
                        <th className="border border-black p-2"><Typography>Harga Satuan</Typography></th>
                        <th className="border border-black p-2"><Typography>Total</Typography></th>
                    </tr>
                </thead>
                <tbody>
                    {data.details.map((item, index) => (
                        <tr key={item.id}>
                            <td className="border border-black p-2">{index + 1}</td>
                            <td className="border border-black p-2">{item.nama_barang_usulan}</td>
                            <td className="border border-black p-2">{item.jumlah} {item.satuan}</td>
                            <td className="border border-black p-2">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                            <td className="border border-black p-2">Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <br/>
            <Typography>Demikian usulan ini kami sampaikan. Atas perhatian dan persetujuannya, kami ucapkan terima kasih.</Typography>
            <br/><br/>

            {/* TANDA TANGAN */}
            <div className="flex justify-between">
                <div>
                    <Typography>Mengetahui,</Typography>
                    <Typography>PPK</Typography>
                    <br/><br/><br/>
                    <Typography className="font-bold">{data.nama_ppk || '(Nama PPK)'}</Typography>
                </div>
                <div className="text-center">
                    <Typography>Hormat kami,</Typography>
                    <Typography>Pengusul</Typography>
                    <br/><br/><br/>
                    <Typography className="font-bold">{data.nama_pengusul}</Typography>
                </div>
            </div>
        </div>
    );
});

export default SuratPengadaan;