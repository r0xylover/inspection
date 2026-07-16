/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefectLocation, ConstructionType, DefectMark, TableRow } from './types';

/**
 * Compiles a structured location object into a neat Russian text representation.
 */
export function compileLocationText(
  loc: DefectLocation,
  constructions: ConstructionType[]
): string {
  const constType = constructions.find(c => c.id === loc.constructionTypeId);
  if (!constType) return "Неизвестная конструкция";

  const name = constType.name;
  let axesPart = "";

  if (constType.coordType === 'intersection') {
    axesPart = `ось ${loc.axisLetterStart}/${loc.axisNumberStart}`;
  } else {
    const letters = loc.axisLetterEnd && loc.axisLetterEnd !== loc.axisLetterStart
      ? `${loc.axisLetterStart}-${loc.axisLetterEnd}`
      : loc.axisLetterStart;
    const numbers = loc.axisNumberEnd && loc.axisNumberEnd !== loc.axisNumberStart
      ? `${loc.axisNumberStart}-${loc.axisNumberEnd}`
      : loc.axisNumberStart;
    
    axesPart = `в осях ${letters} / ${numbers}`;
  }

  const commentPart = loc.comment && loc.comment.trim() ? `, ${loc.comment.trim()}` : "";
  return `${name} (${axesPart}${commentPart})`;
}

/**
 * Formats multiple marks descriptions as a bulleted list starting with "– ".
 */
export function getMarkFormattedDescription(
  markIds: string[],
  marks: DefectMark[],
  customDescription?: string
): string {
  if (customDescription !== undefined && customDescription.trim() !== "") {
    return customDescription;
  }

  if (!markIds || markIds.length === 0) {
    return "Сведения о дефекте не заполнены (выберите марку или введите вручную)";
  }

  const selectedMarks = marks.filter(m => markIds.includes(m.id));
  const bullets: string[] = [];

  selectedMarks.forEach(m => {
    // Split description into separate lines or paragraphs
    const lines = m.description.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      // Remove existing bullet characters if any to avoid double bullets
      let cleanLine = line.replace(/^[–\-*•]\s*/, '');
      if (cleanLine) {
        bullets.push(`– ${cleanLine}`);
      }
    });
  });

  return bullets.join('\n');
}

/**
 * Formats multiple marks recommendations as a unified sentence-by-sentence text.
 */
export function getMarkFormattedRecommendation(
  markIds: string[],
  marks: DefectMark[],
  customRecommendation?: string
): string {
  if (customRecommendation !== undefined && customRecommendation.trim() !== "") {
    return customRecommendation;
  }

  if (!markIds || markIds.length === 0) {
    return "Рекомендации не заполнены (выберите марку или введите вручную)";
  }

  const selectedMarks = marks.filter(m => markIds.includes(m.id));
  const sentences: string[] = [];

  selectedMarks.forEach(m => {
    const rec = m.recommendation.trim();
    if (rec) {
      // Split by periods followed by space, or just use as sentences
      const parts = rec.split(/(?<=\.)\s+/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => {
        // Ensure sentence ends with a dot
        if (!p.endsWith('.') && !p.endsWith('!') && !p.endsWith('?')) {
          sentences.push(`${p}.`);
        } else {
          sentences.push(p);
        }
      });
    }
  });

  return sentences.join(' ');
}

/**
 * Compresses an uploaded image file on the client-side without visible quality loss.
 */
