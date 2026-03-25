import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ReportLokasiData {
  workLocationName: string;
  workLocationAddress: string;
  kegiatan: string;
  panjang: number;
  lebar: number;
}

export interface ReportPdfData {
  title: string;
  content: string;
  reportDate: string;
  userName: string;
  teamName?: string;
  weekNumber?: number;
  deskripsiKegiatan?: string;
  kondisiCuaca?: string;
  waktuMulai?: string;
  waktuSelesai?: string;
  peralatanCangkul?: number;
  peralatanParang?: number;
  peralatanPes?: number;
  peralatanLori?: number;
  peralatanCatut?: number;
  peralatanPalu?: number;
  peralatanGarpu?: number;
  tenagaPengawas?: number;
  tenagaPekerja?: number;
  tenagaKorlap?: number;
  lokasi?: ReportLokasiData[];
  photos: { url: string; secureUrl?: string; order: number; label?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface PdfSettings {
  logo?: { filePath: string | null };
  signature_1?: { name: string | null; title: string | null; filePath: string | null };
  signature_2?: { name: string | null; title: string | null; filePath: string | null };
  signature_3?: { name: string | null; title: string | null; filePath: string | null };
  signature_4?: { name: string | null; title: string | null; filePath: string | null };
}

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadSettings(): Promise<PdfSettings> {
    const rows = await this.prisma.pdfSetting.findMany({
      include: { file: true },
    });

    const settings: PdfSettings = {};
    for (const row of rows) {
      const filePath = row.file?.url ? this.resolvePhotoPath(row.file.url) : null;
      if (row.key === 'logo') {
        settings.logo = { filePath };
      } else if (
        row.key === 'signature_1' ||
        row.key === 'signature_2' ||
        row.key === 'signature_3' ||
        row.key === 'signature_4'
      ) {
        settings[row.key] = {
          name: row.name,
          title: row.title,
          filePath,
        };
      }
    }
    return settings;
  }

  async generateReport(report: ReportPdfData): Promise<PDFKit.PDFDocument> {
    const settings = await this.loadSettings();

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // === PAGE 1: LAPORAN KINERJA ===
    this.drawHeader(doc, pageWidth, settings);
    this.drawTitle(doc, pageWidth, report);
    this.drawMeta(doc, report, pageWidth);
    this.drawSectionA_Lokasi(doc, report, pageWidth);
    this.drawSectionB_Peralatan(doc, report, pageWidth);
    this.drawSectionC_TenagaKerja(doc, report, pageWidth);
    this.drawSectionD_WaktuKerja(doc, report, pageWidth);
    this.drawSectionE_Cuaca(doc, report, pageWidth);
    this.drawSignatures(doc, pageWidth, settings);

    // === PAGE 2: LAMPIRAN PROGRESS ===
    doc.addPage();
    this.drawHeader(doc, pageWidth, settings);
    this.drawPage2Content(doc, report, pageWidth);

    doc.end();
    return doc;
  }

  // ==================== PAGE 1 ====================

  private drawTitle(doc: PDFKit.PDFDocument, pageWidth: number, report: ReportPdfData) {
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('LAPORAN KINERJA', doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'center',
      });

    const teamName = report.teamName || report.title || 'Tim Pendamping Masyarakat';
    doc.text(teamName.toUpperCase(), doc.page.margins.left, doc.y, {
      width: pageWidth,
      align: 'center',
    });

    doc.moveDown(1);
  }

  private drawMeta(doc: PDFKit.PDFDocument, report: ReportPdfData, pageWidth: number) {
    doc.font('Helvetica-Bold').fontSize(10);

    // Minggu ke & Tanggal
    const weekText = report.weekNumber ? `MINGGU KE : ${report.weekNumber}` : 'MINGGU KE :';
    doc.text(weekText, doc.page.margins.left, doc.y);

    const formattedDate = this.formatDate(report.reportDate);
    doc.text(`Pelaksanaan pada Tanggal : ${formattedDate}`, doc.page.margins.left, doc.y);

    doc.moveDown(0.5);

    // Content paragraph (from report.content field)
    if (report.content) {
      doc.font('Helvetica').fontSize(9);
      doc.text(this.stripHtml(report.content), doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'justify',
      });
    }

