/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefectMark, ConstructionType, TableRow } from './types';

export const DEFAULT_AXES_LETTERS = "А, Б, В, Г, Д, Е, Ж";
export const DEFAULT_AXES_NUMBERS = "1, 2, 3, 4, 5, 6, 7, 8";

export const DEFAULT_MARKS: DefectMark[] = [
  {
    id: "mark-1",
    code: "Т-01",
    name: "Волосяные трещины в бетоне",
    description: "Усадочные трещины на поверхности бетона с шириной раскрытия до 0.2 мм.\nНаличие сетки мелких поверхностных трещин.",
    recommendation: "Выполнить обеспыливание поверхности. Нанести гидрофобизирующий защитный состав в 2 слоя."
  },
  {
    id: "mark-2",
    code: "Т-02",
    name: "Силовые трещины в растянутой зоне",
    description: "Поперечные трещины в растянутой зоне плиты/балки с шириной раскрытия от 0.3 до 0.8 мм.\nПризнаки перегрузки конструкции.",
    recommendation: "Провести инъектирование трещин эпоксидными смолами под давлением. Выполнить поверочный расчет."
  },
  {
    id: "mark-3",
    code: "К-01",
    name: "Коррозия арматуры (начальная)",
    description: "Следы ржавчины на поверхности бетона вдоль рабочей арматуры.\nЛегкое шелушение защитного слоя бетона.",
    recommendation: "Вскрыть защитный слой в зоне следов коррозии. Очистить арматуру от ржавчины. Нанести пассивирующий грунт."
  },
  {
    id: "mark-4",
    code: "К-02",
    name: "Глубокая коррозия арматуры с оголением",
    description: "Оголение продольной рабочей арматуры со снижением площади сечения до 15%.\nРазрушение защитного слоя бетона на глубину более 30 мм.",
    recommendation: "Очистить оголенную арматуру пескоструйным методом. Выполнить усиление приваркой дополнительных стержней. Восстановить сечение полимерцементным составом."
  },
  {
    id: "mark-5",
    code: "С-01",
    name: "Механические сколы бетона ребер",
    description: "Сколы бетона на ребрах несущих конструкций глубиной до 50 мм.\nОголение хомутов или поперечной арматуры.",
    recommendation: "Очистить место скола от осыпающихся частиц. Обеспылить, нанести адгезионный состав. Омоноличить безусадочной ремонтной смесью."
  },
  {
    id: "mark-6",
    code: "П-01",
    name: "Протечки и высолы на плите",
    description: "Следы активных протечек на нижней поверхности плиты.\nНаличие кальциевых отложений (высолов) по трещинам и швам сопряжений.",
    recommendation: "Выполнить гидроизоляцию швов и примыканий с верхней стороны плиты. Расчистить высолы жесткой щеткой."
  },
  {
    id: "mark-7",
    code: "Ф-01",
    name: "Выветривание швов кирпичной кладки",
    description: "Выпадение раствора из швов кирпичной кладки фасада на глубину до 20 мм.\nОслабление сцепления отдельных кирпичей.",
    recommendation: "Выполнить расшивку и очистку швов. Произвести повторное заполнение швов цементно-песчаным раствором."
  }
];

export const DEFAULT_CONSTRUCTIONS: ConstructionType[] = [
  { id: "const-1", name: "Колонна", coordType: "intersection" },
  { id: "const-2", name: "Пролет", coordType: "range" },
  { id: "const-3", name: "Плита покрытия", coordType: "range" },
  { id: "const-4", name: "Плита перекрытия", coordType: "range" },
  { id: "const-5", name: "Стропильная балка", coordType: "range" },
  { id: "const-6", name: "Фасад", coordType: "range" },
  { id: "const-7", name: "Стена кирпичная", coordType: "range" },
  { id: "const-8", name: "Фундаментный блок", coordType: "intersection" }
];

export const DEFAULT_ROWS: TableRow[] = [
  {
    id: "sec-1",
    type: "section",
    title: "Раздел 1. Железобетонные конструкции перекрытий и колонны"
  },
  {
    id: "row-1",
    type: "defect",
    defectNumber: "Т-01",
    photos: [],
    location: {
      constructionTypeId: "const-1", // Колонна
      axisLetterStart: "Б",
      axisNumberStart: "3",
      comment: "на высоте 1.5м от пола"
    },
    locationText: "Колонна (ось Б/3, на высоте 1.5м от пола)",
    markIds: ["mark-1", "mark-3"], // Волосяные трещины + Коррозия (начальная)
    note: "Необходим мониторинг"
  },
  {
    id: "row-2",
    type: "defect",
    defectNumber: "Т-01",
    photos: [],
    location: {
      constructionTypeId: "const-4", // Плита перекрытия
      axisLetterStart: "Б",
      axisLetterEnd: "В",
      axisNumberStart: "2",
      axisNumberEnd: "4",
      comment: "в зоне сопряжения с ригелем"
    },
    locationText: "Плита перекрытия (в осях Б-В / 2-4, в зоне сопряжения с ригелем)",
    markIds: ["mark-6"], // Протечки и высолы
    note: "Срочный ремонт кровли"
  },
  {
    id: "sec-2",
    type: "section",
    title: "Раздел 2. Покрытие и стропильная система"
  },
  {
    id: "row-3",
    type: "defect",
    defectNumber: "Т-02",
    photos: [],
    location: {
      constructionTypeId: "const-5", // Стропильная балка
      axisLetterStart: "Г",
      axisLetterEnd: "Д",
      axisNumberStart: "5",
      axisNumberEnd: "6",
      comment: "опорный узел балки"
    },
    locationText: "Стропильная балка (в осях Г-Д / 5-6, опорный узел балки)",
    markIds: ["mark-2", "mark-4", "mark-5"], // Силовые трещины + Глубокая коррозия + Сколы бетона
    note: "Аварийный участок! Установить временные подпорки"
  },
  {
    id: "row-4",
    type: "defect",
    defectNumber: "Т-01",
    photos: [],
    location: {
      constructionTypeId: "const-3", // Плита покрытия
      axisLetterStart: "А",
      axisLetterEnd: "Б",
      axisNumberStart: "1",
      axisNumberEnd: "2",
      comment: "разрушение шва"
    },
    locationText: "Плита покрытия (в осях А-Б / 1-2, разрушение шва)",
    markIds: ["mark-1"],
    note: "Устранить при плановом ТО"
  }
];
