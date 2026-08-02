/**
 * Round-robin pool over multiple API keys for one provider (e.g. Groq).
 * Each key gets its own cooldown window when it hits a rate limit, so a
 * 429 on one key doesn't block requests that could use another key.
 */
export class KeyPool {
  private keys: string[];
  private cooldownUntil = new Map<string, number>();
  private cursor = 0;

  constructor(keys: string[]) {
    this.keys = keys.filter(Boolean);
  }

  get size(): number {
    return this.keys.length;
  }

  /** Next key not currently in cooldown, or null if every key is cooling down. */
  next(): string | null {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.cursor + i) % this.keys.length;
      const key = this.keys[idx];
      const until = this.cooldownUntil.get(key) ?? 0;
      if (until <= now) {
        this.cursor = (idx + 1) % this.keys.length;
        return key;
      }
    }
    return null;
  }

  /** Earliest time (ms) any key becomes available again; 0 if pool is empty. */
  earliestAvailableAt(): number {
    if (this.keys.length === 0) return 0;
    return Math.min(...this.keys.map((k) => this.cooldownUntil.get(k) ?? 0));
  }

  markCooldown(key: string, ms: number): void {
    this.cooldownUntil.set(key, Date.now() + ms);
  }
}
