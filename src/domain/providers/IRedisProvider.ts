/**
 * Redis provider interface for cache and state management
 */
export interface IRedisProvider {
  /**
   * Get a value by key
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value with optional expiration
   * @param key The key to set
   * @param value The value to store
   * @param expirationSeconds Optional expiration time in seconds
   */
  set(key: string, value: string, expirationSeconds?: number): Promise<void>;

  /**
   * Delete a key
   */
  del(key: string): Promise<void>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set expiration on a key
   * @param key The key to expire
   * @param seconds Time to live in seconds
   */
  expire(key: string, seconds: number): Promise<void>;

  /**
   * Get all values from a hash
   */
  hgetall(key: string): Promise<Record<string, string>>;

  /**
   * Get a specific field from a hash
   */
  hget(key: string, field: string): Promise<string | null>;

  /**
   * Set a field in a hash
   */
  hset(key: string, field: string, value: string): Promise<void>;

  /**
   * Set multiple fields in a hash
   */
  hmset(key: string, data: Record<string, string>): Promise<void>;

  /**
   * Delete a field from a hash
   */
  hdel(key: string, field: string): Promise<void>;

  /**
   * Get all keys matching a pattern
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Add members to a set
   */
  sadd(key: string, ...members: string[]): Promise<number>;

  /**
   * Remove members from a set
   */
  srem(key: string, ...members: string[]): Promise<number>;

  /**
   * Get all members of a set
   */
  smembers(key: string): Promise<string[]>;

  /**
   * Check if a member exists in a set
   */
  sismember(key: string, member: string): Promise<boolean>;

  /**
   * Publish a message to a channel
   */
  publish(channel: string, message: string): Promise<number>;

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): Promise<void>;

  /**
   * Close the Redis connection
   */
  close(): Promise<void>;

  /**
   * Check if the connection is ready
   */
  isReady(): boolean;
}