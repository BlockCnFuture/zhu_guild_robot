import IORedis from 'ioredis';
import Queue from 'bull'

let redisconf = {
    port: 6224,
    host: 'redis ip',
    password: 'redis 密码'
};

let queue = new Queue('初遇小竹Redis键过期队列', {
    defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: redisconf
});

let redis = new IORedis(redisconf);
redis.psubscribe('__keyevent@0__:expired', function (err, count) {
    if (err) {
        console.log(err);
        return;
    }

    redis.on('pmessage', function (pattern, channel, message) {
        queue.add('键过期事件', message);
    });
});