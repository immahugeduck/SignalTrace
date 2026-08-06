import { CellReading, TowerRecord } from '@/types';
import { fetchTowerFromOpenCellId } from './openCellIdService';
import { fetchTowerFromWigle } from './wigleService';

export async function resolveTower(reading: CellReading): Promise<TowerRecord | undefined> {
  const openCellTower = await fetchTowerFromOpenCellId(reading);
  if (openCellTower) {
    return openCellTower;
  }

  const wigleTower = await fetchTowerFromWigle(reading);
  if (wigleTower) {
    return wigleTower;
  }

  return undefined;
}
