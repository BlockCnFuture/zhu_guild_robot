import fs from 'node:fs'
import path from 'path';
import './puppeteer/Redis.js'
import './puppeteer/Puppeteer.js'
import './render/render.js'
import './pay/pay.js'
import Queue from 'bull'

let plugins = [];

let files = await fs.promises.readdir(path.join(process.cwd(), 'plugins'), { withFileTypes: true })
let ret = []

for (let val of files) {
    if (await fs.promises.access(path.join(process.cwd(), 'plugins', val.name, 'init.js')).then(() => true).catch(() => false)) {
        ret.push(import(`../plugins/${val.name}/init.js`));
    }
}

ret = await Promise.allSettled(ret)
for (let i in files) {
    let name = files[i].name
    if (ret[i]) {
        if (ret[i].status != 'fulfilled') {
            console.error(`载入插件错误：${name}`)
            console.error(ret[i].reason)
            continue
        }
        plugins[name] = ret[i].value[Object.keys(ret[i].value)[0]]
    }
}
ret = [];

async function DealEvents(job, msg) {
    for (let i in plugins) {
        job.log(`-------------------------------- ${i}`);
        if (plugins[i]) await plugins[i](job, msg);
        job.progress(100 / plugins.length);
    }
    job.log('Complete.');
    job.progress(100);
}

let que = new Queue('初遇小竹消息队列', {
    limiter: {
        max: 200,//限制并发每1s 200条
        duration: 1000,
    }, defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: global.redisconf
});
que.process('频道事件', 50, async (job) => {
    await DealEvents(job, job.data);
});
global.post_new_event_que = que;