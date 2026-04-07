import { Resend } from 'resend';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: { bodyParser: false },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: true,
      maxFileSize: 5 * 1024 * 1024,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      // Normalize fields (formidable v3 wraps values in arrays)
      const normalized = {};
      for (const [key, val] of Object.entries(fields)) {
        normalized[key] = Array.isArray(val) ? val[0] : val;
      }
      // Normalize files — ensure images is always an array
      const imageFiles = files.images
        ? Array.isArray(files.images) ? files.images : [files.images]
        : [];
      resolve({ fields: normalized, images: imageFiles });
    });
  });
}

function generatePptx(fields) {
  // Look for any .pptx file in the templates directory
  const templatesDir = path.join(process.cwd(), 'templates');
  const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.pptx'));

  if (templateFiles.length === 0) {
    return null; // No template available — email will be sent without PPTX
  }

  const templatePath = path.join(templatesDir, templateFiles[0]);
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  doc.render({
    product_line: fields.productLine || '',
    industry: fields.industry || '',
    product: fields.product || '',
    contact: fields.contact || '',
    challenge: fields.challenge || '',
    solution: fields.solution || '',
    result: fields.result || '',
  });

  return doc.getZip().generate({ type: 'nodebuffer' });
}

function buildEmailHtml(fields) {
  const section = (title, content) => `
    <tr>
      <td style="padding: 16px 24px 4px;">
        <p style="margin:0; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:#6e6e73;">${title}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px;">
        <p style="margin:0; font-size:14px; line-height:1.6; color:#1c1c1e; white-space:pre-wrap;">${content}</p>
      </td>
    </tr>
  `;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; font-family:'Inter',system-ui,sans-serif;">
      <tr>
        <td style="background:#c8102e; padding:20px 24px;">
          <h1 style="margin:0; font-size:18px; font-weight:600; color:#ffffff;">New Case Study Submission</h1>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f9fb; padding:16px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%; padding:4px 0;">
                <span style="font-size:11px; color:#6e6e73; text-transform:uppercase; font-weight:600; letter-spacing:0.08em;">Product Line</span><br/>
                <span style="font-size:14px; color:#1c1c1e; font-weight:500;">${fields.productLine}</span>
              </td>
              <td style="width:50%; padding:4px 0;">
                <span style="font-size:11px; color:#6e6e73; text-transform:uppercase; font-weight:600; letter-spacing:0.08em;">Industry</span><br/>
                <span style="font-size:14px; color:#1c1c1e; font-weight:500;">${fields.industry}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:11px; color:#6e6e73; text-transform:uppercase; font-weight:600; letter-spacing:0.08em;">Product</span><br/>
                <span style="font-size:14px; color:#1c1c1e; font-weight:500;">${fields.product}</span>
              </td>
              <td style="padding:4px 0;">
                <span style="font-size:11px; color:#6e6e73; text-transform:uppercase; font-weight:600; letter-spacing:0.08em;">Submitted By</span><br/>
                <span style="font-size:14px; color:#1c1c1e; font-weight:500;">${fields.contact}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${section('Challenge', fields.challenge)}
      <tr><td style="padding:0 24px;"><hr style="border:none; border-top:1px solid #e5e5ea; margin:0;"/></td></tr>
      ${section('Solution', fields.solution)}
      <tr><td style="padding:0 24px;"><hr style="border:none; border-top:1px solid #e5e5ea; margin:0;"/></td></tr>
      ${section('Result', fields.result)}
      <tr>
        <td style="padding:20px 24px; background:#f9f9fb; font-size:11px; color:#6e6e73;">
          Submitted on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} via Case Study Generator
        </td>
      </tr>
    </table>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Parse form data
    const { fields, images } = await parseForm(req);

    // 2. Validate required fields
    const required = ['productLine', 'industry', 'product', 'contact', 'challenge', 'solution', 'result'];
    for (const field of required) {
      if (!fields[field] || !fields[field].trim()) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // 3. Generate PPTX from template
    let pptxBuffer = null;
    try {
      pptxBuffer = generatePptx(fields);
    } catch (err) {
      console.error('PPTX generation error:', err.message);
      // Continue without PPTX — still send the email with text + images
    }

    // 4. Build attachments
    const attachments = [];

    if (pptxBuffer) {
      const safeName = fields.product.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      attachments.push({
        filename: `Case_Study_${safeName}.pptx`,
        content: pptxBuffer,
      });
    }

    for (const img of images) {
      attachments.push({
        filename: img.originalFilename || img.newFilename || 'image.jpg',
        content: fs.readFileSync(img.filepath),
      });
    }

    // 5. Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Case Study Generator <onboarding@resend.dev>',
      to: 'jd.maxwell@chesterton.com',
      subject: `Case Study Submission: ${fields.product} \u2014 ${fields.industry}`,
      html: buildEmailHtml(fields),
      attachments,
    });

    // 6. Clean up temp files
    for (const img of images) {
      try { fs.unlinkSync(img.filepath); } catch {}
    }

    return res.status(200).json({ success: true, message: 'Case study submitted successfully' });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Failed to submit case study. Please try again.' });
  }
}
