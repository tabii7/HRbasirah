const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const db = require("../db");
const { uploadsDir, logoPath } = require("../config/paths");
const { resolveUploadAbsolute } = require("../utils/uploads");

function generateReferenceLetterPdf(request, letterId) {
  const generatedAt = new Date().toISOString();
  const safeStamp = generatedAt.replace(/[:.]/g, "-");
  const fileName = `reference-letter-${request.employeeId}-${safeStamp}.pdf`.replace(/\s+/g, "_");
  const absolutePath = path.join(uploadsDir, fileName);
  const joinedDateText = request.joinedDate ? String(request.joinedDate).slice(0, 10) : "N/A";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const out = fs.createWriteStream(absolutePath);
  doc.pipe(out);

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 50, 40, { fit: [180, 70] });
    } catch (_err) {
      // Ignore image draw errors and continue with text-only PDF.
    }
  }

  doc.moveDown(3);
  doc.fontSize(20).text("Reference Letter", { align: "center" });
  doc.moveDown(0.7);
  doc.fontSize(10).fillColor("#666666").text(`Generated: ${generatedAt}`, { align: "center" }).fillColor("#000000");
  doc.moveDown(1.2);
  doc.fontSize(12).text("To whom it may concern,");
  doc.moveDown(0.8);
  doc
    .fontSize(12)
    .text(
      `This letter is to confirm that ${request.fullName} (Employee ID: ${request.employeeId}) is/was associated with Basirah in the role of ${request.designation || "Employee"}, with joining date ${joinedDateText}.`,
      { lineGap: 3 }
    );
  doc.moveDown(0.8);
  doc
    .fontSize(12)
    .text(
      `This letter is issued upon employee request for the purpose of: ${request.purpose}${request.addressedTo ? `, addressed to ${request.addressedTo}` : ""}.`,
      { lineGap: 3 }
    );
  if (request.details) {
    doc.moveDown(0.8);
    doc.fontSize(12).text(`Additional details: ${request.details}`, { lineGap: 3 });
  }
  doc.moveDown(1.2);
  doc.fontSize(12).text("Please contact HR for any further verification.");

  doc.moveDown(2.4);
  doc.fontSize(12).text("Sincerely,");
  doc.moveDown(1);
  doc.fontSize(12).text("Authorized Signatory (Dummy)");
  doc.moveTo(50, doc.y + 2).lineTo(260, doc.y + 2).strokeColor("#666666").stroke();

  doc.save();
  doc.lineWidth(1.5).strokeColor("#37613b");
  doc.roundedRect(360, doc.y - 36, 180, 65, 6).stroke();
  doc.fontSize(11).fillColor("#37613b").text("OFFICIAL STAMP", 382, doc.y - 15);
  doc.fontSize(9).fillColor("#37613b").text("(DUMMY)", 420, doc.y + 2);
  doc.restore();

  doc.moveDown(2.4);
  doc.fontSize(9).fillColor("#888888").text("This is a system-generated reference letter (dummy template).", { align: "left" });

  doc.end();

  if (request.filePath) {
    const oldPath = resolveUploadAbsolute(request.filePath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare("UPDATE reference_letters SET filePath = ?, generatedAt = ? WHERE id = ?").run(
    `/uploads/${fileName}`,
    generatedAt,
    letterId
  );

  return db.prepare("SELECT * FROM reference_letters WHERE id = ?").get(letterId);
}

module.exports = { generateReferenceLetterPdf };
