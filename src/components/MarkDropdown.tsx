/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { DefectMark } from '../types';
import { Search, Check, ChevronDown, X } from 'lucide-react';

interface MarkDropdownProps {
  allMarks: DefectMark[];
  selectedMarkIds: string[];
  onChange: (ids: string[]) => void;
  id?: string;
}

export default function MarkDropdown({
  allMarks,
  selectedMarkIds,
  onChange,
  id
}: MarkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMarks = allMarks.filter(mark => {
    const s = searchTerm.toLowerCase();
    return (
      mark.code.toLowerCase().includes(s) ||
      mark.name.toLowerCase().includes(s) ||
      mark.description.toLowerCase().includes(s)
    );
  });

  const toggleMark = (markId: string) => {
    if (selectedMarkIds.includes(markId)) {
      onChange(selectedMarkIds.filter(id => id !== markId));
    } else {
      onChange([...selectedMarkIds, markId]);
    }
  };

  const selectedMarks = allMarks.filter(m => selectedMarkIds.includes(m.id));

  return (
    <div className="relative w-full" ref={dropdownRef} id={id}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs shadow-2xs transition-all duration-150 hover:border-slate-300 cursor-pointer focus-within:ring-4 focus-within:ring-slate-900/5 focus-within:border-slate-900"
      >
        <div className="flex flex-wrap gap-1.5 max-w-[90%]">
          {selectedMarks.length === 0 ? (
            <span className="text-slate-400 font-medium">Выберите марки дефектов...</span>
          ) : (
            selectedMarks.map(m => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 border border-slate-200/50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all shadow-2xs"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMark(m.id);
                }}
              >
                <span className="text-slate-900 font-extrabold font-mono text-[10px] bg-white border border-slate-200/40 px-1 py-0.2 rounded">{m.code}</span>
                <span className="max-w-[120px] truncate">{m.name}</span>
                <X size={11} className="text-slate-400 hover:text-slate-600 transition-colors" />
              </span>
            ))
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full max-w-[500px] rounded-2xl border border-slate-200/60 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск марки, названия или описания..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9.5 pr-3 py-2.5 text-xs outline-hidden focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all duration-150"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1">
            {filteredMarks.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">Марки не найдены</div>
            ) : (
              <div className="space-y-1">
                {filteredMarks.map(mark => {
                  const isChecked = selectedMarkIds.includes(mark.id);
                  return (
                    <div
                      key={mark.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMark(mark.id);
                      }}
                      className={`flex items-start gap-3 rounded-xl p-3 transition-all cursor-pointer text-left border ${
                        isChecked 
                          ? 'bg-slate-50 border-slate-200/60 shadow-2xs' 
                          : 'bg-transparent border-transparent hover:bg-slate-50/60'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                        isChecked 
                          ? 'border-slate-900 bg-slate-900 text-white' 
                          : 'border-slate-200 bg-white'
                      }`}>
                        {isChecked && <Check size={11} className="text-white stroke-[3px]" />}
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 bg-slate-100 border border-slate-200/40 px-2 py-0.5 rounded-md text-[10px] font-mono">
                            {mark.code}
                          </span>
                          <span className="font-bold text-slate-800">{mark.name}</span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {mark.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedMarkIds.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Выбрано: {selectedMarkIds.length}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="text-rose-600 font-bold hover:text-rose-700 transition-colors"
              >
                Сбросить выбор
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