export function compressImage(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось инициализировать canvas контекст'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as lightweight compressed JPEG base64 string
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Generates a realistic mock concrete defect photo using HTML5 Canvas.
 */
export function generateCrackPlaceholder(label: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: concrete texture grey
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 400, 300);

  // Add random texture noise
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 400;
    const y = Math.random() * 300;
    const size = Math.random() * 2 + 1;
    ctx.fillRect(x, y, size, size);
  }

  // Draw realistic looking crack
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 0);
  ctx.lineTo(180, 110);
  ctx.lineTo(150, 200);
  ctx.lineTo(240, 300);
  ctx.stroke();

  // Draw a branching crack
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, 110);
  ctx.lineTo(260, 150);
  ctx.lineTo(280, 250);
  ctx.stroke();

  // Draw an engineering scale line (red measurement ticks)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 250);
  ctx.lineTo(200, 250);
  ctx.stroke();

  // Draw scale ticks
  ctx.beginPath();
  ctx.moveTo(40, 242); ctx.lineTo(40, 258);
  ctx.moveTo(80, 245); ctx.lineTo(80, 255);
  ctx.moveTo(120, 245); ctx.lineTo(120, 255);
  ctx.moveTo(160, 245); ctx.lineTo(160, 255);
  ctx.moveTo(200, 242); ctx.lineTo(200, 258);
  ctx.stroke();

  // Scale label
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('100 mm', 120, 235);

  // Label banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 260, 400, 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 200, 280);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generates and downloads a high-quality Microsoft Word compatible document
 * with an elegant table matching our report styling.
 */
