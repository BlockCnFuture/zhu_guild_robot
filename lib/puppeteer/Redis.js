import IORedis from 'ioredis';

export default class Redis {
    async init() { 
        this.client = new IORedis(global.redisconf);

        this.client.on('error', (err) => {
            console.error('Redis连接失败！');
            process.exit();
        });

        process.on("exit", () => {
            this.client.quit();
        });
    }

    async set(key, value, expire) {
        let ret = await this.client.set(key, value);
        if (isNaN(expire)) {
            return ret;
        } else {
            return await this.client.expire(key, expire);
        }
    }

    async get(key) {
        return await this.client.get(key);
    }

    async mget(keys) {
        return await this.client.mget(keys);
    }

    async getKeysAndValues(pattern) {
        let keys = await this.client.keys(pattern);
        if (keys.length <= 0) {
            return [];
        }
        let values = await this.client.mget(keys);
        return [keys, values];
    }

    async del(key) {
       return await this.client.del(key);
    }

    async incr(key, expire) {
        let ret = await this.client.incr(key);
        if (isNaN(expire)) {
            return ret;
        } else {
            if (await this.client.expire(key, expire)) {
                return ret;
            } else {
                return false;
            }
        }
    }

    async incrby(key, increment, expire) {
        let ret = await this.client.incrby(key, increment);
        if (isNaN(expire)) {
            return ret;
        } else {
            if (await this.client.expire(key, expire)) {
                return ret;
            } else {
                return false;
            }
        }
    }

    async expire(key, expire) {
        return await this.client.expire(key, expire);
    }

    async delBypattern(pattern) {
        let keys = await this.client.keys(pattern);
        if (keys.length <= 0) {
            return true;
        }
        return await this.client.del(keys);
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

}

global.redis = new Redis();
await global.redis.init();