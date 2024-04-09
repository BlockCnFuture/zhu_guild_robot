import { createOpenAPI, createWebsocket } from 'qq-guild-bot';
import Queue from 'bull'
import Arena from 'bull-arena';

let redisconf = {
    port: 6224,
    host: 'redis ip',
    password: 'redis 密码'
};

let queue = new Queue('初遇小竹消息队列', {
    defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: redisconf
});

let Config = {};

process.env.TZ = 'Asia/Shanghai'

process.on('unhandledRejection', (error, promise) => {
    console.error(error)
})

Config = {
    appID: '私域机器人appid',
    token: '私域机器人token',
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'AUDIO_OR_LIVE_CHANNEL_MEMBER', 'INTERACTION', 'FORUMS_EVENT', 'AUDIO_ACTION'],
    sandbox: false,
    shards: [0, 1]
};

let ws = createWebsocket(Config);

let Events = {
    GUILDS: BindEvents,
    GUILD_MEMBERS: BindEvents,
    GUILD_MESSAGES: BindEvents,
    GUILD_MESSAGE_REACTIONS: BindEvents,
    INTERACTION: BindEvents,
    FORUMS_EVENT: BindEvents,
    AUDIO_ACTION: BindEvents,
    PUBLIC_GUILD_MESSAGES: BindEvents,
    AUDIO_OR_LIVE_CHANNEL_MEMBER: BindEvents
}

for (let event in Events) {
    ws.on(event, (data) => { Events[event](data); })
}

async function BindEvents(msg) {
    if (msg.eventType == 'PUBLIC_MESSAGE_DELETE') return;
    queue.add('频道事件', msg);
}

Arena({
    Bull: Queue,
    queues: [
        {
            name: '初遇小竹消息队列',
            hostId: '北京服务器',
            redis: redisconf,
        },
        {
            name: '初遇小竹Api服务队列',
            hostId: '北京服务器',
            redis: redisconf,
        },
        {
            name: '初遇小竹Redis键过期队列',
            hostId: '北京服务器',
            redis: redisconf,
        },
        {
            name: '批量操作频道成员任务队列',
            hostId: '北京服务器',
            redis: redisconf,
        },
        {
            name: '不支持的消息seq检查队列',
            hostId: '北京服务器',
            redis: redisconf,
        }
    ]
}, {
    port: 5225,
});