export async function downloadAsWord(
  projectName: string,
  buildingName: string,
  rows: TableRow[],
  marks: DefectMark[]
) {
  // Helper to get image orientation asynchronously
  const getImageOrientation = (base64: string): Promise<'vertical' | 'horizontal'> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve('horizontal');
        return;
      }
      const img = new Image();
      img.onload = () => {
        resolve(img.width < img.height ? 'vertical' : 'horizontal');
      };
      img.onerror = () => {
        resolve('horizontal');
      };
      img.src = base64;
    });
  };

  let tableRowsHtml = "";
  let defectCounter = 0;

  // Pre-load all photo orientations
  const photosOrientations: Record<string, 'vertical' | 'horizontal'> = {};
  for (const row of rows) {
    if (row.type === 'defect' && row.photos && row.photos.length > 0) {
      for (const photo of row.photos) {
        if (!photosOrientations[photo]) {
          photosOrientations[photo] = await getImageOrientation(photo);
        }
      }
    }
  }

  rows.forEach((row) => {
    if (row.type === 'section') {
      tableRowsHtml += `
        <tr class="section-row" style="background-color: #f1f5f9; font-weight: bold; page-break-inside: avoid;">
          <td colspan="6" style="border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; background-color: #f1f5f9; color: #000000; font-weight: bold;">
            ${row.title}
          </td>
        </tr>
      `;
    } else {
      defectCounter++;
      
      const selectedMarks = marks.filter(m => row.markIds.includes(m.id));
      let markAndDesc = "";
      if (row.customDescription && row.customDescription.trim() !== "") {
        markAndDesc = row.customDescription;
      } else if (selectedMarks.length > 0) {
        markAndDesc = selectedMarks.map(m => {
          return `<b>${m.code}</b>: ${m.description}`;
        }).join('<br/><br/>');
      } else {
        markAndDesc = "Описание не заполнено";
      }

      const recText = getMarkFormattedRecommendation(row.markIds, marks, row.customRecommendation);
      
      let photosHtml = "";
      if (row.photos && row.photos.length > 0) {
        if (row.photos.length === 1) {
          photosHtml += `
            <div style="text-align: center; vertical-align: middle; padding: 2px;">
              <img src="${row.photos[0]}" style="max-width: 100%; max-height: 10.0cm; object-fit: contain; border: 1px solid #dddddd;" />
            </div>
          `;
        } else {
          const isBothVertical = photosOrientations[row.photos[0]] === 'vertical' && photosOrientations[row.photos[1]] === 'vertical';
          if (isBothVertical) {
            // Side-by-side in Word
            photosHtml += `
              <table border="0" style="width: 100%; border: 0; margin: 0; padding: 0; border-collapse: collapse;">
                <tr>
                  <td style="border: 0; padding: 2px; text-align: center; vertical-align: middle; width: 50%;">
                    <img src="${row.photos[0]}" style="max-width: 100%; max-height: 10.0cm; object-fit: contain; border: 1px solid #dddddd;" />
                  </td>
                  <td style="border: 0; padding: 2px; text-align: center; vertical-align: middle; width: 50%;">
                    <img src="${row.photos[1]}" style="max-width: 100%; max-height: 10.0cm; object-fit: contain; border: 1px solid #dddddd;" />
                  </td>
                </tr>
              </table>
            `;
          } else {
            // Stacked top-to-bottom
            photosHtml += `
              <table border="0" style="width: 100%; border: 0; margin: 0; padding: 0; border-collapse: collapse;">
                <tr>
                  <td style="border: 0; padding: 2px; text-align: center; vertical-align: middle;">
                    <img src="${row.photos[0]}" style="max-width: 100%; max-height: 4.8cm; object-fit: contain; border: 1px solid #dddddd;" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 0; padding: 4px 2px 2px 2px; text-align: center; vertical-align: middle;">
                    <img src="${row.photos[1]}" style="max-width: 100%; max-height: 4.8cm; object-fit: contain; border: 1px solid #dddddd;" />
                  </td>
                </tr>
              </table>
            `;
          }
        }
      } else {
        photosHtml = `<div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #94a3b8; font-style: italic;">Фотофиксация отсутствует</div>`;
      }

      tableRowsHtml += `
        <tr style="page-break-inside: avoid; height: 11.0cm;">
          <!-- 1. № п/п -->
          <td style="border: 1px solid #000000; padding: 10px; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; font-size: 12pt; width: 4%; vertical-align: top;">
            ${defectCounter}
          </td>
          <!-- 2. Марка дефекта с описанием -->
          <td style="border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; width: 26%; vertical-align: top; line-height: 1.3;">
            ${markAndDesc}
          </td>
          <!-- 3. Местоположение дефекта -->
          <td style="border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; width: 15%; vertical-align: top; line-height: 1.3;">
            ${row.locationText}
          </td>
          <!-- 4. Рекомендации по устранению -->
          <td style="border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-style: italic; width: 18%; vertical-align: top; line-height: 1.3;">
            ${recText}
          </td>
          <!-- 5. Фотофиксация -->
          <td style="border: 1px solid #000000; padding: 6px; width: 28%; vertical-align: middle; text-align: center;">
            ${photosHtml}
          </td>
          <!-- 6. Примечание -->
          <td style="border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; width: 9%; vertical-align: top;">
            ${row.note || "–"}
          </td>
        </tr>
      `;
    }
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${buildingName} - Ведомость дефектов</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 42.0cm 29.7cm; /* Horizontal A3 Format */
          mso-page-orientation: landscape;
          margin: 1.2cm 1.5cm 1.2cm 1.5cm;
        }
        div.WordSection1 {
          page: WordSection1;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          line-height: 1.3;
        }
        h2 {
          text-align: center;
          text-transform: uppercase;
          font-family: 'Times New Roman', Times, serif;
          font-size: 16pt;
          margin-bottom: 5px;
          font-weight: bold;
        }
        h3 {
          text-align: center;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          color: #000000;
          margin-top: 0;
          margin-bottom: 25px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-family: 'Times New Roman', Times, serif;
        }
        th {
          border: 1.5px solid #000000;
          padding: 8px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          font-weight: bold;
          text-align: center;
          background-color: #f8fafc;
        }
        td {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <h2>ВЕДОМОСТЬ ДЕФЕКТОВ СТРОИТЕЛЬНЫХ КОНСТРУКЦИЙ (ФОРМАТ А3)</h2>
        <h3>Объект: ${projectName}<br/>Здание/Корпус: ${buildingName}</h3>
        
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1.5px solid #000000;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="width: 4%; border: 1.5px solid #000000;">№ п/п</th>
              <th style="width: 26%; border: 1.5px solid #000000;">Марка дефекта с описанием</th>
              <th style="width: 15%; border: 1.5px solid #000000;">Местоположение дефекта</th>
              <th style="width: 18%; border: 1.5px solid #000000;">Рекомендации по устранению</th>
              <th style="width: 28%; border: 1.5px solid #000000;">Фотофиксация</th>
              <th style="width: 9%; border: 1.5px solid #000000;">Примечание</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  // Create document blob and initiate download
  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `ведомость_дефектов_${buildingName.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}.doc`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
