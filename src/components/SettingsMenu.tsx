/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DefectMark, ConstructionType } from '../types';
import { Settings, Plus, Trash2, Edit3, Layers } from 'lucide-react';

interface SettingsMenuProps {
  marks: DefectMark[];
  constructions: ConstructionType[];
  onUpdateMarks: (marks: DefectMark[]) => void;
  onUpdateConstructions: (constructions: ConstructionType[]) => void;
}

export default function SettingsMenu({
  marks,
  constructions,
  onUpdateMarks,
  onUpdateConstructions
}: SettingsMenuProps) {
  const [subTab, setSubTab] = useState<'marks' | 'constructions'>('marks');

  // --- Marks state ---
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [markCode, setMarkCode] = useState('');
  const [markName, setMarkName] = useState('');
  const [markDesc, setMarkDesc] = useState('');
  const [markRec, setMarkRec] = useState('');

  // --- Constructions state ---
  const [editingConstId, setEditingConstId] = useState<string | null>(null);
  const [constName, setConstName] = useState('');
  const [constType, setConstType] = useState<'intersection' | 'range'>('intersection');

  // Add/Edit Mark
  const handleSaveMark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markCode.trim() || !markName.trim()) return;

    if (editingMarkId) {
      // Edit
      const updated = marks.map(m =>
        m.id === editingMarkId
          ? {
              ...m,
              code: markCode.trim().toUpperCase(),
              name: markName.trim(),
              description: markDesc.trim(),
              recommendation: markRec.trim()
            }
          : m
      );
      onUpdateMarks(updated);
      setEditingMarkId(null);
    } else {
      // Add new
      const newMark: DefectMark = {
        id: `mark-${Date.now()}`,
        code: markCode.trim().toUpperCase(),
        name: markName.trim(),
        description: markDesc.trim() || "– Без описания",
        recommendation: markRec.trim() || "Устранить в соответствии с регламентом."
      };
      onUpdateMarks([...marks, newMark]);
    }

    // Reset Form
    setMarkCode('');
    setMarkName('');
    setMarkDesc('');
    setMarkRec('');
  };

  const handleStartEditMark = (m: DefectMark) => {
    setEditingMarkId(m.id);
    setMarkCode(m.code);
    setMarkName(m.name);
    setMarkDesc(m.description);
    setMarkRec(m.recommendation);
  };

  const handleDeleteMark = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту марку дефекта? Она также пропадет из привязанных дефектов.")) {
      onUpdateMarks(marks.filter(m => m.id !== id));
    }
  };

  // Add/Edit Construction Type
  const handleSaveConst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constName.trim()) return;

    if (editingConstId) {
      // Edit
      const updated = constructions.map(c =>
        c.id === editingConstId
          ? { ...c, name: constName.trim(), coordType: constType }
          : c
      );
      onUpdateConstructions(updated);
      setEditingConstId(null);
    } else {
      // Add new
      const newConst: ConstructionType = {
        id: `const-${Date.now()}`,
        name: constName.trim(),
        coordType: constType
      };
      onUpdateConstructions([...constructions, newConst]);
    }

    // Reset Form
    setConstName('');
    setConstType('intersection');
  };

  const handleStartEditConst = (c: ConstructionType) => {
    setEditingConstId(c.id);
    setConstName(c.name);
    setConstType(c.coordType);
  };

  const handleDeleteConst = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот тип конструкции?")) {
      onUpdateConstructions(constructions.filter(c => c.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header and Sub-Tabs */}
      <div className="bg-slate-50/80 border-b border-slate-200/60 p-5 sm:flex items-center justify-between">
        <div className="flex items-center gap-2 mb-3 sm:mb-0">
          <Settings className="text-slate-800 h-4.5 w-4.5" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">База нормативных справочников</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/30">
          <button
            onClick={() => setSubTab('marks')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'marks'
                ? 'bg-white text-slate-900 border border-slate-200/50 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Марки и дефекты
          </button>
          <button
            onClick={() => setSubTab('constructions')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === 'constructions'
                ? 'bg-white text-slate-900 border border-slate-200/50 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Типы конструкций
          </button>
        </div>
      </div>

      <div className="p-6">
        {subTab === 'marks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Mark form */}
            <div className="lg:col-span-5 bg-slate-50/40 rounded-2xl border border-slate-200/60 p-6 h-fit">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
                {editingMarkId ? <Edit3 size={14} className="text-slate-800" /> : <Plus size={14} className="text-slate-800" />}
                {editingMarkId ? "Редактировать марку" : "Создать марку"}
              </h4>

              <form onSubmit={handleSaveMark} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Код</label>
                    <input
                      type="text"
                      required
                      placeholder="Т-01"
                      value={markCode}
                      onChange={(e) => setMarkCode(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-bold uppercase text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Наименование дефекта</label>
                    <input
                      type="text"
                      required
                      placeholder="Трещина волосяная..."
                      value={markName}
                      onChange={(e) => setMarkName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Описание дефекта (авто-абзацы)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Усадочные трещины на поверхности бетона...&#10;Каждая строка станет отдельным пунктом с маркером '–'"
                    value={markDesc}
                    onChange={(e) => setMarkDesc(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-slate-700 placeholder-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs"
                  />
                  <span className="text-[10px] font-medium text-slate-400 block mt-1.5">
                    Каждая новая строчка автоматически форматируется знаком «–».
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Рекомендация по устранению
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Выполнить инъектирование...&#10;При выборе нескольких дефектов они объединяются через точку."
                    value={markRec}
                    onChange={(e) => setMarkRec(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs"
                  />
                  <span className="text-[10px] font-medium text-slate-400 block mt-1.5">
                    Объединяются последовательно: «Рекомендация 1. Рекомендация 2...»
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {editingMarkId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMarkId(null);
                        setMarkCode('');
                        setMarkName('');
                        setMarkDesc('');
                        setMarkRec('');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    {editingMarkId ? "Сохранить изменения" : "Создать марку"}
                  </button>
                </div>
              </form>
            </div>

            {/* Marks List */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Список зарегистрированных марок ({marks.length})
                </span>
              </div>

              <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {marks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">Нет доступных марок дефектов</div>
                ) : (
                  marks.map(m => (
                    <div key={m.id} className="p-4 bg-white hover:bg-slate-50/30 transition-colors flex items-start gap-4">
                      <div className="shrink-0 bg-slate-100 border border-slate-200/60 text-slate-900 font-extrabold font-mono text-xs px-2.5 py-1 rounded-lg">
                        {m.code}
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="mt-2 text-slate-500 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Описание:</span>
                          <div className="pl-3 border-l-2 border-slate-300 bg-slate-50/40 py-2 px-2.5 rounded-xl whitespace-pre-line font-mono text-[11px] text-slate-700">
                            {m.description}
                          </div>
                        </div>
                        <div className="mt-2 text-slate-500 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Рекомендации:</span>
                          <p className="pl-3 border-l-2 border-slate-200 text-slate-600 italic">
                            {m.recommendation}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEditMark(m)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-all cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMark(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Construction form */}
            <div className="lg:col-span-5 bg-slate-50/40 rounded-2xl border border-slate-200/60 p-6 h-fit">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
                {editingConstId ? <Edit3 size={14} className="text-slate-800" /> : <Plus size={14} className="text-slate-800" />}
                {editingConstId ? "Редактировать конструкцию" : "Добавить конструкцию"}
              </h4>

              <form onSubmit={handleSaveConst} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Наименование конструкции</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Плита балкона..."
                    value={constName}
                    onChange={(e) => setConstName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all duration-150 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Способ координатной привязки
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                      constType === 'intersection'
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-950/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}>
                      <input
                        type="radio"
                        name="coordType"
                        value="intersection"
                        checked={constType === 'intersection'}
                        onChange={() => setConstType('intersection')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-800">На пересечении осей</span>
                      <span className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Обозначается одной парой осей (например: Б/3)</span>
                    </label>

                    <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                      constType === 'range'
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-950/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}>
                      <input
                        type="radio"
                        name="coordType"
                        value="range"
                        checked={constType === 'range'}
                        onChange={() => setConstType('range')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-800">В осях / пролете</span>
                      <span className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Обозначается диапазоном (например: А-Б / 1-2)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {editingConstId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingConstId(null);
                        setConstName('');
                        setConstType('intersection');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    {editingConstId ? "Сохранить" : "Создать тип"}
                  </button>
                </div>
              </form>
            </div>

            {/* Constructions list */}
            <div className="lg:col-span-7">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Существующие типы конструкций ({constructions.length})
              </span>

              <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">
                {constructions.map(c => (
                  <div key={c.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/30 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                      <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 font-medium">
                        <Layers size={11} />
                        <span>Координаты:</span>
                        <span className="font-bold text-slate-600">
                          {c.coordType === 'intersection' ? 'На пересечении осей (Б/3)' : 'Диапазон осей (А-Б / 1-2)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleStartEditConst(c)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteConst(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
