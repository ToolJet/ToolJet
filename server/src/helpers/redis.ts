import * as Y from 'yjs';
import Redis, { Cluster } from 'ioredis';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';

const messageAwareness = 1;
export class RedisInstance {
  rps: RedisPubSub;
  name: string;
  awarenessChannel: string;
  doc: Y.Doc;
  /**
   * @param {RedisPubSub} rps
   * @param {string} name
   * @param {Y.Doc} doc
   */
  constructor(rps: RedisPubSub, name: string, doc: Y.Doc) {
    this.rps = rps;
    this.name = name;
    this.awarenessChannel = `${name}-awareness`;
    this.doc = doc;
    if (doc.store.clients.size > 0) {
      this.updateHandler(Y.encodeStateAsUpdate(doc));
    }
    doc.on('update', this.updateHandler);
    rps.subscriber.subscribe(name, this.awarenessChannel);
  }

  updateHandler = (update: Uint8Array) => {
    this.rps.publisher.publish(this.name, update.toString());
  };

  updateAwarenessHandler = (
    awareness: awarenessProtocol.Awareness,
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    conn: any
  ) => {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    const update = awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      changedClients || Array.from(awareness.getStates().keys())
    );
    encoding.writeVarUint8Array(encoder, update);
    this.rps.publisher.publish(this.awarenessChannel, update.toString());
  };

  destroy = () => {
    this.doc.off('update', this.updateHandler);
    this.rps.docs.delete(this.name);
    return this.rps.subscriber.unsubscribe(this.name, this.awarenessChannel);
  };
}

/**
 * @param {Object|null} redisOpts
 * @param {Array<Object>|null} redisClusterOpts
 * @return {Redis | Cluster}
 */
const createRedisInstance = (redisOpts: any, redisClusterOpts: any): Redis | Cluster =>
  redisClusterOpts ? new Redis.Cluster(redisClusterOpts) : redisOpts ? new Redis(redisOpts) : new Redis();

export class RedisPubSub {
  publisher: Redis | Cluster;
  subscriber: Redis | Cluster;
  docs: Map<any, any>;
  /**
   * @param {Object} [opts]
   * @param {Object|null} [opts.redisOpts]
   * @param {Array<Object>|null} [opts.redisClusterOpts]
   */
  constructor({ redisOpts = null, redisClusterOpts = null } = {}) {
    this.publisher = createRedisInstance(redisOpts, redisClusterOpts);
    this.subscriber = createRedisInstance(redisOpts, redisClusterOpts);
    this.docs = new Map();

    this.subscriber.on('message', (channel: string, message: any) => {
      if (channel.includes('-awareness')) {
        const pdoc = this.docs.get(channel.replace('-awareness', ''));
        if (!pdoc) return;
        try {
          awarenessProtocol.applyAwarenessUpdate(
            pdoc.doc.awareness,
            new Uint8Array(message.split(',')),
            this.subscriber
          );
        } catch (exception) {
          console.error(exception, exception.stack);
        }
      } else {
        const pdoc = this.docs.get(channel);
        if (pdoc) {
          pdoc.doc.transact(() => {
            Y.applyUpdate(pdoc.doc, new Uint8Array(message.split(',')));
          });
        } else {
          this.subscriber.unsubscribe(channel, `${channel}-awareness`);
        }
      }
    });
  }

  /**
   * @param {string} name
   * @param {Y.Doc} ydoc
   * @return {RedisInstance}
   */
  bindState = (name: string, ydoc: Y.Doc): RedisInstance => {
    if (this.docs.has(name)) {
      throw new Error(`"${name}" is already bound to this RedisPubSub instance`);
    }
    const redisInstance = new RedisInstance(this, name, ydoc);
    this.docs.set(name, redisInstance);
    return redisInstance;
  };

  destroy = async () => {
    const docs = this.docs;
    this.docs = new Map();
    await Promise.all(Array.from(docs.values()).map((doc) => doc.destroy()));
    this.publisher.quit();
    this.subscriber.quit();
    this.publisher = null;
    this.subscriber = null;
  };

  /**
   * @param {string} name
   */
  closeDoc = (name: any) => {
    const doc = this.docs.get(name);
    if (doc) {
      return doc.destroy();
    }
  };
}
