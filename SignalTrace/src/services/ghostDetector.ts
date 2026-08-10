import { CellReading, GhostAssessment, TowerRecord } from '@/types';
import { normalizeScore } from '@/utils/math';

const SIGNAL_SPIKE_THRESHOLD_DB = 25;
const RAPID_CHURN_WINDOW_MS = 10 * 60 * 1000;
const RAPID_CHURN_TOWER_COUNT = 4;

export function assessGhostTower(
  reading: CellReading,
  recentReadings: CellReading[],
  tower?: TowerRecord,
): GhostAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (!tower) {
    score += 35;
    reasons.push('Tower ID not found in trusted tower datasets.');
  }

  const last = recentReadings.at(-1);
  if (
    last?.rsrp != null &&
    reading.rsrp != null &&
    Math.abs(reading.rsrp - last.rsrp) >= SIGNAL_SPIKE_THRESHOLD_DB
  ) {
    score += 25;
    reasons.push('Signal power changed too abruptly for normal mobility.');
  }

  const now = reading.timestamp;
  const recentCids = new Set(
    recentReadings
      .filter((item) => now - item.timestamp <= RAPID_CHURN_WINDOW_MS)
      .map((item) => item.cid)
      .filter((value): value is number => typeof value === 'number'),
  );

  if (reading.cid) {
    recentCids.add(reading.cid);
  }

  if (recentCids.size >= RAPID_CHURN_TOWER_COUNT) {
    score += 20;
    reasons.push('Rapid cell-ID churn suggests possible rogue base station behavior.');
  }

  if ((reading.neighboringCellCount ?? 0) <= 1 && (reading.rsrp ?? -140) > -80) {
    score += 20;
    reasons.push('Strong serving signal with no normal neighboring cells detected.');
  }

  // An IMSI catcher frequently keeps the same PCI/CID pair while the operator
  // identity (MCC/MNC) or LAC/TAC flips versus what we have seen historically.
  const historicalForCid = recentReadings.filter(
    (item) => item.cid != null && item.cid === reading.cid,
  );
  const mncMismatch = historicalForCid.some(
    (item) => item.mnc != null && reading.mnc != null && item.mnc !== reading.mnc,
  );
  if (mncMismatch) {
    score += 25;
    reasons.push('Same cell ID observed under a different operator (MNC) — spoofing indicator.');
  }

  // Downgrade attacks force a modern handset onto 2G/GSM to strip encryption.
  if (reading.radioType === 'GSM') {
    const hasSeenModern = recentReadings.some(
      (item) => item.radioType === 'LTE' || item.radioType === 'NR' || item.radioType === 'WCDMA',
    );
    if (hasSeenModern) {
      score += 20;
      reasons.push('Unexpected downgrade to 2G/GSM after using LTE/5G — possible downgrade attack.');
    }
  }

  const normalized = normalizeScore(score);
  return {
    score: normalized,
    isLikelyGhost: normalized >= 60,
    reasons,
  };
}
