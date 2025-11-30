//Aun no esta implentado

import * as fs from "fs";
import PDFDocument = require("pdfkit");

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface DisabilityCertificateData {
  firstName?: string;
  lastName?: string;
  documentId?: string;
  phoneNumber?: string;

  disabilityType?: string;
  disabilityPercentage?: number;
  disabilityDescription?: string;

  mobilityAids?: string[];
  specialNeeds?: string;

  emergencyContact?: EmergencyContact;

  metadata?: {
    issuedAt?: string;
    issuer?: string;
  };
}

export class DisabilityPdfGenerator {
  /**
   * Genera el PDF y lo guarda en un archivo
   */
  static async generatePdf(
    data: DisabilityCertificateData,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // ==== Helpers ====
      const writeField = (label: string, value?: string) => {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`${label}: `, { continued: true })
          .font("Helvetica")
          .text(value || "No especificado")
          .moveDown(0.3);
      };

      const fullName = [data.firstName, data.lastName]
        .filter(Boolean)
        .join(" ");

      // ==== Title ====
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("CERTIFICADO DE DISCAPACIDAD", { align: "center" })
        .moveDown(1);

      // ==== Datos personales ====
      doc.fontSize(14).font("Helvetica-Bold").text("Datos personales").moveDown(0.5);

      writeField("Nombre completo", fullName);
      writeField("Documento ID", data.documentId);
      writeField("Teléfono", data.phoneNumber);

      // ==== Discapacidad ====
      doc.moveDown();
      doc.fontSize(14).font("Helvetica-Bold").text("Información de discapacidad").moveDown(0.5);

      writeField("Tipo de discapacidad", data.disabilityType);
      writeField(
        "Porcentaje de discapacidad",
        data.disabilityPercentage != null ? `${data.disabilityPercentage}%` : undefined
      );
      writeField("Descripción", data.disabilityDescription);

      // ==== Ayudas y necesidades ====
      doc.moveDown();
      doc.fontSize(14).font("Helvetica-Bold").text("Ayudas y necesidades").moveDown(0.5);

      const aidsText =
        Array.isArray(data.mobilityAids) && data.mobilityAids.length
          ? data.mobilityAids.join(", ")
          : "No especificado";

      writeField("Ayudas de movilidad", aidsText);
      writeField("Necesidades especiales", data.specialNeeds);

      // ==== Contacto emergencia ====
      doc.moveDown();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Contacto de emergencia")
        .moveDown(0.5);

      const ec = data.emergencyContact || {};
      const ecText =
        ec.name || ec.phone || ec.relationship
          ? `${ec.name || "N/A"} - Tel: ${ec.phone || "N/A"} (${ec.relationship || "Sin relación"})`
          : "No especificado";

      writeField("Contacto de emergencia", ecText);

      // ==== Metadata ====
      doc.moveDown();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Metadatos del certificado")
        .moveDown(0.5);

      const issued = data.metadata?.issuedAt
        ? new Date(data.metadata.issuedAt).toLocaleString("es-ES")
        : "No especificado";

      writeField("Emitido por", data.metadata?.issuer);
      writeField("Fecha de emisión", issued);

      // ==== Footer ====
      doc.moveDown(2);
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text(
          "Documento generado automáticamente por el Sistema de Certificados de Discapacidad BSV.",
          { align: "center" }
        );

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }
}
