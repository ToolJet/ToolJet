export enum LayoutDimensionUnits {
  COUNT = 'count',
  PERCENT = 'percent',
}

export const resolveGridPositionForComponent = (dimension: number, type: string) => {
  // const numberOfGrids = type === 'desktop' ? 43 : 12;
  const numberOfGrids = 43;
  return Math.round((dimension * numberOfGrids) / 100);
};
