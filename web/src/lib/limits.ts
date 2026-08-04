import type { MetadataRecord } from '../types';

export const ADOBE_MAX = 49;
export const SHUTTER_MAX = 50;
export const ISTOCK_MAX = 50;

export type RingStatus = 'pending' | 'warn' | 'done';

/** File-list status ring: pending (nothing generated), warn (generated but under a platform's max keyword count), done. */
export function metadataRingStatus(record: MetadataRecord | undefined): RingStatus {
  if (!record) return 'pending';
  const hasMeta = !!(record.title_en || record.title_secondary || (record.adobe_keywords_en?.length ?? 0) > 0);
  if (!hasMeta) return 'pending';
  const short =
    (record.adobe_keywords_en?.length ?? 0) < ADOBE_MAX ||
    (record.shutter_keywords_en?.length ?? 0) < SHUTTER_MAX ||
    (record.istock_keywords_en?.length ?? 0) < ISTOCK_MAX;
  return short ? 'warn' : 'done';
}