    doc.moveDown(0.3);
  }

  private drawSectionA_Lokasi(
    doc: PDFKit.PDFDocument,
    report: ReportPdfData,
    pageWidth: number,
  ) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('A. LOKASI', doc.page.margins.left, doc.y);
    doc.moveDown(0.3);

    const headers = ['NO', 'KEGIATAN', 'LOKASI PEKERJAAN', 'PANJANG\n(m)', 'Lebar\n(m)'];
    const colWidths = [30, 130, pageWidth - 260, 50, 50];

    const lokasi = report.lokasi || [];
    const rows = lokasi.length > 0
      ? lokasi.map((l, i) => [
          String(i + 1),
          l.kegiatan,
          `${l.workLocationName}${l.workLocationAddress ? ', ' + l.workLocationAddress : ''}`,
          String(l.panjang),
          String(l.lebar),
        ])
      : [['1', '-', '-', '-', '-']];

    this.drawTable(doc, doc.page.margins.left, doc.y, headers, rows, colWidths);
  }

  private drawSectionB_Peralatan(
    doc: PDFKit.PDFDocument,
    report: ReportPdfData,
    pageWidth: number,
  ) {
    // B and C side by side
    const halfWidth = (pageWidth - 20) / 2;
    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + halfWidth + 20;
    const startY = doc.y;

    // === LEFT: B. PERALATAN ===
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('B. PERALATAN', leftX, startY);

    const bHeaders = ['NO', 'NAMA ALAT', 'JUMLAH PERALATAN'];
    const bColWidths = [25, 80, halfWidth - 105];
    const bRows = [
      ['1', 'Cangkul', `${report.peralatanCangkul || 0} Buah`],
      ['2', 'Parang', `${report.peralatanParang || 0} Buah`],
      ['3', 'Pes', `${report.peralatanPes || 0} Buah`],
      ['4', 'Lori', `${report.peralatanLori || 0} Buah`],
      ['5', 'Catut', `${report.peralatanCatut || 0} Buah`],
      ['6', 'Palu', `${report.peralatanPalu || 0} Buah`],
      ['7', 'Garpu', `${report.peralatanGarpu || 0} Buah`],
    ];

    const bTableY = doc.y + 2;
    this.drawTable(doc, leftX, bTableY, bHeaders, bRows, bColWidths);
    const bEndY = doc.y;

    // === RIGHT: C. TENAGA KERJA ===
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('C. TENAGA KERJA', rightX, startY);

    const cHeaders = ['NO', 'TENAGA KERJA', 'JUMLAH PEKERJA'];
    const cColWidths = [25, 80, halfWidth - 105];
    const cRows = [
      ['1', 'Pengawas', `${report.tenagaPengawas || 0} Orang`],
      ['2', 'Pekerja', `${report.tenagaPekerja || 0} Orang`],
      ['3', 'Korlap', `${report.tenagaKorlap || 0} Orang`],
    ];

    this.drawTable(doc, rightX, bTableY, cHeaders, cRows, cColWidths);
    const cEndY = doc.y;

    // E. KONDISI CUACA (right side, below C)
    const cuacaStartY = cEndY + 5;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('E. KONDISI CUACA', rightX, cuacaStartY);

    const eHeaders = ['KETERANGAN'];
    const eColWidths = [halfWidth];
    const eRows = [[report.kondisiCuaca || 'Cuaca Cerah']];
    this.drawTable(doc, rightX, doc.y + 2, eHeaders, eRows, eColWidths);
    const eEndY = doc.y;

    // Move Y below whichever is taller
    doc.y = Math.max(bEndY, eEndY) + 5;
  }

  private drawSectionC_TenagaKerja(
    _doc: PDFKit.PDFDocument,
    _report: ReportPdfData,
    _pageWidth: number,
  ) {
    // Already drawn in drawSectionB_Peralatan (side by side)
  }

  private drawSectionD_WaktuKerja(
    doc: PDFKit.PDFDocument,
    report: ReportPdfData,
    _pageWidth: number,
  ) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('D. WAKTU KERJA', doc.page.margins.left, doc.y);

    const dHeaders = ['WAKTU', 'JAM'];
    const dColWidths = [120, 100];
    const dRows = [
      ['MULAI', report.waktuMulai || '08.00'],
      ['SELESAI', report.waktuSelesai || '15.00'],
    ];

    this.drawTable(doc, doc.page.margins.left, doc.y + 2, dHeaders, dRows, dColWidths);
    doc.moveDown(0.3);
  }

  private drawSectionE_Cuaca(
    _doc: PDFKit.PDFDocument,
    _report: ReportPdfData,
    _pageWidth: number,
  ) {
    // Already drawn in drawSectionB_Peralatan (right side)
  }

  // ==================== PAGE 2 ====================

  private drawPage2Content(
    doc: PDFKit.PDFDocument,
    report: ReportPdfData,
    pageWidth: number,
  ) {
    const teamName = report.teamName || report.title || 'Tim Pendamping Masyarakat';

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('LAMPIRAN PROGRESS', doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'center',
      });
    doc.text(`FOTO KINERJA ${teamName.toUpperCase()}`, doc.page.margins.left, doc.y, {
      width: pageWidth,
      align: 'center',
    });

    doc.moveDown(0.5);

    // Description paragraph
    if (report.deskripsiKegiatan) {
      doc.font('Helvetica').fontSize(9);
      doc.text(report.deskripsiKegiatan, doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'justify',
      });
      doc.moveDown(0.5);
    }

    // DOKUMENTASI LAPANGAN — 6 photos (2 cols × 3 rows)
    this.drawPhotoSection(doc, report, pageWidth, 'DOKUMENTASI LAPANGAN', [
      { label: 'Progress 0%', labelFilter: 'Progress 0%' },
      { label: 'Progress 0%', labelFilter: 'Progress 0%' },
      { label: 'Progress 50%', labelFilter: 'Progress 50%' },
      { label: 'Progress 50%', labelFilter: 'Progress 50%' },
      { label: 'Progress 100%', labelFilter: 'Progress 100%' },
      { label: 'Progress 100%', labelFilter: 'Progress 100%' },
    ]);

    // DOKUMENTASI ABSEN — 2 photos
    this.drawPhotoSection(doc, report, pageWidth, 'DOKUMENTASI ABSEN', [
      { label: 'Absen Datang', labelFilter: 'Absen Datang' },
      { label: 'Absen Pulang', labelFilter: 'Absen Pulang' },
    ]);
  }

  private drawPhotoSection(
    doc: PDFKit.PDFDocument,
    report: ReportPdfData,
    pageWidth: number,
    sectionTitle: string,
    slots: { label: string; labelFilter: string }[],
  ) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(sectionTitle, doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'center',
      });
    doc.moveDown(0.3);

    const cols = 2;
    const gap = 10;
    const imgWidth = (pageWidth - gap * (cols - 1)) / cols;
    const imgHeight = imgWidth * 0.45;
    const photos = report.photos || [];

    // Match photos by label (consume each match once)
    const usedPhotoIds = new Set<number>();

    for (let i = 0; i < slots.length; i += cols) {
      if (doc.y + imgHeight + 40 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      const rowY = doc.y;
      for (let j = 0; j < cols && i + j < slots.length; j++) {
        const slot = slots[i + j];
        const x = doc.page.margins.left + j * (imgWidth + gap);

        // Find matching photo by label
        const photoIdx = photos.findIndex(
          (p, idx) => !usedPhotoIds.has(idx) && p.label === slot.labelFilter,
        );
        const photo = photoIdx >= 0 ? photos[photoIdx] : null;
        if (photoIdx >= 0) usedPhotoIds.add(photoIdx);

        if (photo) {
          const photoPath = this.resolvePhotoPath(photo.url);
          if (photoPath && fs.existsSync(photoPath)) {
            try {
              doc.image(photoPath, x, rowY, {
                fit: [imgWidth, imgHeight],
                align: 'center',
                valign: 'center',
              });
            } catch {
              this.drawImagePlaceholder(doc, x, rowY, imgWidth, imgHeight, slot.label);
            }
          } else {
            this.drawImagePlaceholder(doc, x, rowY, imgWidth, imgHeight, slot.label);
          }
        } else {
          this.drawImagePlaceholder(doc, x, rowY, imgWidth, imgHeight, slot.label);
        }

        // Label below photo
        doc
          .font('Helvetica')
          .fontSize(8)
          .text(slot.label, x, rowY + imgHeight + 2, { width: imgWidth, align: 'center' });
      }

      doc.y = rowY + imgHeight + 14;
    }

    doc.moveDown(0.3);
  }

  // ==================== SHARED ====================

  private drawHeader(doc: PDFKit.PDFDocument, pageWidth: number, settings: PdfSettings) {
    const startY = doc.y;

    const dbLogoPath = settings.logo?.filePath;
    const assetLogoPath = path.join(process.cwd(), 'assets', 'logo-palembang.png');
    const logoPath =
      dbLogoPath && fs.existsSync(dbLogoPath)
        ? dbLogoPath
        : fs.existsSync(assetLogoPath)
          ? assetLogoPath
          : null;

    const logoMaxWidth = 85;
    const logoMaxHeight = 85;
    if (logoPath) {
      doc.image(logoPath, doc.page.margins.left, startY, {
        fit: [logoMaxWidth, logoMaxHeight],
        align: 'center',
        valign: 'center',
      });
    } else {
      const cx = doc.page.margins.left + 42;
      const cy = startY + 42;
      doc.circle(cx, cy, 38).lineWidth(1.5).stroke();
      doc.font('Helvetica-Bold').fontSize(7).text('LOGO', cx - 14, cy - 5, { width: 28, align: 'center' });
    }

    const textX = doc.page.margins.left + 95;
    const textWidth = pageWidth - 95;

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('DINAS PEKERJAAN UMUM DAN PENATAAN RUANG', textX, startY + 5, {
        width: textWidth,
        align: 'center',
      });

    doc.fontSize(13).text('PEMERINTAH KOTA PALEMBANG', textX, doc.y + 2, {
      width: textWidth,
      align: 'center',
    });

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Jalan Slamet Riady No. 213 Kelurahan Lawang Kidul, Kec. Ilir Timur II',
        textX,
        doc.y + 4,
        { width: textWidth, align: 'center' },
      );

    doc.text('Kota Palembang Provinsi Sumatera Selatan', textX, doc.y, {
      width: textWidth,
      align: 'center',
    });

    doc.text('Telp. 0711-710033, 0711-710305 / Fax. 0711-710033', textX, doc.y, {
      width: textWidth,
      align: 'center',
    });

    const textBottomY = doc.y;
    const logoBottomY = startY + logoMaxHeight;
    const lineY = Math.max(textBottomY, logoBottomY) + 6;
    doc
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.margins.left + pageWidth, lineY)
      .lineWidth(2.5)
      .stroke();

    doc
      .moveTo(doc.page.margins.left, lineY + 3.5)
      .lineTo(doc.page.margins.left + pageWidth, lineY + 3.5)
      .lineWidth(0.5)
      .stroke();

    doc.y = lineY + 15;
  }

  private drawSignatures(
    doc: PDFKit.PDFDocument,
    pageWidth: number,
    settings: PdfSettings,
  ) {
    if (doc.y + 180 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }

    const colWidth = pageWidth / 2;
    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + colWidth;
    const startY = doc.y + 10;

    const sig1 = settings.signature_1 || { name: null, title: 'Pengawas OP Sungai', filePath: null };
    const sig2 = settings.signature_2 || { name: null, title: 'Monev Teknis OP Sungai', filePath: null };
    const sig3 = settings.signature_3 || { name: null, title: 'Koordinator Lapangan OP Sungai', filePath: null };
    const sig4 = settings.signature_4 || { name: null, title: 'Koordinator Lapangan ASN', filePath: null };

    doc.font('Helvetica').fontSize(9);

    // Row 1: Diperiksa Oleh | Dibuat Oleh
    doc.text('Diperiksa Oleh,', leftX, startY, { width: colWidth, align: 'center' });
    doc.text(sig1.title || 'Pengawas OP Sungai', leftX, doc.y, { width: colWidth, align: 'center' });

    doc.text('Dibuat Oleh,', rightX, startY, { width: colWidth, align: 'center' });
    doc.text(sig2.title || 'Monev Teknis OP Sungai', rightX, startY + 13, {
      width: colWidth,
      align: 'center',
    });

    const sigImgY = startY + 32;
    const sigImgSize = 40;

    this.drawSignatureImage(doc, sig1.filePath, leftX, sigImgY, colWidth, sigImgSize);
    this.drawSignatureImage(doc, sig2.filePath, rightX, sigImgY, colWidth, sigImgSize);

    const nameY = startY + 78;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(sig1.name || '_____________________', leftX, nameY, { width: colWidth, align: 'center' });
    doc.text(sig2.name || '_____________________', rightX, nameY, { width: colWidth, align: 'center' });

    // Row 2: Disetujui oleh | Mengetahui
    const row2Y = nameY + 25;
    doc.font('Helvetica').fontSize(9);

    doc.text('Disetujui oleh :', leftX, row2Y, { width: colWidth, align: 'center' });
    doc.text(sig3.title || 'Koordinator Lapangan OP Sungai', leftX, doc.y, { width: colWidth, align: 'center' });

    doc.text('Mengetahui :', rightX, row2Y, { width: colWidth, align: 'center' });
    doc.text(sig4.title || 'Koordinator Lapangan ASN', rightX, row2Y + 13, {
      width: colWidth,
      align: 'center',
    });

    const sigImgY2 = row2Y + 32;
    this.drawSignatureImage(doc, sig3.filePath, leftX, sigImgY2, colWidth, sigImgSize);
    this.drawSignatureImage(doc, sig4.filePath, rightX, sigImgY2, colWidth, sigImgSize);

    const nameY2 = row2Y + 78;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(sig3.name || '_____________________', leftX, nameY2, { width: colWidth, align: 'center' });
    doc.text(sig4.name || '_____________________', rightX, nameY2, { width: colWidth, align: 'center' });
  }

  // ==================== TABLE HELPER ====================

  private drawTable(
    doc: PDFKit.PDFDocument,
    startX: number,
    startY: number,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ) {
    const headerHeight = 22;
    const fontSize = 8;
    const padding = 4;

    doc.lineWidth(0.5);

    // Draw header row
    let x = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(x, startY, colWidths[i], headerHeight).stroke();
      doc
        .font('Helvetica-Bold')
        .fontSize(fontSize)
        .text(headers[i], x + padding, startY + 4, {
          width: colWidths[i] - padding * 2,
          align: 'center',
        });
      x += colWidths[i];
    }

    // Draw data rows
    let currentY = startY + headerHeight;
    for (const row of rows) {
      // Calculate row height
      let maxHeight = 18;
      for (let i = 0; i < row.length; i++) {
        const h = doc.heightOfString(row[i] || '', {
          width: colWidths[i] - padding * 2,
        });
        maxHeight = Math.max(maxHeight, h + 10);
      }

      // Check page break
      if (currentY + maxHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }

      x = startX;
      for (let i = 0; i < row.length; i++) {
        doc.rect(x, currentY, colWidths[i], maxHeight).stroke();
        doc
          .font('Helvetica')
          .fontSize(fontSize)
          .text(row[i] || '', x + padding, currentY + 5, {
            width: colWidths[i] - padding * 2,
            align: i === 0 ? 'center' : 'left',
          });
        x += colWidths[i];
      }

      currentY += maxHeight;
    }

    doc.y = currentY + 8;
  }

  // ==================== UTILITIES ====================

  private drawImagePlaceholder(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
  ) {
    doc.rect(x, y, width, height).stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(label, x, y + height / 2 - 5, { width, align: 'center' });
  }

  private drawSignatureImage(
    doc: PDFKit.PDFDocument,
    filePath: string | null,
    x: number,
    y: number,
    colWidth: number,
    size: number,
  ) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        const imgX = x + (colWidth - size) / 2;
        doc.image(filePath, imgX, y, { width: size, height: size, fit: [size, size] });
      } catch {
        // Ignore failed signature image
      }
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private formatDate(dateStr: string): string {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private resolvePhotoPath(url: string): string | null {
    if (!url) return null;
    const relativePath = url.startsWith('/') ? url.substring(1) : url;
    return path.join(process.cwd(), relativePath);
  }
}
