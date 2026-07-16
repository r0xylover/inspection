/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TableRow, DefectMark, ConstructionType } from '../types';
import { getMarkFormattedDescription, getMarkFormattedRecommendation, downloadAsWord } from '../utils';
import { Printer, ZoomIn, ZoomOut, Layout, FileDown } from 'lucide-react';

interface A3PreviewProps {
  rows: TableRow[];
  marks: DefectMark[];
  constructions: ConstructionType[];
  axesLetters: string;
  axesNumbers: string;
  projectName?: string;
  buildingName?: string;
}

interface PageData {
  pageNumber: number;
  rows: TableRow[];
  allocatedHeight: number; // in cm
}

interface A3PhotosCellProps {
  photos: string[];
  defectNum: number | string;
}

// Custom component to dynamically handle vertical vs horizontal photo layouts
function A3PhotosCell({ photos, defectNum }: A3PhotosCellProps) {
  const [aspects, setAspects] = useState<('vertical' | 'horizontal')[]>([]);

  useEffect(() => {
    if (!photos || photos.length === 0) return;
    
    const loadedAspects: ('vertical' | 'horizontal')[] = [];
    let loadedCount = 0;

    photos.slice(0, 2).forEach((photo, idx) => {
      const img = new Image();
      img.src = photo;
      img.onload = () => {
        const orientation = img.width < img.height ? 'vertical' : 'horizontal';
        loadedAspects[idx] = orientation;
        loadedCount++;
        if (loadedCount === Math.min(2, photos.length)) {
          setAspects([...loadedAspects]);
        }
      };
      img.onerror = () => {
        loadedAspects[idx] = 'horizontal'; // default fallback
        loadedCount++;
        if (loadedCount === Math.min(2, photos.length)) {
          setAspects([...loadedAspects]);
        }
      };
    });
  }, [photos]);

  if (!photos || photos.length === 0) {
    return <span className="text-slate-400 italic">Фотофиксация отсутствует</span>;
  }

  if (photos.length === 1) {
    return (
      <div className="flex items-center justify-center h-full w-full" style={{ height: '10.2cm' }}>
        <img
          src={photos[0]}
          alt={`Фото дефекта ${defectNum}`}
          className="max-w-full max-h-[10.2cm] object-contain block mx-auto border border-black/10 rounded-sm"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Exactly 2 photos:
  const isBothVertical = aspects[0] === 'vertical' && aspects[1] === 'vertical';

  if (isBothVertical) {
    // Both are vertical -> side-by-side (два фото в ряд)
    return (
      <div className="flex gap-2 justify-center items-center h-full w-full" style={{ height: '10.2cm' }}>
        {photos.slice(0, 2).map((photo, pIdx) => (
          <img
            key={pIdx}
            src={photo}
            alt={`Фото ${defectNum} - ${pIdx + 1}`}
            className="w-[47%] max-h-[10.2cm] object-contain block border border-black/10 rounded-sm"
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
    );
  } else {
    // Horizontal or mixed -> stacked top-to-bottom (одно над другим)
    return (
      <div className="flex flex-col gap-2 justify-center items-center h-full w-full" style={{ height: '10.2cm' }}>
        {photos.slice(0, 2).map((photo, pIdx) => (
          <img
            key={pIdx}
            src={photo}
            alt={`Фото ${defectNum} - ${pIdx + 1}`}
            className="max-w-full h-[4.8cm] object-contain block border border-black/10 rounded-sm"
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
    );
  }
}

export default function A3Preview({
  rows,
  marks,
  constructions,
  axesLetters,
  axesNumbers,
  projectName = "Обследование несущих строительных конструкций здания",
  buildingName = "Производственный корпус №1"
}: A3PreviewProps) {
  const [scale, setScale] = useState<number>(0.5); // Default to 50% scale for screen view

  // Pagination Algorithm
  const paginateRows = (): PageData[] => {
    const pages: PageData[] = [];
    let currentRows: TableRow[] = [];
    let currentHeight = 0; // content height in cm (max 22.0 cm: 2 defects of 11cm + 1 title of 1cm)

    rows.forEach((row) => {
      const rowHeight = row.type === 'section' ? 1.0 : 11.0;

      // Check if this row fits on the current page
      if (currentHeight + rowHeight <= 22.0) {
        currentRows.push(row);
        currentHeight += rowHeight;
      } else {
        // Doesn't fit, push current page and start a new one
        pages.push({
          pageNumber: pages.length + 1,
          rows: currentRows,
          allocatedHeight: currentHeight
        });

        // Start new page with current row
        currentRows = [row];
        currentHeight = rowHeight;
      }
    });

    // Push last page if there are any rows remaining
    if (currentRows.length > 0) {
      pages.push({
        pageNumber: pages.length + 1,
        rows: currentRows,
        allocatedHeight: currentHeight
      });
    }

    // Return at least one page if list is empty
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        rows: [],
        allocatedHeight: 0
      });
    }

    return pages;
  };

  const pages = paginateRows();

  // Create consecutive defect row numbering across all pages
  let defectSeq = 0;
  const defectNumbersMap: Record<string, number> = {};
  rows.forEach((row) => {
    if (row.type === 'defect') {
      defectSeq++;
      defectNumbersMap[row.id] = defectSeq;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWordDownload = () => {
    downloadAsWord(projectName, buildingName, rows, marks);
  };

  return (
    <div id="a3-preview-root" className="flex flex-col items-center w-full">
      {/* Top toolbar */}
      <div id="a3-preview-toolbar" className="no-print w-full flex flex-wrap items-center justify-between gap-4 bg-slate-950 text-white p-5 rounded-2xl border border-slate-900 shadow-md mb-8">
        <div className="flex items-center gap-3 font-sans">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <Layout className="text-slate-200 h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider">Макет ведомости А3 Ландшафт (Шрифт: Times New Roman 12)</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Включен режим "На листе только таблица" без колонтитулов и штампов. Высота строк: дефект — 11 см, раздел — 1 см.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Scale controls */}
          <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 font-sans">
            <button
              id="scale-down-btn"
              onClick={() => setScale(Math.max(0.3, scale - 0.1))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Уменьшить"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-mono font-bold w-12 text-center select-none text-slate-200">
              {Math.round(scale * 100)}%
            </span>
            <button
              id="scale-up-btn"
              onClick={() => setScale(Math.min(1.2, scale + 0.1))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Увеличить"
            >
              <ZoomIn size={14} />
            </button>
            <button
              id="scale-reset-btn"
              onClick={() => setScale(0.45)}
              className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg hover:bg-slate-750 hover:text-white transition-all font-bold cursor-pointer"
            >
              Сброс
            </button>
          </div>

          <button
            id="download-word-btn"
            onClick={handleWordDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer font-sans"
          >
            <FileDown size={14} />
            <span>Скачать Word (.doc)</span>
          </button>

          <button
            id="print-pdf-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-slate-950 px-4 py-2.5 rounded-xl hover:bg-slate-100 font-bold text-xs shadow-xs transition-all cursor-pointer font-sans"
          >
            <Printer size={14} />
            <span>Печать на А3 / PDF</span>
          </button>
        </div>
      </div>

      {/* Pages Container with scale transform on screen */}
      <div 
        id="a3-pages-viewport"
        className="flex flex-col items-center gap-8 w-full overflow-x-auto pb-12 select-text"
        style={{ contentVisibility: 'auto' }}
      >
        {pages.map((page) => (
          <div
            key={page.pageNumber}
            className="origin-top transition-transform duration-200"
            style={{
              transform: `scale(${scale})`,
              marginBottom: `calc((29.7cm * ${scale}) - 29.7cm + 24px)`
            }}
          >
            {/* The Actual A3 Page (Pure minimalist table-only style in Times New Roman) */}
            <div 
              id={`a3-page-${page.pageNumber}`}
              className="a3-page relative bg-white border border-slate-200/80 shadow-md flex flex-col justify-center text-black select-text hover:shadow-lg transition-shadow duration-300 print:shadow-none print:border-0"
              style={{
                width: '42.0cm',
                height: '29.7cm',
                paddingLeft: '1.5cm',
                paddingRight: '1.5cm',
                paddingTop: '1.2cm',
                paddingBottom: '1.2cm',
                boxSizing: 'border-box'
              }}
            >
              {/* Table Container centered vertically */}
              <div className="w-full">
                <table className="w-full table-fixed border-collapse" style={{ border: '2px solid #000000' }}>
                  {/* Table Header - Exact Height 1.0 cm */}
                  <thead>
                    <tr className="font-bold text-center" style={{ height: '1.0cm', backgroundColor: '#f8fafc' }}>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '1.5cm', borderWidth: '1.5px' }}>№ п/п</th>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '10.0cm', borderWidth: '1.5px' }}>Марка дефекта с описанием</th>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '6.0cm', borderWidth: '1.5px' }}>Местоположение дефекта</th>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '7.0cm', borderWidth: '1.5px' }}>Рекомендации по устранению</th>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '11.0cm', borderWidth: '1.5px' }}>Фотофиксация</th>
                      <th className="border border-black p-1 align-middle text-center" style={{ width: '3.5cm', borderWidth: '1.5px' }}>Примечание</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {page.rows.length === 0 ? (
                      <tr className="bg-white">
                        <td colSpan={6} className="border border-black text-center italic align-middle" style={{ height: '22.0cm', borderWidth: '1.5px' }}>
                          Вставьте строки дефектов или разделы в редакторе...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {page.rows.map((row) => {
                          if (row.type === 'section') {
                            return (
                              <tr id={`preview-section-${row.id}`} key={row.id} className="font-bold bg-slate-100" style={{ height: '1.0cm' }}>
                                <td colSpan={6} className="border border-black px-4 py-1 text-left align-middle font-bold" style={{ borderWidth: '1.5px' }}>
                                  {row.title}
                                </td>
                              </tr>
                            );
                          } else {
                            // Defect Row (exactly 11.0 cm)
                            const recText = getMarkFormattedRecommendation(row.markIds, marks, row.customRecommendation);

                            // Collect all mark codes to display
                            const selectedMarks = marks.filter(m => row.markIds.includes(m.id));

                            return (
                              <tr id={`preview-defect-${row.id}`} key={row.id} className="bg-white" style={{ height: '11.0cm' }}>
                                {/* 1. № п/п (consecutive 1, 2, 3...) */}
                                <td className="border border-black text-center font-bold align-top py-4 px-1 break-words" style={{ height: '11.0cm', borderWidth: '1.5px' }}>
                                  {defectNumbersMap[row.id] || "–"}
                                </td>
                                
                                {/* 2. Марка дефекта с описанием */}
                                <td className="border border-black align-top p-4 whitespace-pre-line text-left" style={{ borderWidth: '1.5px', lineHeight: '1.3' }}>
                                  {row.customDescription && row.customDescription.trim() !== "" ? (
                                    <div className="text-black">{row.customDescription}</div>
                                  ) : selectedMarks.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {selectedMarks.map((m) => (
                                        <div key={m.id} className="mb-1.5 text-black">
                                          <span className="font-bold">{m.code}:</span> {m.description}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Описание не заполнено</span>
                                  )}
                                </td>

                                {/* 3. Местоположение */}
                                <td className="border border-black align-top p-4 font-bold text-left" style={{ borderWidth: '1.5px', lineHeight: '1.3' }}>
                                  {row.locationText}
                                </td>

                                {/* 4. Рекомендация по устранению */}
                                <td className="border border-black align-top p-4 text-left italic" style={{ borderWidth: '1.5px', lineHeight: '1.3' }}>
                                  {recText}
                                </td>

                                {/* 5. Фотография или фотографии (large column, customized layout orientation) */}
                                <td className="border border-black align-top p-2 text-center" style={{ borderWidth: '1.5px' }}>
                                  <A3PhotosCell 
                                    photos={row.photos || []} 
                                    defectNum={defectNumbersMap[row.id] || ''} 
                                  />
                                </td>

                                {/* 6. Примечание */}
                                <td className="border border-black align-top p-3 text-left font-medium" style={{ borderWidth: '1.5px' }}>
                                  {row.note || "–"}
                                </td>
                              </tr>
                            );
                          }
                        })}

                        {/* Fill the remaining height to ensure table layout remains perfectly stable at exactly 22.0cm */}
                        {page.allocatedHeight < 22.0 && (
                          <tr className="bg-white/50 print:hidden">
                            <td 
                              colSpan={6} 
                              className="border border-black border-t-0 p-0" 
                              style={{ height: `${22.0 - page.allocatedHeight}cm`, borderWidth: '1.5px' }}
                            />
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scoped Times New Roman 12pt styles and high-fidelity printing rules */}
      <style>{`
        .a3-page {
          font-family: "Times New Roman", Times, serif !important;
        }
        .a3-page table {
          font-family: "Times New Roman", Times, serif !important;
          font-size: 12pt !important;
          color: #000000 !important;
        }
        .a3-page th, .a3-page td {
          font-family: "Times New Roman", Times, serif !important;
          font-size: 12pt !important;
          color: #000000 !important;
        }
        .a3-page p, .a3-page div, .a3-page span {
          font-family: "Times New Roman", Times, serif !important;
          font-size: 12pt !important;
          color: #000000 !important;
        }
        .a3-page .italic {
          font-style: italic !important;
        }
        .a3-page .font-bold, .a3-page .font-semibold {
          font-weight: bold !important;
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .a3-page {
            width: 42.0cm !important;
            height: 29.7cm !important;
            padding-left: 1.5cm !important;
            padding-right: 1.5cm !important;
            padding-top: 1.2cm !important;
            padding-bottom: 1.2cm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
