import fs from 'node:fs'
import path from 'path';
import { fileURLToPath } from 'url';

let dir = path.dirname(fileURLToPath(import.meta.url));
let funcs = [];
let files = fs.readdirSync(path.join(dir, 'events_handler') + path.sep).filter(file => file.endsWith('.js'))

let ret = []

files.forEach((file) => {
    ret.push(import(`./events_handler/${file}`))
})

ret = await Promise.allSettled(ret)
for (let i in files) {
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        console.error(`载入插件功能失败：${name}`)
        console.error(ret[i].reason)
        continue
    }
    funcs[name] = new ret[i].value[Object.keys(ret[i].value)[0]]
}

export default async function dealEvents(job, msg) {
    if (msg.eventId) msg.msg.eventId = msg.eventId;
    for (let i in funcs) {
        if (funcs[i][`handle_${msg.eventType}`]) {
            job.log(`---- ${i}.js`);
            await funcs[i][`handle_${msg.eventType}`](msg.msg);
        } else if (funcs[i]['handle_all']) {
            job.log(`---- ${i}.js`);
            await funcs[i]['handle_all'](msg.msg);
        }
    }
}