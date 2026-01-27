import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

// Simple in-memory store for test mode
class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async connect(): Promise<void> {
    // No-op for in-memory implementation
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setEx(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const exists = this.store.has(key);
    if (exists) this.store.delete(key);
    return exists ? 1 : 0;
  }

  async eval(script: string, options: any): Promise<string | null> {
    // Simple Lua script evaluation for our use case
    const key = options.keys[0];
    const data = await this.get(key);
    
    if (!data) return null;
    
    const paste = JSON.parse(data);
    paste.views_used = paste.views_used + 1;
    
    const newData = JSON.stringify(paste);
    await this.set(key, newData);
    
    return newData;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

/**
 * Get or create a Redis client connection
 */
export async function getRedisClient(): Promise<any> {
  // If we're already connecting, wait for that promise
  if (connectPromise) {
    return connectPromise;
  }

  // If we already have a connected client, return it
  if (client) {
    try {
      // Test the connection with a simple ping
      await (client as any).ping();
      return client;
    } catch (err) {
      console.error('Redis client ping failed, reconnecting...', err);
      client = null;
    }
  }

  // Create a new connection
  connectPromise = createConnection();
  try {
    client = await connectPromise as any;
    return client;
  } finally {
    connectPromise = null;
  }
}

async function createConnection(): Promise<any> {
  // Use in-memory mock Redis if in TEST_MODE
  if (process.env.TEST_MODE === '1') {
    const mockClient = new InMemoryRedis();
    await mockClient.connect();
    return mockClient;
  }

  // Use real Redis otherwise
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const newClient = createClient({ 
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error('Max Redis reconnection attempts reached');
          return new Error('Max retries');
        }
        return retries * 50;
      },
    }
  });

  // Handle connection errors
  newClient.on('error', (err: Error) => {
    console.error('Redis client error:', err);
  });

  // Connect to Redis
  await newClient.connect();
  console.log('Redis client connected successfully');

  return newClient;
}
