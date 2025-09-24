/** Cache entry with value and absolute expiry timestamp. */
type Entry<V> = { value: V; expiresAt: number };

/**
 * Minimal in-memory LRU cache with TTL per entry.
 * Evicts the least-recently-used entry when at capacity.
 */
export class LruCache<K, V> {
  private map = new Map<K, Entry<V>>();
  constructor(
    private max: number,
    private ttlMs: number,
  ) {}

  /** Get a value by key and refresh its recency if present and not expired. */
  get(key: K): V | undefined {
    const ent = this.map.get(key);
    if (!ent) return undefined;
    if (ent.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // refresh LRU order
    this.map.delete(key);
    this.map.set(key, ent);
    return ent.value;
  }

  /** Set a value by key, updating expiry, and evict LRU if over capacity. */
  set(key: K, value: V) {
    const ent: Entry<V> = { value, expiresAt: Date.now() + this.ttlMs };
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, ent);
    if (this.map.size > this.max) {
      const first = this.map.keys().next();
      if (!first.done) this.map.delete(first.value);
    }
  }

  /** Clear all entries from the cache. */
  clear() {
    this.map.clear();
  }

  /** Current number of entries in the cache. */
  size() {
    return this.map.size;
  }
}
