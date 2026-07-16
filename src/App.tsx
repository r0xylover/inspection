/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TableRow,
  DefectMark,
  ConstructionType,
  DefectLocation,
  Building,
  BuildingConstruction,
  DefectItem
} from './types';
import {
  DEFAULT_MARKS,
  DEFAULT_CONSTRUCTIONS
} from './data';
import {
  compileLocationText,
  getMarkFormattedDescription,
  getMarkFormattedRecommendation,
  compressImage,
  generateCrackPlaceholder
} from './utils';
import MarkDropdown from './components/MarkDropdown';
import LocationPicker from './components/LocationPicker';
import SettingsMenu from './components/SettingsMenu';
import A3Preview from './components/A3Preview';
import {
  FileText,
  LayoutGrid,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Layers,
  HelpCircle,
  Hash,
  MapPin,
  Sparkles,
  Camera,
  Folder,
  ArrowRight,
  ChevronRight,
  Layout,
  Info,
  Edit2
} from 'lucide-react';

export default function App() {
  // --- Core State with LocalStorage persistence ---
  const [marks, setMarks] = useState<DefectMark[]>(() => {
    const saved = localStorage.getItem('a3_marks');
    return saved ? JSON.parse(saved) : DEFAULT_MARKS;
  });

  const [constructions, setConstructions] = useState<ConstructionType[]>(() => {
    const saved = localStorage.getItem('a3_constructions');
    return saved ? JSON.parse(saved) : DEFAULT_CONSTRUCTIONS;
  });

  // --- Tree-based Hierarchical Database State ---
  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem('a3_buildings_tree');
    if (saved) return JSON.parse(saved);

    // Bootstrap initial building
    return [{
      id: 'building-1',
      name: 'Производственный корпус №3, Литера Б',
      projectName: 'Обследование несущих строительных конструкций производственного комплекса',
      axesLetters: 'А, Б, В, Г, Д',
      axesNumbers: '1, 2, 3, 4, 5, 6, 7'
    }];
  });

  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(() => {
    const saved = localStorage.getItem('a3_active_building_id');
    return saved || 'building-1';
  });

  const [buildingConstructions, setBuildingConstructions] = useState<BuildingConstruction[]>(() => {
    const saved = localStorage.getItem('a3_building_constructions_tree');
    if (saved) return JSON.parse(saved);

    // Bootstrap initial constructions under building-1
    return [
      {
        id: 'bc-1',
        buildingId: 'building-1',
        constructionTypeId: 'const-1', // Колонна
        location: {
          constructionTypeId: 'const-1',
          axisLetterStart: 'Б',
          axisNumberStart: '3'
        },
        locationText: 'Колонна (ось Б/3)'
      },
      {
        id: 'bc-2',
        buildingId: 'building-1',
        constructionTypeId: 'const-2', // Плита покрытия
        location: {
          constructionTypeId: 'const-2',
          axisLetterStart: 'А',
          axisLetterEnd: 'Б',
          axisNumberStart: '1',
          axisNumberEnd: '2',
          comment: 'в пролете'
        },
        locationText: 'Плита перекрытия (в осях А-Б / 1-2, в пролете)'
      }
    ];
  });

  const [activeConstructionId, setActiveConstructionId] = useState<string | null>(() => {
    return localStorage.getItem('a3_active_construction_id') || null;
  });

  const [buildingDefects, setBuildingDefects] = useState<DefectItem[]>(() => {
    const saved = localStorage.getItem('a3_building_defects_tree');
    if (saved) return JSON.parse(saved);

    // Bootstrap initial defects with actual generated crack photos
    return [
      {
        id: 'def-1',
        constructionId: 'bc-1',
        defectNumber: 'Т-01',
        markIds: ['mark-1'],
        note: 'Требуется мониторинг раскрытия трещин',
        photos: typeof document !== 'undefined' ? [generateCrackPlaceholder('Дефект Т-01: трещина в колонне Б/3')] : []
      },
      {
        id: 'def-2',
        constructionId: 'bc-2',
        defectNumber: 'Т-01',
        markIds: ['mark-1'],
        note: 'Рекомендуется герметизация стыков',
        photos: typeof document !== 'undefined' ? [generateCrackPlaceholder('Дефект Т-01: трещина в плите перекрытия А-Б')] : []
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'settings' | 'help'>('editor');
  
  // Inline editing / adding helper states
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingProject, setNewBuildingProject] = useState('');
  const [newBuildingLetters, setNewBuildingLetters] = useState('А, Б, В, Г');
  const [newBuildingNumbers, setNewBuildingNumbers] = useState('1, 2, 3, 4');

  const [isAddingConstruction, setIsAddingConstruction] = useState(false);
  const [expandedDefectIds, setExpandedDefectIds] = useState<Record<string, boolean>>({});
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);

  // --- Synchronization with LocalStorage ---
  useEffect(() => {
    localStorage.setItem('a3_marks', JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('a3_constructions', JSON.stringify(constructions));
  }, [constructions]);

  useEffect(() => {
    localStorage.setItem('a3_buildings_tree', JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    if (activeBuildingId) {
      localStorage.setItem('a3_active_building_id', activeBuildingId);
    } else {
      localStorage.removeItem('a3_active_building_id');
    }
  }, [activeBuildingId]);

  useEffect(() => {
    localStorage.setItem('a3_building_constructions_tree', JSON.stringify(buildingConstructions));
  }, [buildingConstructions]);

  useEffect(() => {
    if (activeConstructionId) {
      localStorage.setItem('a3_active_construction_id', activeConstructionId);
    } else {
      localStorage.removeItem('a3_active_construction_id');
    }
  }, [activeConstructionId]);

  useEffect(() => {
    localStorage.setItem('a3_building_defects_tree', JSON.stringify(buildingDefects));
  }, [buildingDefects]);

  // Upgrade legacy local storage data that has 'Фото 1' / 'Фото 2' placeholder text with actual programmatically generated concrete crack images
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let changed = false;
    const upgradedDefects = buildingDefects.map(def => {
      if (def.id === 'def-1' && (def.note === 'Фото 1' || def.photos.length === 0)) {
        changed = true;
        return {
          ...def,
          note: def.note === 'Фото 1' ? 'Требуется мониторинг раскрытия трещин' : def.note,
          photos: def.photos.length === 0 ? [generateCrackPlaceholder('Дефект Т-01: трещина в колонне Б/3')] : def.photos
        };
      }
      if (def.id === 'def-2' && (def.note === 'Фото 2' || def.photos.length === 0)) {
        changed = true;
        return {
          ...def,
          note: def.note === 'Фото 2' ? 'Рекомендуется герметизация стыков' : def.note,
          photos: def.photos.length === 0 ? [generateCrackPlaceholder('Дефект Т-01: трещина в плите перекрытия А-Б')] : def.photos
        };
      }
      return def;
    });

    if (changed) {
      setBuildingDefects(upgradedDefects);
    }
  }, []);

  // --- Active Building Metadata Helpers ---
  const activeBuilding = useMemo(() => {
    return buildings.find(b => b.id === activeBuildingId) || null;
  }, [buildings, activeBuildingId]);

  const activeConstruction = useMemo(() => {
    return buildingConstructions.find(c => c.id === activeConstructionId) || null;
  }, [buildingConstructions, activeConstructionId]);

  // --- Compilation into Flat TableRow[] for rendering in A3 Preview ---
  const previewRows = useMemo<TableRow[]>(() => {
    const previewBuildingId = activeBuildingId || (buildings[0]?.id || null);
    if (!previewBuildingId) return [];

    const bConsts = buildingConstructions.filter(bc => bc.buildingId === previewBuildingId);
    
    // Group constructions by constructionTypeId
    const constsByType: Record<string, BuildingConstruction[]> = {};
    bConsts.forEach(bc => {
      if (!constsByType[bc.constructionTypeId]) {
        constsByType[bc.constructionTypeId] = [];
      }
      constsByType[bc.constructionTypeId].push(bc);
    });

    const result: TableRow[] = [];

    // Map singular to plural for default construction types
    const pluralMap: Record<string, string> = {
      "Колонна": "Колонны",
      "Пролет": "Пролеты",
      "Плита покрытия": "Плиты покрытия",
      "Плита перекрытия": "Плиты перекрытия",
      "Стропильная балка": "Стропильные балки",
      "Фасад": "Фасады",
      "Стена кирпичная": "Стены кирпичные",
      "Фундаментный блок": "Фундаментные блоки"
    };

    const getGroupTitle = (typeId: string): string => {
      const cType = constructions.find(c => c.id === typeId);
      if (!cType) return "Другие конструкции";
      const name = cType.name;
      return pluralMap[name] || name;
    };

    // Iterate over the types of constructions present in this building
    Object.keys(constsByType).forEach(typeId => {
      const groupConsts = constsByType[typeId];
      
      // Let's find all defects for all constructions in this group
      const groupDefects: { d: DefectItem; bc: BuildingConstruction }[] = [];
      groupConsts.forEach(bc => {
        const cDefects = buildingDefects.filter(d => d.constructionId === bc.id);
        cDefects.forEach(d => {
          groupDefects.push({ d, bc });
        });
      });

      if (groupDefects.length > 0) {
        result.push({
          id: `section-header-type-${typeId}`,
          type: 'section',
          title: getGroupTitle(typeId)
        });

        groupDefects.forEach(({ d, bc }) => {
          result.push({
            id: d.id,
            type: 'defect',
            defectNumber: d.defectNumber,
            location: bc.location,
            locationText: bc.locationText,
            markIds: d.markIds,
            customDescription: d.customDescription,
            customRecommendation: d.customRecommendation,
            note: d.note,
            photos: d.photos
          });
        });
      }
    });

    return result;
  }, [activeBuildingId, buildings, buildingConstructions, buildingDefects, constructions]);

  // --- State Actions for Buildings ---
  const handleCreateBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) return;

    const newB: Building = {
      id: `building-${Date.now()}`,
      name: newBuildingName.trim(),
      projectName: newBuildingProject.trim() || 'Обследование несущих строительных конструкций',
      axesLetters: newBuildingLetters.trim() || 'А, Б, В',
      axesNumbers: newBuildingNumbers.trim() || '1, 2, 3'
    };

    setBuildings([...buildings, newB]);
    setActiveBuildingId(newB.id);
    setActiveConstructionId(null);
    setIsAddingBuilding(false);
    
    // Reset form
    setNewBuildingName('');
    setNewBuildingProject('');
    setNewBuildingLetters('А, Б, В, Г');
    setNewBuildingNumbers('1, 2, 3, 4');
  };

  const handleDeleteBuilding = (id: string, name: string) => {
    if (confirm(`Вы уверены, что хотите удалить здание "${name}"? Вместе с ним будут удалены все его конструкции и дефекты.`)) {
      setBuildings(buildings.filter(b => b.id !== id));
      setBuildingConstructions(buildingConstructions.filter(bc => bc.buildingId !== id));
      // Delete child defects
      const childConstIds = buildingConstructions.filter(bc => bc.buildingId === id).map(bc => bc.id);
      setBuildingDefects(buildingDefects.filter(d => !childConstIds.includes(d.constructionId)));

      if (activeBuildingId === id) {
        setActiveBuildingId(null);
        setActiveConstructionId(null);
      }
    }
  };

  // --- State Actions for Constructions ---
  const handleSaveConstruction = (loc: DefectLocation, compiledText: string) => {
    if (!activeBuildingId) return;

    const newBC: BuildingConstruction = {
      id: `bc-${Date.now()}`,
      buildingId: activeBuildingId,
      constructionTypeId: loc.constructionTypeId,
      location: loc,
      locationText: compiledText
    };

    setBuildingConstructions([...buildingConstructions, newBC]);
    setIsAddingConstruction(false);
    // Auto open defects for newly created construction
    setActiveConstructionId(newBC.id);
  };

  const handleDeleteConstruction = (id: string, name: string) => {
    if (confirm(`Вы уверены, что хотите удалить конструкцию "${name}"? Вместе с ней будут удалены все её дефекты.`)) {
      setBuildingConstructions(buildingConstructions.filter(bc => bc.id !== id));
      setBuildingDefects(buildingDefects.filter(d => d.constructionId !== id));
      if (activeConstructionId === id) {
        setActiveConstructionId(null);
      }
    }
  };

  // --- State Actions for Defects ---
  const handleAddDefectItem = () => {
    if (!activeConstructionId) return;

    const defaultMark = marks[0];
    const defaultNum = defaultMark ? defaultMark.code : 'Т-01';
    const newId = `def-${Date.now()}`;

    const newDef: DefectItem = {
      id: newId,
      constructionId: activeConstructionId,
      defectNumber: defaultNum,
      markIds: defaultMark ? [defaultMark.id] : [],
      note: '',
      photos: []
    };

    setBuildingDefects([...buildingDefects, newDef]);

    // Collapse all other defects of the current construction, expand the new one
    const newExpanded: Record<string, boolean> = {};
    buildingDefects.forEach(d => {
      newExpanded[d.id] = false;
    });
    newExpanded[newId] = true;
    setExpandedDefectIds(newExpanded);
  };

  const handleUpdateDefectItem = (defectId: string, updates: Partial<DefectItem>) => {
    setBuildingDefects(buildingDefects.map(d => d.id === defectId ? { ...d, ...updates } : d));
  };

  const handleDeleteDefectItem = (defectId: string) => {
    setBuildingDefects(buildingDefects.filter(d => d.id !== defectId));
  };

  // Auto-fill code/number based on the selected mark
  const handleDefectMarkChange = (defectId: string, selectedMarkIds: string[]) => {
    setBuildingDefects(buildingDefects.map(d => {
      if (d.id === defectId) {
        let newNum = d.defectNumber;
        if (selectedMarkIds.length > 0) {
          const firstMark = marks.find(m => m.id === selectedMarkIds[0]);
          if (firstMark) {
            newNum = firstMark.code;
          }
        } else {
          newNum = '';
        }
        return {
          ...d,
          markIds: selectedMarkIds,
          defectNumber: newNum
        };
      }
      return d;
    }));
  };

  // --- Backup Import / Export (Hierarchical) ---
  const handleExportTree = () => {
    const exportObject = {
      version: "2.0_tree",
      marks,
      constructions,
      buildings,
      buildingConstructions,
      buildingDefects
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `древовидный_проект_ведомость_дефектов_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTree = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.version === "2.0_tree" || parsed.buildings) {
          if (parsed.marks) setMarks(parsed.marks);
          if (parsed.constructions) setConstructions(parsed.constructions);
          if (parsed.buildings) setBuildings(parsed.buildings);
          if (parsed.buildingConstructions) setBuildingConstructions(parsed.buildingConstructions);
          if (parsed.buildingDefects) setBuildingDefects(parsed.buildingDefects);
          
          if (parsed.buildings && parsed.buildings.length > 0) {
            setActiveBuildingId(parsed.buildings[0].id);
            setActiveConstructionId(null);
          }
          alert("Проект дерева дефектов здания успешно импортирован!");
        } else {
          alert("Этот файл не является новым древовидным проектом. Попробуйте сбросить к демо.");
        }
      } catch (err) {
        alert("Ошибка импорта! Невалидный JSON файл.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaultsTree = () => {
    if (confirm("Вы уверены, что хотите сбросить проект к демонстрационным данным? Все текущие несохраненные изменения будут перезаписаны.")) {
      setMarks(DEFAULT_MARKS);
      setConstructions(DEFAULT_CONSTRUCTIONS);
      setBuildings([{
        id: 'building-1',
        name: 'Производственный корпус №3, Литера Б',
        projectName: 'Обследование несущих строительных конструкций производственного комплекса',
        axesLetters: 'А, Б, В, Г, Д',
        axesNumbers: '1, 2, 3, 4, 5, 6, 7'
      }]);
      setBuildingConstructions([
        {
          id: 'bc-1',
          buildingId: 'building-1',
          constructionTypeId: 'const-1',
          location: {
            constructionTypeId: 'const-1',
            axisLetterStart: 'Б',
            axisNumberStart: '3'
          },
          locationText: 'Колонна (ось Б/3)'
        },
        {
          id: 'bc-2',
          buildingId: 'building-1',
          constructionTypeId: 'const-2',
          location: {
            constructionTypeId: 'const-2',
            axisLetterStart: 'А',
            axisLetterEnd: 'Б',
            axisNumberStart: '1',
            axisNumberEnd: '2',
            comment: 'в пролете'
          },
          locationText: 'Плита перекрытия (в осях А-Б / 1-2, в пролете)'
        }
      ]);
      setBuildingDefects([
        {
          id: 'def-1',
          constructionId: 'bc-1',
          defectNumber: 'Т-01',
          markIds: ['mark-1'],
          note: 'Фото 1',
          photos: []
        },
        {
          id: 'def-2',
          constructionId: 'bc-2',
          defectNumber: 'Т-01',
          markIds: ['mark-1'],
          note: 'Фото 2',
          photos: []
        }
      ]);
      setActiveBuildingId('building-1');
      setActiveConstructionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 flex flex-col antialiased select-text">
      {/* Top Banner (No Print) */}
      <header className="no-print bg-slate-950 text-white border-b border-slate-800 shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700/80 text-sky-400 p-2.5 rounded-xl shadow-xs flex items-center justify-center">
              <Layers className="h-5.5 w-5.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">Ведомость Дефектов А3</h1>
              </div>
            </div>
          </div>

          {/* Global Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetDefaultsTree}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 transition-all shadow-xs cursor-pointer font-medium"
              title="Загрузить демонстрационный проект"
            >
              <RefreshCw size={13} className="text-slate-400" />
              <span>Сбросить к демо</span>
            </button>

            <button
              onClick={handleExportTree}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-sky-950 rounded-lg hover:bg-sky-950/40 transition-all font-semibold shadow-xs cursor-pointer"
              title="Скачать файл иерархического проекта JSON"
            >
              <Download size={13} />
              <span>Сохранить файл дерева</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-all shadow-xs font-medium">
              <Upload size={13} className="text-slate-400" />
              <span>Загрузить проект</span>
              <input type="file" accept=".json" onChange={handleImportTree} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-6 flex flex-col min-h-0">
        
        {/* Navigation Tabs (No Print) */}
        <div className="no-print grid grid-cols-3 sm:flex border border-slate-200/80 mb-6 gap-1 bg-white p-1 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">Дерево ({buildings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={14} className="shrink-0" />
            <span className="truncate">Предпросмотр А3</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings size={14} className="shrink-0" />
            <span className="truncate">База марок</span>
          </button>
        </div>

        {/* Dynamic Content Views */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* TAB 1: EDITOR (THREE LEVEL TREE HIERARCHY) */}
          {activeTab === 'editor' && (
            <div className="no-print space-y-6 flex flex-col">
              
              {/* LEVEL 1: BUILDINGS VIEW (If no building selected) */}
              {!activeBuildingId && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">Здания проекта</h2>
                    <button
                      onClick={() => setIsAddingBuilding(!isAddingBuilding)}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus size={14} />
                      <span>Добавить здание</span>
                    </button>
                  </div>

                  {/* Add building form */}
                  {isAddingBuilding && (
                    <form onSubmit={handleCreateBuilding} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Карточка нового здания</h4>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingBuilding(false)} 
                          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Отмена
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Наименование здания / корпуса</label>
                          <input
                            type="text"
                            required
                            placeholder="Например: Производственный цех №3, Литера Б"
                            value={newBuildingName}
                            onChange={(e) => setNewBuildingName(e.target.value)}
                            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 focus:bg-white focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Наименование проекта обследования</label>
                          <input
                            type="text"
                            placeholder="Обследование несущих строительных конструкций здания"
                            value={newBuildingProject}
                            onChange={(e) => setNewBuildingProject(e.target.value)}
                            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 focus:bg-white focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Буквенные оси</label>
                            <input
                              type="text"
                              value={newBuildingLetters}
                              onChange={(e) => setNewBuildingLetters(e.target.value)}
                              className="w-full text-xs font-mono rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 focus:bg-white focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Цифровые оси</label>
                            <input
                              type="text"
                              value={newBuildingNumbers}
                              onChange={(e) => setNewBuildingNumbers(e.target.value)}
                              className="w-full text-xs font-mono rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 focus:bg-white focus:border-slate-800 focus:outline-hidden transition-all shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Создать и открыть
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Buildings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {buildings.map(b => {
                      const constsCount = buildingConstructions.filter(bc => bc.buildingId === b.id).length;
                      const childConstIds = buildingConstructions.filter(bc => bc.buildingId === b.id).map(bc => bc.id);
                      const defectsCount = buildingDefects.filter(d => childConstIds.includes(d.constructionId)).length;

                      const isEditing = editingBuildingId === b.id;

                      return (
                        <div key={b.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                <Folder className="h-5 w-5" />
                              </div>
                              <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBuildingId(isEditing ? null : b.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer"
                                  title="Изменить оси"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBuilding(b.id, b.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Удалить здание"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase">Оси Буквенные</label>
                                  <input
                                    type="text"
                                    value={b.axesLetters}
                                    onChange={(e) => setBuildings(buildings.map(x => x.id === b.id ? { ...x, axesLetters: e.target.value } : x))}
                                    className="w-full text-xs font-mono bg-white border border-slate-200 p-1.5 rounded mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase">Оси Цифровые</label>
                                  <input
                                    type="text"
                                    value={b.axesNumbers}
                                    onChange={(e) => setBuildings(buildings.map(x => x.id === b.id ? { ...x, axesNumbers: e.target.value } : x))}
                                    className="w-full text-xs font-mono bg-white border border-slate-200 p-1.5 rounded mt-1"
                                  />
                                </div>
                                <button 
                                  onClick={() => setEditingBuildingId(null)}
                                  className="bg-slate-900 text-white px-2 py-1 text-[10px] font-bold rounded"
                                >
                                  Готово
                                </button>
                              </div>
                            ) : (
                              <div className="mt-4">
                                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">{b.name}</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium italic truncate">{b.projectName}</p>
                              </div>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Конструкций</span>
                                <span className="text-sm font-extrabold text-slate-800 mt-1 block">{constsCount}</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Дефектов</span>
                                <span className="text-sm font-extrabold text-slate-800 mt-1 block">{defectsCount}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setActiveBuildingId(b.id);
                              setActiveConstructionId(null);
                            }}
                            className="mt-5 w-full bg-slate-50 hover:bg-slate-950 hover:text-white text-slate-800 border border-slate-200/60 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Открыть конструкции</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LEVEL 2: CONSTRUCTIONS OF SELECTED BUILDING */}
              {activeBuildingId && !activeConstructionId && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Breadcrumb / Navigation bar */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-400 min-w-0">
                      <button onClick={() => setActiveBuildingId(null)} className="hover:text-slate-900 transition-colors cursor-pointer shrink-0">Здания</button>
                      <ChevronRight size={12} className="text-slate-300 shrink-0" />
                      <span className="text-slate-900 break-words">{activeBuilding?.name}</span>
                    </div>

                    <button
                      onClick={() => setActiveBuildingId(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shrink-0 w-full sm:w-auto text-center"
                    >
                      ← Назад к списку зданий
                    </button>
                  </div>

                  {/* Header Title & Add Construction toggler */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">
                      Конструктивные элементы ({buildingConstructions.filter(bc => bc.buildingId === activeBuildingId).length})
                    </h2>

                    <button
                      onClick={() => setIsAddingConstruction(!isAddingConstruction)}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus size={14} />
                      <span>{isAddingConstruction ? "Свернуть" : "Добавить элемент"}</span>
                    </button>
                  </div>

                  {/* Coordinate and Location Picker inline */}
                  {isAddingConstruction && (
                    <div className="animate-in fade-in duration-200">
                      <LocationPicker
                        constructions={constructions}
                        axesLetters={activeBuilding?.axesLetters || 'А, Б, В'}
                        axesNumbers={activeBuilding?.axesNumbers || '1, 2, 3'}
                        onSave={handleSaveConstruction}
                        onCancel={() => setIsAddingConstruction(false)}
                      />
                    </div>
                  )}

                  {/* List of constructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildingConstructions.filter(bc => bc.buildingId === activeBuildingId).length === 0 ? (
                      <div className="md:col-span-2 lg:col-span-3 py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                        <MapPin className="h-12 w-12 text-slate-300 mb-4 stroke-[1.5]" />
                        <p className="font-bold text-slate-700 text-base">Конструктивные элементы не зарегистрированы</p>
                      </div>
                    ) : (
                      buildingConstructions.filter(bc => bc.buildingId === activeBuildingId).map(bc => {
                        const defectsCount = buildingDefects.filter(d => d.constructionId === bc.id).length;
                        const cType = constructions.find(c => c.id === bc.constructionTypeId);

                        return (
                          <div key={bc.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="bg-slate-100 text-slate-700 border border-slate-200/50 text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md">
                                  {cType?.name || 'Элемент'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConstruction(bc.id, bc.locationText);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Удалить конструкция"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div className="mt-4">
                                <h4 className="font-extrabold text-slate-900 text-sm break-words">{bc.locationText}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide uppercase">
                                  Координаты: {cType?.coordType === 'intersection' ? 'Пересечение' : 'Диапазон'}
                                </p>
                              </div>

                              <div className="mt-4 bg-slate-50 border border-slate-200/40 rounded-xl px-3.5 py-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-bold">Выявлено дефектов:</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                  defectsCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200/40' : 'bg-slate-200 text-slate-600'
                                }}`}>
                                  {defectsCount}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setActiveConstructionId(bc.id)}
                              className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span>Карта дефектов</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* LEVEL 3: DEFECTS OF ACTIVE CONSTRUCTION */}
              {activeBuildingId && activeConstructionId && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Breadcrumb */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-400 min-w-0">
                      <button onClick={() => setActiveBuildingId(null)} className="hover:text-slate-900 cursor-pointer shrink-0">Здания</button>
                      <ChevronRight size={12} className="text-slate-300 shrink-0" />
                      <button onClick={() => setActiveConstructionId(null)} className="hover:text-slate-900 cursor-pointer break-words max-w-[120px] sm:max-w-none truncate sm:normal-case shrink-0">{activeBuilding?.name}</button>
                      <ChevronRight size={12} className="text-slate-300 shrink-0" />
                      <span className="text-slate-900 break-words">{activeConstruction?.locationText}</span>
                    </div>

                    <button
                      onClick={() => setActiveConstructionId(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shrink-0 w-full sm:w-auto text-center"
                    >
                      ← Назад
                    </button>
                  </div>

                  {/* Header & Add Defect */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">Дефекты элемента</h2>

                    <button
                      onClick={handleAddDefectItem}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus size={14} />
                      <span>Добавить дефект</span>
                    </button>
                  </div>

                  {/* Defects Grid / List */}
                  <div className="space-y-5">
                    {buildingDefects.filter(d => d.constructionId === activeConstructionId).length === 0 ? (
                      <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                        <Camera className="h-12 w-12 text-slate-300 mb-4 stroke-[1.5]" />
                        <p className="font-bold text-slate-700 text-base">Повреждения не зафиксированы</p>
                      </div>
                    ) : (
                      buildingDefects.filter(d => d.constructionId === activeConstructionId).map((def, dIdx) => {
                        const autoDesc = getMarkFormattedDescription(def.markIds, marks);
                        const autoRec = getMarkFormattedRecommendation(def.markIds, marks);

                        // Is this defect currently expanded?
                        const isExpanded = expandedDefectIds[def.id] !== false;

                        if (!isExpanded) {
                          // Collapsed Summary Card (Minimalistic click-to-expand card)
                          const selectedMarks = marks.filter(m => def.markIds.includes(m.id));
                          const markText = selectedMarks.map(m => m.code).join(', ') || 'Марка не выбрана';
                          const nameText = selectedMarks.map(m => m.name).join(', ') || '';

                          return (
                            <div 
                              key={def.id} 
                              onClick={() => setExpandedDefectIds(prev => ({ ...prev, [def.id]: true }))}
                              className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between border-l-4 border-slate-400 select-none animate-in fade-in duration-100"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <span className="bg-slate-100 text-slate-700 text-[11px] font-black px-2.5 py-1 rounded-lg font-mono tracking-wide">
                                  #{dIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-xs text-slate-900 bg-slate-100 border border-slate-200/40 px-2 py-0.5 rounded-md font-mono">
                                      {markText}
                                    </span>
                                    {nameText && (
                                      <span className="font-bold text-slate-700 text-xs truncate max-w-md">
                                        {nameText}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                                    {def.note && (
                                      <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.2 rounded text-slate-500">
                                        Прим: {def.note}
                                      </span>
                                    )}
                                    <span>
                                      {def.photos.length > 0 ? `📷 {def.photos.length} фото` : 'Нет фото'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDefectItem(def.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Удалить дефект"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <span className="text-slate-400 p-1">
                                  <ChevronRight size={16} />
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={def.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-sm transition-all relative flex flex-col gap-5 border-l-4 border-slate-950 animate-in fade-in duration-100">
                            
                            {/* Defect Header Block */}
                            <div 
                              className="flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer select-none"
                              onClick={() => setExpandedDefectIds(prev => ({ ...prev, [def.id]: false }))}
                              title="Нажмите, чтобы свернуть"
                            >
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-lg font-mono tracking-wide">
                                  #{dIdx + 1}
                                </span>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Параметры дефекта (Нажмите, чтобы свернуть)</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDefectItem(def.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Удалить дефект"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <span className="text-slate-400 p-1">
                                  <ChevronRight size={16} className="rotate-90 transition-transform" />
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              
                              {/* Left Column (Dropdown + Note) (4 cols) */}
                              <div className="lg:col-span-4 space-y-4">
                                {/* Defect Mark Dropdown Selection */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Марка дефекта (выберите из селектора)
                                  </label>
                                  <MarkDropdown
                                    allMarks={marks}
                                    selectedMarkIds={def.markIds}
                                    onChange={(ids) => handleDefectMarkChange(def.id, ids)}
                                  />
                                  <span className="text-[9px] text-slate-400 font-medium block mt-1 leading-relaxed">
                                    Шифр дефекта сформируется автоматически на основе кода выбранной марки.
                                  </span>
                                </div>

                                {/* Note (Col 5) */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Примечание (Колонка 5)
                                  </label>
                                  <input
                                    type="text"
                                    value={def.note}
                                    onChange={(e) => handleUpdateDefectItem(def.id, { note: e.target.value })}
                                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:outline-hidden transition-all shadow-2xs"
                                    placeholder="Фото 1, Чертеж КЖ-1..."
                                  />
                                </div>
                              </div>

                              {/* Middle Column (Photo upload + toggles) (4 cols) */}
                              <div className="lg:col-span-4 space-y-4">
                                <div className="space-y-2">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Фотографии дефекта (Макс. 2, авто-сжатие)
                                  </span>
                                  <div className="flex gap-3 flex-wrap">
                                    {def.photos.length < 2 && (
                                      <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl p-3 cursor-pointer transition-all w-24 h-24 shrink-0">
                                        <Camera size={18} className="text-slate-500 mb-1" />
                                        <span className="text-[8px] font-bold text-slate-500 text-center">Подгрузить фото</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              // Automatic compression
                                              const compressedBase64 = await compressImage(file);
                                              const updatedPhotos = [...def.photos, compressedBase64];
                                              handleUpdateDefectItem(def.id, { photos: updatedPhotos });
                                            } catch (err) {
                                              alert("Ошибка сжатия изображения: " + err);
                                            }
                                          }}
                                        />
                                      </label>
                                    )}

                                    {/* Display selected photos */}
                                    {def.photos.map((photo, pIdx) => (
                                      <div key={pIdx} className="relative w-24 h-24 border border-slate-200 rounded-xl overflow-hidden group shadow-2xs shrink-0">
                                        <img src={photo} alt="Сжатый дефект" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedPhotos = def.photos.filter((_, idx) => idx !== pIdx);
                                            handleUpdateDefectItem(def.id, { photos: updatedPhotos });
                                          }}
                                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all cursor-pointer shadow-xs"
                                          title="Удалить"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white font-semibold px-1 rounded-sm select-none">
                                          Фото {pIdx + 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Override options toggles */}
                                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/40">
                                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-600 font-bold">
                                    <input
                                      type="checkbox"
                                      checked={def.customDescription !== undefined}
                                      onChange={(e) => {
                                        const use_custom = e.target.checked;
                                        handleUpdateDefectItem(def.id, {
                                          customDescription: use_custom ? autoDesc : undefined
                                        });
                                      }}
                                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    Ввести свой текст дефекта
                                  </label>

                                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-600 font-bold">
                                    <input
                                      type="checkbox"
                                      checked={def.customRecommendation !== undefined}
                                      onChange={(e) => {
                                        const use_custom = e.target.checked;
                                        handleUpdateDefectItem(def.id, {
                                          customRecommendation: use_custom ? autoRec : undefined
                                        });
                                      }}
                                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    Ввести свой текст рекомендации
                                  </label>
                                </div>
                              </div>

                              {/* Overrides / Live previews Column (4 cols) */}
                              <div className="lg:col-span-4 space-y-4 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-200/40">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Характер дефекта:</span>
                                    {def.customDescription !== undefined && (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">Свой текст</span>
                                    )}
                                  </div>
                                  
                                  {def.customDescription !== undefined ? (
                                    <textarea
                                      rows={2}
                                      value={def.customDescription}
                                      onChange={(e) => handleUpdateDefectItem(def.id, { customDescription: e.target.value })}
                                      className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden font-mono text-slate-700 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="bg-slate-100/40 border border-slate-200/30 p-2.5 rounded-xl text-[10px] font-mono whitespace-pre-line text-slate-600 max-h-[85px] overflow-y-auto leading-relaxed">
                                      {autoDesc}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Рекомендации по ремонту:</span>
                                    {def.customRecommendation !== undefined && (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">Свой текст</span>
                                    )}
                                  </div>
                                  
                                  {def.customRecommendation !== undefined ? (
                                    <textarea
                                      rows={2}
                                      value={def.customRecommendation}
                                      onChange={(e) => handleUpdateDefectItem(def.id, { customRecommendation: e.target.value })}
                                      className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:border-slate-800 focus:outline-hidden font-mono text-slate-700 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="bg-slate-100/40 border border-slate-200/30 p-2.5 rounded-xl text-[10px] text-slate-500 italic max-h-[85px] overflow-y-auto leading-relaxed">
                                      {autoRec}
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              
            </div>
          )}

          {/* TAB 2: A3 PREVIEW */}
          {activeTab === 'preview' && (
            <div className="flex-1 flex flex-col">
              <A3Preview
                rows={previewRows}
                marks={marks}
                constructions={constructions}
                axesLetters={activeBuilding?.axesLetters || 'А, Б, В'}
                axesNumbers={activeBuilding?.axesNumbers || '1, 2, 3'}
                projectName={activeBuilding?.projectName}
                buildingName={activeBuilding?.name}
              />
            </div>
          )}

          {/* TAB 3: SETTINGS & DATABASES */}
          {activeTab === 'settings' && (
            <div className="no-print">
              <SettingsMenu
                marks={marks}
                constructions={constructions}
                onUpdateMarks={setMarks}
                onUpdateConstructions={setConstructions}
              />
            </div>
          )}

        </div>
      </main>

      {/* Footer (No Print) */}
      <footer className="no-print mt-auto bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-400 shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-slate-500 font-mono text-[10px]">Координатная сетка А3 • Автоматическое форматирование ГОСТ</p>
        </div>
      </footer>
    </div>
  );
}
