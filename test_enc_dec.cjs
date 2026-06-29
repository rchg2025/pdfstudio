const fs = require('fs');
const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');
const { decryptPDF } = require('@pdfsmaller/pdf-decrypt');
const { PDFDocument } = require('pdf-lib');

async function run() {
  console.log('Creating PDF...');
  const doc = await PDFDocument.create();
  doc.addPage([500,500]);
  const pdfBytes = await doc.save();
  
  console.log('Encrypting PDF...');
  const encrypted = await encryptPDF(pdfBytes, 'password');
  
  console.log('Decrypting PDF...');
  try {
    const decrypted = await decryptPDF(encrypted, 'password');
    console.log('Decrypted size:', decrypted.length);
  } catch (e) {
    console.error('Decryption failed:', e);
  }
}
run();
