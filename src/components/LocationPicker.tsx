/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConstructionType, DefectLocation } from '../types';
import { MapPin, Edit3, Grid } from 'lucide-react';
import { compileLocationText } from '../utils';

interface LocationPickerProps {
  constructions: ConstructionType[];
  axesLetters: string; // "А, Б, В..."
  axesNumbers: string; // "1, 2, 3..."
  initialLocation?: DefectLocation;
  onSave: (location: DefectLocation, compiledText: string) => void;
  onCancel?: () => void;
}

const RUSSIAN_ALPHABET = [
  "А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", 
  "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
];

const NUMBERS_1_TO_100 = Array.from({ length: 100 }, (_, i) => String(i + 1));

export default function LocationPicker({
  constructions,
  axesLetters,
  axesNumbers,
  initialLocation,
  onSave,
  onCancel
}: LocationPickerProps) {
  // Parse building axes arrays
  const lettersList = axesLetters
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  
  const numbersList = axesNumbers
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

  // Combine building config with the full lists to ensure the user gets everything up to 100 and the full alphabet
  const letters = Array.from(new Set([...lettersList, ...RUSSIAN_ALPHABET])).filter(Boolean);
  const numbers = Array.from(new Set([...numbersList, ...NUMBERS_1_TO_100])).filter(Boolean);

  // State
  const [selectedConstId, setSelectedConstId] = useState<string>(
    initialLocation?.constructionTypeId || constructions[0]?.id || ''
  );
  
  const selectedConst = constructions.find(c => c.id === selectedConstId);
  const isIntersection = selectedConst?.coordType === 'intersection';

  const [axisLetterStart, setAxisLetterStart] = useState<string>(
    initialLocation?.axisLetterStart || letters[0] || 'А'
  );
  const [axisLetterEnd, setAxisLetterEnd] = useState<string>(
    initialLocation?.axisLetterEnd || letters[1] || letters[0] || 'Б'
  );
  const [axisNumberStart, setAxisNumberStart] = useState<string>(
    initialLocation?.axisNumberStart || numbers[0] || '1'
  );
  const [axisNumberEnd, setAxisNumberEnd] = useState<string>(
    initialLocation?.axisNumberEnd || numbers[1] || numbers[0] || '2'
  );
  const [comment, setComment] = useState<string>(
    initialLocation?.comment || ''
  );

  // Manual input constructor mode
  const [isManualAxes, setIsManualAxes] = useState<boolean>(false);

  // Detect if initial location utilizes a custom format to auto-enable manual constructor mode
  useEffect(() => {
    if (initialLocation) {
      const isLStartCustom = initialLocation.axisLetterStart && !lettersList.includes(initialLocation.axisLetterStart);
      const isLEndCustom = initialLocation.axisLetterEnd && !lettersList.includes(initialLocation.axisLetterEnd);
      const isNStartCustom = initialLocation.axisNumberStart && !numbersList.includes(initialLocation.axisNumberStart);
      const isNEndCustom = initialLocation.axisNumberEnd && !numbersList.includes(initialLocation.axisNumberEnd);

      if (isLStartCustom || isLEndCustom || isNStartCustom || isNEndCustom) {
        setIsManualAxes(true);
      }
    }
  }, [initialLocation]);

  // Sync state if list dependencies update
  useEffect(() => {
    if (!isManualAxes) {
      if (!letters.includes(axisLetterStart)) setAxisLetterStart(letters[0] || 'А');
      if (!letters.includes(axisLetterEnd)) setAxisLetterEnd(letters[1] || letters[0] || 'Б');
      if (!numbers.includes(axisNumberStart)) setAxisNumberStart(numbers[0] || '1');
      if (!numbers.includes(axisNumberEnd)) setAxisNumberEnd(numbers[1] || numbers[0] || '2');
    }
  }, [axesLetters, axesNumbers, isManualAxes]);

  const handleSave = () => {
    const loc: DefectLocation = {
      constructionTypeId: selectedConstId,
      axisLetterStart: axisLetterStart.trim(),
      axisLetterEnd: isIntersection ? undefined : axisLetterEnd.trim(),
      axisNumberStart: axisNumberStart.trim(),
      axisNumberEnd: isIntersection ? undefined : axisNumberEnd.trim(),
      comment: comment.trim() || undefined
    };

    const compiledText = compileLocationText(loc, constructions);
    onSave(loc, compiledText);
  };

  const handleApplyTemplateLetter = (val: string, isEnd: boolean = false) => {
    if (isEnd) {
      setAxisLetterEnd(val);
    } else {
      setAxisLetterStart(val);
    }
  };

  const handleApplyTemplateNumber = (val: string, isEnd: boolean = false) => {
    if (isEnd) {
      setAxisNumberEnd(val);
    } else {
      setAxisNumberStart(val);
    }
  };

  return (
    <div id="location-picker-container" className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200/50 pb-3">
        <MapPin className="text-slate-800" size={16} />
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Выбор местоположения (Древовидная структура)</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1: Select Construction Type */}
        <div className="flex flex-col bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            1. Тип конструкции
          </label>
          <div className="space-y-1 overflow-y-auto max-h-[220px] pr-1">
            {constructions.map(c => {
              const active = c.id === selectedConstId;
              return (
                <button
                  id={`const-type-btn-${c.id}`}
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConstId(c.id)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                    active ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {c.coordType === 'intersection' ? 'ось' : 'оси'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select/Construct Axes */}
        <div className="flex flex-col bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs col-span-2">
          
          {/* Header & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              2. Координатные оси ({isIntersection ? "На пересечении" : "В осях / диапазоне"})
            </label>
            <button
              id="toggle-manual-axes-btn"
              type="button"
              onClick={() => setIsManualAxes(!isManualAxes)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] uppercase font-extrabold transition-all border cursor-pointer ${
                isManualAxes 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isManualAxes ? (
                <>
                  <Grid size={11} />
                  <span>Выбрать из списков</span>
                </>
              ) : (
                <>
                  <Edit3 size={11} />
                  <span>Конструктор осей (1.1, А.1)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Letters Axes selection */}
            <div className="space-y-3.5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/40">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-300/20">А</span>
                Буквенная ось
              </span>

              {isIntersection ? (
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Ось</label>
                  {isManualAxes ? (
                    <div className="space-y-2">
                      <input
                        id="axis-letter-start-manual"
                        type="text"
                        value={axisLetterStart}
                        onChange={(e) => setAxisLetterStart(e.target.value)}
                        placeholder="А.1, А/1, Б.3"
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800 font-mono"
                      />
                      <div className="flex flex-wrap gap-1">
                        {['А.1', 'А/1', 'Б.2', 'Б/1'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleApplyTemplateLetter(t, false)}
                            className="bg-white hover:bg-slate-100 text-[9px] text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select
                      id="axis-letter-start-select"
                      value={axisLetterStart}
                      onChange={(e) => setAxisLetterStart(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden focus:ring-4 focus:ring-slate-900/5 transition-all shadow-2xs cursor-pointer font-medium text-slate-700"
                    >
                      {letters.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">От оси</label>
                    {isManualAxes ? (
                      <div className="space-y-1.5">
                        <input
                          id="axis-letter-start-manual-range"
                          type="text"
                          value={axisLetterStart}
                          onChange={(e) => setAxisLetterStart(e.target.value)}
                          placeholder="А.1"
                          className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all text-slate-800 font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                          {['А.1', 'Б.1'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleApplyTemplateLetter(t, false)}
                              className="bg-white text-[8px] text-slate-400 border border-slate-100 px-1 py-0.5 rounded font-mono cursor-pointer"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select
                        id="axis-letter-start-range-select"
                        value={axisLetterStart}
                        onChange={(e) => setAxisLetterStart(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs cursor-pointer text-slate-700"
                      >
                        {letters.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">До оси</label>
                    {isManualAxes ? (
                      <div className="space-y-1.5">
                        <input
                          id="axis-letter-end-manual-range"
                          type="text"
                          value={axisLetterEnd}
                          onChange={(e) => setAxisLetterEnd(e.target.value)}
                          placeholder="Б.2"
                          className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all text-slate-800 font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                          {['А.2', 'Б.2'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleApplyTemplateLetter(t, true)}
                              className="bg-white text-[8px] text-slate-400 border border-slate-100 px-1 py-0.5 rounded font-mono cursor-pointer"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select
                        id="axis-letter-end-range-select"
                        value={axisLetterEnd}
                        onChange={(e) => setAxisLetterEnd(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs cursor-pointer text-slate-700"
                      >
                        {letters.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Numbers Axes selection */}
            <div className="space-y-3.5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/40">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-300/20">1</span>
                Цифровая ось
              </span>

              {isIntersection ? (
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Ось</label>
                  {isManualAxes ? (
                    <div className="space-y-2">
                      <input
                        id="axis-number-start-manual"
                        type="text"
                        value={axisNumberStart}
                        onChange={(e) => setAxisNumberStart(e.target.value)}
                        placeholder="1.1, 1/1, 2.3"
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800 font-mono"
                      />
                      <div className="flex flex-wrap gap-1">
                        {['1.1', '1/1', '2.2', '2/1'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleApplyTemplateNumber(t, false)}
                            className="bg-white hover:bg-slate-100 text-[9px] text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select
                      id="axis-number-start-select"
                      value={axisNumberStart}
                      onChange={(e) => setAxisNumberStart(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden focus:ring-4 focus:ring-slate-900/5 transition-all shadow-2xs cursor-pointer font-medium text-slate-700"
                    >
                      {numbers.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">От оси</label>
                    {isManualAxes ? (
                      <div className="space-y-1.5">
                        <input
                          id="axis-number-start-manual-range"
                          type="text"
                          value={axisNumberStart}
                          onChange={(e) => setAxisNumberStart(e.target.value)}
                          placeholder="1.1"
                          className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all text-slate-800 font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                          {['1.1', '2.1'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleApplyTemplateNumber(t, false)}
                              className="bg-white text-[8px] text-slate-400 border border-slate-100 px-1 py-0.5 rounded font-mono cursor-pointer"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select
                        id="axis-number-start-range-select"
                        value={axisNumberStart}
                        onChange={(e) => setAxisNumberStart(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs cursor-pointer text-slate-700"
                      >
                        {numbers.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">До оси</label>
                    {isManualAxes ? (
                      <div className="space-y-1.5">
                        <input
                          id="axis-number-end-manual-range"
                          type="text"
                          value={axisNumberEnd}
                          onChange={(e) => setAxisNumberEnd(e.target.value)}
                          placeholder="2.2"
                          className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all text-slate-800 font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                          {['1.2', '2.2'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleApplyTemplateNumber(t, true)}
                              className="bg-white text-[8px] text-slate-400 border border-slate-100 px-1 py-0.5 rounded font-mono cursor-pointer"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select
                        id="axis-number-end-range-select"
                        value={axisNumberEnd}
                        onChange={(e) => setAxisNumberEnd(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs cursor-pointer text-slate-700"
                      >
                        {numbers.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="mt-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
              3. Уточняющий комментарий (необязательно)
            </label>
            <input
              id="location-picker-comment-input"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Пример: у опоры, высотная отметка +3.600, ребро плиты..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Live Preview and Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 pt-4 gap-4">
        <div className="text-left w-full sm:w-auto">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Сформированное описание местоположения:</div>
          <div className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-2 mt-1.5 inline-block shadow-2xs">
            {compileLocationText(
              {
                constructionTypeId: selectedConstId,
                axisLetterStart,
                axisLetterEnd: isIntersection ? undefined : axisLetterEnd,
                axisNumberStart,
                axisNumberEnd: isIntersection ? undefined : axisNumberEnd,
                comment: comment.trim() || undefined
              },
              constructions
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              id="location-picker-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              Отмена
            </button>
          )}
          <button
            id="location-picker-apply-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
