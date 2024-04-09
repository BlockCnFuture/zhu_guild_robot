import cluster from 'cluster';
import { createOpenAPI } from 'qq-guild-bot';
import Extends from './lib/extends/extends.js';
import schedule from 'node-schedule';
import Queue from 'bull'
import { config } from 'process';


//!!!!!!!!!!!!!!!!!!!!!以下信息。带 * 为必填/必修改信息!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

global.redisconf = { // * Redis设置 端口、ip地址、连接密码
    port: 6224,
    host: 'redis ip',
    password: 'redis 密码'
};

global.Puppeteer_executablePath = './chrome-win/chrome.exe'; //Chrome浏览器路径，默认即可，无需修改

const subprocesscnt = 1; // * 消费者子进程数量，可适当调高，视机器性能和频道消息量决定，不建议高于7
global.robotid = '14753227080502839767'; // * 机器人在频道的虚拟id

global.miniappconfig = {
    /* 小程序配置
     * 
     * 小程序appid、小程序密钥、小程序超管列表（有审核权限和频道管理权限）、小程序域名、官方频道虚拟id、定时任务审核子频道、关键词审核子频道、图片巡查子频道
     * 事件id刷新频道虚拟id、事件id刷新子频道id、事件id刷新所需消息id、菜单触发指令、爱发电账号、爱发电账号密码、通用markdown模板id、每日打卡按钮模板id
     * 值班室待操作按钮模板id、值班室已操作按钮模板id、用户续期在官方频道消耗的积分名称、用户自助续期时每续期30天消耗的积分数量、官方审核频道虚拟id
     */
    appid: '小程序appid',
    secret: '小程序密钥',
    p_admins: '<@!12573468165773097827><@!7185573537170399182><@!16522184531633794793><@!7844983031251254842><@!2617857889127712962><@!3669914753415294093><@!7918590477468870865><@!7780852517864850793><@!16020059475256505969><@!15757740675127415042><@!4582480470203108031><@!139761108189060386><@!12521657159334231705>',
    host: 'feng.7yan.top',
    officialguildid: '1196663613263703387',
    channelA: '568959500',
    channelB: '561531171',
    channelC: '633498780',
    refguildid: '6259864134638097991',
    channel: '562012219',
    messageid: '08c7acbfbabaa8e0ef5610bbc0fe8b02380148b48dffa406',
    command: '/小竹菜单',
    afdaccount: '爱发电账号',
    afdpassword: '爱发电密码',
    markdowntemplateA: '102045949_1691241953',
    keyboardtemplateA: '102045949_1696582052',
    keyboardtemplateB: '102045949_1698805508',
    keyboardtemplateC: '102045949_1698931500',
    pointname: '枫达币',
    renewprice: 500,
    Auditguildid: '5237615478283154023'  //这个一般不用改，给官方审核频道一个绿色通道，方便审核通过
};

global.__mysqlconfig = { // * MYSQL 8.0 数据库连接信息

    host: 'localhost', // 数据库主机地址
    user: 'root',      // 数据库用户名
    password: 'root',  // 数据库密码
    database: 'testdb',   // 数据库名

};


let Config = { // * 私域机器人信息
    appID: '机器人appid',
    token: '机器人token',
    intents: ['PUBLIC_GUILD_MESSAGES'],
    sandbox: false,
};;

process.env.TZ = 'Asia/Shanghai';

process.on('unhandledRejection', (error, promise) => {
    console.error(error)
});

global._messageque = new Queue('主子进程通信队列', {
    defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
    }, redis: global.redisconf
});


if (cluster.isMaster) {
    // 主进程

    console.log(`主进程 ${process.pid} 已启动`);

    await import('./plugins/初遇小竹/lib/mysql/mysql.js');

    //!!!!!!!!!!!!!!!!!!!!!!以下代码，控制定时任务分发，只在主服务器上启用!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    let que = new Queue('定时任务执行队列', {
        defaultJobOptions: {
            removeOnComplete: 1000,
            removeOnFail: 1000,
        }, redis: global.redisconf
    });

    schedule.scheduleJob('事件id更新任务', { rule: '0 0,4,8,12,16,20,24,28,32,36,40,44,48,52,56 * * * *' }, async function () {
        que.add('事件id更新任务', '');
    });

    schedule.scheduleJob('每分钟定时任务', { rule: '0 * * * * *' }, async function () { //每分钟一次
        que.add('每分钟定时任务', '');
    });

    schedule.scheduleJob('每小时定时任务', { rule: '0 0 * * * *' }, async function () { //每小时一次
        que.add('每小时定时任务', '');
    });

    schedule.scheduleJob('每天定时任务', { rule: '0 0 0 * * *' }, async function () { //每24小时一次 (0时0分0秒)
        que.add('每天定时任务', '');
    }.bind(this));

    global._messageque.process('schedule', 1, async function (job) {
        let m = job.data;
        if (!schedule.scheduledJobs[m.id]) {
            schedule.scheduleJob(m.id, { rule: m.rule }, async function () {
                que.add('自定义定时任务', m.s);
            });
        }
    });

    global._messageque.process('cancelschedule', 1, async function (job) {
        let m = job.data;
        if (schedule.scheduledJobs[m.id]) {
            schedule.cancelJob(m.id);
        }
    });

    for (let i = 0; i < subprocesscnt; i++) {
        cluster.fork();
    }

} else {

    console.log(`子进程 ${process.pid} 已启动`);

    global.client = createOpenAPI(Config);
    global.ext = new Extends(`Bot ${Config.appID}.${Config.token}`, client, Config);

    import('./lib/init.js');

}
