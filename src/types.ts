/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CoordinationType = 'intersection' | 'range';

export interface DefectMark {
  id: string;
  code: string;         // e.g. "Д-1" or "М-01"
  name: string;         // short name for reference, e.g. "Трещина в бетоне"
  description: string;  // Detailed descriptions (one or more lines, separated by newlines)
  recommendation: string; // Repair recommendation
}

export interface ConstructionType {
  id: string;
  name: string;         // e.g. "Колонна", "Пролет"
  coordType: CoordinationType; // "intersection" (на пересечении осей) or "range" (в осях)
}

export interface DefectLocation {
  constructionTypeId: string;
  axisLetterStart: string;
  axisLetterEnd?: string;
  axisNumberStart: string;
  axisNumberEnd?: string;
  comment?: string;
}

// Hierarchical Tree Models
export interface Building {
  id: string;
  name: string;         // e.g. "Производственный корпус №1"
  projectName: string;  // e.g. "Обследование несущих строительных конструкций..."
  axesLetters: string;  // "А, Б, В..."
  axesNumbers: string;  // "1, 2, 3..."
}

export interface BuildingConstruction {
  id: string;
  buildingId: string;
  constructionTypeId: string; // references ConstructionType
  location: DefectLocation;
  locationText: string;
}

export interface DefectItem {
  id: string;
  constructionId: string;
  defectNumber: string; // User-defined defect code (e.g. "Т-01")
  markIds: string[];
  customDescription?: string;
  customRecommendation?: string;
  note: string;
  photos: string[];     // Base64 compressed images (up to 2)
}

// Flat models for the A3 layout rendering
export interface DefectRow {
  id: string;
  type: 'defect';
  defectNumber: string; // Custom type-based number shown in the first column
  location: DefectLocation;
  locationText: string;
  markIds: string[];
  customDescription?: string;
  customRecommendation?: string;
  note: string;
  photos: string[];     // Base64 images
}

export interface SectionTitleRow {
  id: string;
  type: 'section';
  title: string;        // Section title (full width, 1cm height)
}

export type TableRow = DefectRow | SectionTitleRow;

export interface AppState {
  axesLetters: string;
  axesNumbers: string;
  marks: DefectMark[];
  constructions: ConstructionType[];
  rows: TableRow[];
}
