const pool = require('../config/db');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const ExcelJS = require('exceljs');

const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, ImageRun } = docx;

const imageToBase64 = (filePath) => {
    const imgPath = path.resolve(__dirname, '../..', 'client/public/img', filePath);
    if (fs.existsSync(imgPath)) {
        const file = fs.readFileSync(imgPath);
        return `data:image/png;base64,${Buffer.from(file).toString('base64')}`;
    }
    console.error(`File logo tidak ditemukan di: ${imgPath}`);
    return '';
};

const generateLaporanDaftarBarang = async (req, res) => {
    const { status, kategori_id, tanggal_mulai, tanggal_akhir } = req.query;
    try {
        let queryText = `
            SELECT 
                b.kode_barang, b.nama_barang, k.nama_kategori, b.merk, b.tipe,
                b.tanggal_perolehan, b.nilai_perolehan, b.status, l.nama_lokasi
            FROM barang b
            LEFT JOIN kategori_barang k ON b.kategori_id = k.id
            LEFT JOIN lokasi l ON b.lokasi_id = l.id
            WHERE 1=1
        `;
        const queryParams = [];
        if (status) { queryParams.push(status); queryText += ` AND b.status = $${queryParams.length}`; }
        if (kategori_id) { queryParams.push(kategori_id); queryText += ` AND b.kategori_id = $${queryParams.length}`; }
        if (tanggal_mulai && tanggal_akhir) {
            queryParams.push(tanggal_mulai, tanggal_akhir);
            queryText += ` AND b.tanggal_perolehan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
        }
        queryText += ' ORDER BY b.tanggal_perolehan ASC;';
        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error saat membuat laporan daftar barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const generateLaporanPeminjaman = async (req, res) => {
    const { status, jenis, tanggal_mulai, tanggal_akhir } = req.query;
    try {
        let queryText = `
            SELECT 
                p.nomor_usulan, p.tanggal_pengajuan, p.tanggal_mulai_pinjam, p.tanggal_rencana_kembali,
                p.tanggal_aktual_kembali, p.jenis, p.status, u.nama AS nama_peminjam,
                (SELECT STRING_AGG(b.nama_barang, ', ') FROM peminjaman_detail pd JOIN barang b ON pd.barang_id = b.id WHERE pd.peminjaman_id = p.id) as nama_barang
            FROM peminjaman p JOIN users u ON p.user_peminjam_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        if (status && status !== 'Semua') { queryParams.push(status); queryText += ` AND p.status = $${queryParams.length}`; }
        if (jenis && jenis !== 'Semua') { queryParams.push(jenis); queryText += ` AND p.jenis = $${queryParams.length}`; }
        if (tanggal_mulai && tanggal_akhir) {
            queryParams.push(tanggal_mulai, tanggal_akhir);
            queryText += ` AND p.tanggal_pengajuan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
        }
        queryText += ' ORDER BY p.tanggal_pengajuan DESC;';
        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error saat membuat laporan peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const generateLaporanPenghapusan = async (req, res) => {
    const { status, tanggal_mulai, tanggal_akhir } = req.query;
    try {
        let queryText = `
            SELECT 
                pn.nomor_usulan, pn.tanggal_pengajuan, b.nama_barang, b.kode_barang,
                u.nama AS nama_pengusul, pn.alasan_penghapusan, pn.status
            FROM penghapusan pn
            JOIN barang b ON pn.barang_id = b.id
            JOIN users u ON pn.user_pengusul_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        if (status && status !== 'Semua') { queryParams.push(status); queryText += ` AND pn.status = $${queryParams.length}`; }
        if (tanggal_mulai && tanggal_akhir) {
            queryParams.push(tanggal_mulai, tanggal_akhir);
            queryText += ` AND pn.tanggal_pengajuan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
        }
        queryText += ' ORDER BY pn.tanggal_pengajuan DESC;';
        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error saat membuat laporan penghapusan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const generateLaporanPengadaan = async (req, res) => {
    const { status, tanggal_mulai, tanggal_akhir } = req.query;
    try {
        let queryText = `
            SELECT 
                rp.nomor_usulan, rp.tanggal_usulan, rp.program,
                u.nama AS nama_pengusul, rp.status
            FROM rencana_pengadaan rp
            JOIN users u ON rp.user_pengusul_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        if (status && status !== 'Semua') { queryParams.push(status); queryText += ` AND rp.status = $${queryParams.length}`; }
        if (tanggal_mulai && tanggal_akhir) {
            queryParams.push(tanggal_mulai, tanggal_akhir);
            queryText += ` AND rp.tanggal_usulan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
        }
        queryText += ' ORDER BY rp.tanggal_usulan DESC;';
        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error saat membuat laporan pengadaan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const exportLaporan = async (req, res) => {
    const { title, headers, data, format } = req.body;

    const today = new Date();
    const longDate = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fileDate = today.toISOString().split('T')[0];

    const reportType = title.toLowerCase().replace('laporan ', '').replace(/ /g, '_');
    const reportFileName = `laporan_${reportType}_${fileDate}.${format}`;

    const headerToDataKeyMap = {
        "Kode Barang": "kode_barang",
        "Nama Barang": "nama_barang",
        "Kategori": "nama_kategori",
        "Merk/Tipe": (row) => `${row.merk || ''} / ${row.tipe || ''}`,
        "Tanggal Perolehan": (row) => row.tanggal_perolehan ? new Date(row.tanggal_perolehan).toLocaleDateString('id-ID') : '-',
        "Nilai": (row) => `Rp ${Number(row.nilai_perolehan || 0).toLocaleString('id-ID')}`,
        "Status": "status",
        "Lokasi": "nama_lokasi",
        "No. Usulan": "nomor_usulan",
        "Tanggal Pengajuan": (row) => row.tanggal_pengajuan ? new Date(row.tanggal_pengajuan).toLocaleDateString('id-ID') : '-',
        "Peminjam": "nama_peminjam",
        "Jenis": "jenis",
        "Tanggal Pinjam": (row) => row.tanggal_mulai_pinjam ? new Date(row.tanggal_mulai_pinjam).toLocaleDateString('id-ID') : '-',
        "Tanggal Kembali": (row) => row.tanggal_aktual_kembali ? new Date(row.tanggal_aktual_kembali).toLocaleDateString('id-ID') : '-',
        "Pengusul": "nama_pengusul",
        "Alasan": "alasan_penghapusan",
        "Tanggal Usulan": (row) => row.tanggal_usulan ? new Date(row.tanggal_usulan).toLocaleDateString('id-ID') : '-',
        "Program": "program"
    };

    try {
        if (format === 'pdf') {
            const logoBase64 = imageToBase64('Logo Kota Bandung.png');
            const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
            const tableRows = data.map(row => `
                <tr>
                    ${headers.map(header => {
                        const keyOrFn = headerToDataKeyMap[header];
                        let cellData = '';
                        if (typeof keyOrFn === 'function') {
                            cellData = keyOrFn(row);
                        } else if (keyOrFn) {
                            cellData = row[keyOrFn] || '';
                        }
                        return `<td>${cellData}</td>`;
                    }).join('')}
                </tr>
            `).join('');

            const htmlContent = `
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 2cm; }
                            .header-container { display: flex; align-items: center; justify-content: center; border-bottom: 3px solid black; padding-bottom: 15px; margin-bottom: 10px; }
                            .logo { width: 100px; height: auto; margin-right: 20px; }
                            .header-text { text-align: center; flex-grow: 1; }
                            h3 { margin: 0; font-size: 24px; font-weight: bold; }
                            h4 { margin: 0; font-size: 22px; font-weight: bold; }
                            p.address { margin: 5px 0 0 0; font-size: 12px; }
                            h1 { text-align: center; margin-bottom: 5px; font-size: 20px; }
                            p.report-date { text-align: center; font-size: 12px; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; font-size: 10px; }
                            th, td { border: 1px solid black; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                        </style>
                    </head>
                    <body>
                        <div class="header-container">
                            <img src="${logoBase64}" alt="Logo" class="logo" />
                            <div class="header-text">
                                <h3>PEMERINTAH KOTA BANDUNG</h3>
                                <h4>DINAS KOMUNIKASI DAN INFORMATIKA</h4>
                                <p class="address">Jl. Wastukencana No.2, Babakan Ciamis, Kota Bandung, Jawa Barat 40117</p>
                            </div>
                        </div>
                        <h1>${title}</h1>
                        <p class="report-date">Dicetak pada: ${longDate}</p>
                        <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
                    </body>
                </html>
            `;

            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, landscape: true });
            await browser.close();
            res.set({ 
                'Content-Type': 'application/pdf', 
                'Content-Length': pdfBuffer.length, 
                'Content-Disposition': `attachment; filename="${reportFileName}"` 
            });
            res.send(pdfBuffer);

        } else if (format === 'docx') {
            const logoPath = path.resolve(__dirname, '../..', 'client/public/img', 'Logo Kota Bandung.png');
            const logoBuffer = fs.readFileSync(logoPath);
            
            const headerRow = new TableRow({
                children: headers.map(header => new TableCell({
                    width: { size: 2250, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                })),
            });

            const dataRows = data.map(row => {
                const cells = headers.map(header => {
                    const keyOrFn = headerToDataKeyMap[header];
                    let cellText = '';
                    if (typeof keyOrFn === 'function') {
                        cellText = keyOrFn(row);
                    } else if (keyOrFn) {
                        cellText = String(row[keyOrFn] || '');
                    }
                    return new TableCell({
                        width: { size: 2250, type: WidthType.DXA },
                        children: [new Paragraph(cellText)],
                    });
                });
                return new TableRow({ children: cells });
            });

            const table = new Table({
                rows: [headerRow, ...dataRows],
                width: { size: 9000, type: WidthType.DXA },
            });

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: logoBuffer,
                                    transformation: { width: 100, height: 100 },
                                }),
                                new TextRun({ text: "\tPEMERINTAH KOTA BANDUNG", bold: true, size: 44 }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: "DINAS KOMUNIKASI DAN INFORMATIKA", bold: true, size: 40, alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: "Jl. Wastukencana No.2, Babakan Ciamis, Kota Bandung, Jawa Barat 40117", size: 24, alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: "\n" }),
                        new Paragraph({
                            children: [new TextRun({ text: title, bold: true, size: 32 })],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ 
                            children: [new TextRun({ text: `Dicetak pada: ${longDate}`, size: 24, italics: true })], 
                            alignment: AlignmentType.CENTER 
                        }),
                        new Paragraph({ text: "\n" }),
                        table,
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            res.set('Content-Disposition', `attachment; filename="${reportFileName}"`);
            res.send(buffer);

        } else if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan');

            worksheet.addRow([title]).font = { bold: true, size: 16 };
            worksheet.addRow([`Dicetak pada: ${longDate}`]).font = { italics: true };
            worksheet.addRow([]); 

            worksheet.columns = headers.map(header => ({
                header: header,
                key: header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'),
                width: 25
            }));

            const excelData = data.map(row => {
                const newRow = {};
                headers.forEach(header => {
                    const key = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
                    const keyOrFn = headerToDataKeyMap[header];
                    if (typeof keyOrFn === 'function') {
                        newRow[key] = keyOrFn(row);
                    } else if (keyOrFn) {
                        newRow[key] = row[keyOrFn] || '';
                    }
                });
                return newRow;
            });

            worksheet.addRows(excelData);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`);
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);
        } else {
            res.status(400).json({ message: 'Format tidak didukung' });
        }

    } catch (error) {
        console.error('Error saat ekspor laporan:', error);
        res.status(500).json({ message: `Gagal mengekspor laporan ke ${format.toUpperCase()}.` });
    }
};

module.exports = {
    generateLaporanDaftarBarang,
    generateLaporanPeminjaman,
    generateLaporanPenghapusan,
    generateLaporanPengadaan,
    exportLaporan
};