import tools from '../tools.js'
import Queue from 'bull'

let que = new Queue('批量操作频道成员任务队列', {
    defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
    }, redis: global.redisconf
});

que.process('批量操作频道成员任务', 2, async (job) => {
    let data = job.data.data;
    await ClearMembers(data.msg, data.level, data.y, data.m, data.noid, data.tid, data.mov);
});

let ontimetaskque = new Queue('定时任务执行队列', {
    defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
    }, redis: global.redisconf
});

async function pushMemberTask(msg, level, y, m, noid, tid, mov, messageid) {
    if (!msg.guild_id) return;

    await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);

    que.add('批量操作频道成员任务', {
        data: {
            msg: msg,
            level: level,
            y: y,
            m: m,
            noid: noid,
            tid: tid,
            mov: mov
        }
    }, {
        jobId: msg.guild_id
    });
}

export default class handler extends tools {

    constructor() {
        super();
        this.startTasks();
    }

    async startTasks() {

        ontimetaskque.process('事件id更新任务', 1, async function (job) {
            //return;
            let reactionObj = {
                message_id: global.miniappconfig.messageid,
                emoji_type: 2,
                emoji_id: '128293'
            };

            try {

                let { data } = await client.reactionApi.getReactionUserList(global.miniappconfig.channel, reactionObj, { cookie: '', limit: 20 });
                if (data.users && data.users.length > 0 && data.users.filter(i => { return i.id == global.robotid; }).length > 0) {
                    await client.reactionApi.deleteReaction(global.miniappconfig.channel, reactionObj);
                } else {
                    await client.reactionApi.postReaction(global.miniappconfig.channel, reactionObj);
                }

            } catch (err) { }

        }.bind(this));

        ontimetaskque.process('每分钟定时任务', 1, async function (job) {

            let exp_roles = await this.fetch_exproles(Date.now());
            if (exp_roles) {
                for (let r of exp_roles) {
                    try {
                        await ext.Del_RoleMember(r.guildid, false, r.user_id, r.role_id);
                    } catch (err) { }
                }
            }

            await this.clear_exp_points();

        }.bind(this));

        ontimetaskque.process('每小时定时任务', 1, async function (job) {
            this.check_upointtasks();
        }.bind(this));

        ontimetaskque.process('每天定时任务', 1, async function (job) {
            await this.clearMysqldatas();
            await this.check_expimgs(Date.now());
            await this.clear_expinvitecodes(Date.now());
            await this.clear_Messages();
        }.bind(this));

        ontimetaskque.process('自定义定时任务', 4, async function (job) {
            let s = job.data;

            if (s.useit == '1') {

                if (await this.check_isexpir(s.guildid)) return;

                if (s.task_type == '0') {
                    try {
                        if (s.editor) {
                            let time = s.editor;
                            await client.muteApi.muteAll(s.guildid, { seconds: time });
                        }
                        if (s.tochannel) {
                            let ifmarkdown = (s.markdown == '1');
                            let imgtextdp = (s.imgtextdp == '1');

                            let send_image = false;
                            let send_c = false;
                            if (s.image) {
                                let info = await this.getimageinfo(s.image);
                                send_image = info;
                            }
                            if (s.content) {
                                let arr = s.content.split('<OR>');
                                let c = arr[Math.floor(Math.random() * arr.length)];
                                send_c = c;
                                send_c = send_c.replaceAll('\r\n', '\r');
                                send_c = send_c.replaceAll('\n', '\r');
                            }
                            if (!send_image && !send_c) return;

                            if (ifmarkdown) {                               
                                if (imgtextdp) {
                                    if (send_image) {
                                        let m = {
                                            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                                            "params": []
                                        };
                                        for (let i = 0; i < 10; i++) {
                                            if (i + 1 == 1) {
                                             m.params.push({ key: `c${i + 1}`, values: [`img #${send_image.width}px #${send_image.height}px](${s.image}) ![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            } else if (i + 1 == 10) {
                                                m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            } else {
                                                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            }
                                        }
                                        await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, event_id: await this.fetch_eventid(s.guildid), markdown: m });
                                    }
                                    if (send_c) {
                                        let m = {
                                            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                                            "params": []
                                        };
                                        for (let i = 0; i < 10; i++) {
                                            if (i + 1 == 1) {
                                                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${send_c}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            } else if (i + 1 == 10) {
                                                m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            } else {
                                                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            }
                                        }
                                        await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, event_id: await this.fetch_eventid(s.guildid), markdown: m });
                                    }                                   
                                } else {
                                    let m = {
                                        "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                                        "params": []
                                    };
                                    for (let i = 0; i < 10; i++) {
                                        if (i + 1 == 1) {
                                            if (send_image) {
                                                if (send_c) {
                                                    m.params.push({ key: `c${i + 1}`, values: [`img #${send_image.width}px #${send_image.height}px](${s.image}) \r${send_c}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                                } else {
                                                    m.params.push({ key: `c${i + 1}`, values: [`img #${send_image.width}px #${send_image.height}px](${s.image}) ![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                                }
                                            } else {
                                                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${send_c}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                            }
                                        } else if (i + 1 == 10) {
                                            m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                        } else {
                                            m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                                        }
                                    }
                                    await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, event_id: await this.fetch_eventid(s.guildid), markdown: m });
                                }
                            } else {
                                if (imgtextdp) {
                                    if (send_image) {
                                        await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, msg_id: await GetMid(s.guildid, false), image: await this.readFileToBuffer(s.image) });
                                    }
                                    if (send_c) {
                                        await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, msg_id: await GetMid(s.guildid, false), content: send_c });
                                    }
                                } else {
                                    if(send_image) {
                                        if (send_c) {
                                            await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, msg_id: await GetMid(s.guildid, false), image: await this.readFileToBuffer(s.image), content: send_c });
                                        } else {
                                            await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, msg_id: await GetMid(s.guildid, false), image: await this.readFileToBuffer(s.image) });
                                        }
                                    } else {
                                        await ext.SendMessage({ guild_id: s.guildid, channel_id: s.tochannel, msg_id: await GetMid(s.guildid, false), content: send_c });
                                    }
                                }
                            }
                        }
                    } catch (err) { }
                } else { }

            }

        }.bind(this));

        let list = await this.get_TasksList_all();
        if (list[0]) {
            let tasks = list[1];
            for (let s of tasks) {

                if (s.useit == '1' && s.id && s.cron && s.task_type == '0') {

                    global._messageque.add('schedule',{
                        id: s.id,
                        rule: s.cron,
                        s: s
                    });

                }
            }
        }

    }

    async match_c(command, obj, guildid) {
        let c = obj.val;
        if (typeof command === 'string' && c.startsWith(command)) {
            if (await this.check_isexpir(guildid)) return false;
            obj.val = c.substring(command.length).trim();
            return true;
        } else {
            if (typeof command === 'object') {
                let match = c.match(command)
                if (match) {
                    if (await this.check_isexpir(guildid)) return false;
                    obj.val = match;
                    return true;
                }
            }
            return false;
        }
    }

    async handle_GUILD_MEMBER_REMOVE(msg) {

        if (await this.check_isexpir(msg.guild_id)) return;    
        await this.write_MessagesId(msg.guild_id, '1', msg.eventId);

        if (msg.op_user_id == global.robotid) {
            return;
        }

        let k = await redis.get(`ZuCacheVef:AnswerVef:${msg.guild_id}:${msg.user.id}`);
        if (k) {
            redis.del(`ZuCacheVef:AnswerVef:${msg.guild_id}:${msg.user.id}`);
        }

        await this.check_member_goodbye(msg);

        await this.check_member_goodbye_black(msg);

    }

    async handle_MESSAGE_REACTION_REMOVE(msg) {

        if (msg.user_id == global.robotid) {
            await this.write_MessagesId(global.miniappconfig.refguildid, '0', msg.eventId);
            return;
        }

        if (!msg.emoji || !msg.emoji.id) return;

        let sets = await this.get_EventsSets(msg.guild_id, '表情表态限制');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true' && sets.tochannel) {
                if (sets.content.includes(`|${msg.emoji.id}|`)) {
                    let seq = ext.depackmsgid(msg.target.id).toString();
                    let actionid = `${msg.channel_id}_${msg.emoji.id}_${seq}`;
                    if (!seq || seq == 'false') {
                        console.log(msg.target.id);
                        return;
                    }
                    let check = await this.check_User_Reaction(msg.guild_id, msg.user_id, actionid);
                    if (check) {

                        await this.del_User_Reaction(msg.guild_id, msg.user_id, actionid);
                        let cnt = await this.check_User_Reactions(msg.guild_id, msg.user_id);

                        if (cnt && cnt > 0) {
                            //通知继续
                        } else {
                            try {
                                await client.muteApi.muteMember(msg.guild_id, msg.user_id, { seconds: '0' });
                            } catch (err) { }
                        }

                    }
                }

            }
        }

    }

    async handle_MESSAGE_REACTION_ADD(msg) {

        if (msg.user_id == global.robotid) {
            await this.write_MessagesId(global.miniappconfig.refguildid, '0', msg.eventId);
            return;
        }

        if (!msg.emoji || !msg.emoji.id) return;

        let sets = await this.get_EventsSets(msg.guild_id, '表情表态限制');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true' && sets.tochannel) {
                if (sets.content.includes(`|${msg.emoji.id}|`)) {
                    let seq = ext.depackmsgid(msg.target.id).toString();
                    let actionid = `${msg.channel_id}_${msg.emoji.id}_${seq}`;
                    if (!seq || seq == 'false') {
                        console.log(msg.target.id);
                        return;
                    }
                    if (await this.write_User_Reaction(msg.guild_id, msg.user_id, actionid)) {
                        let face = '';
                        if (msg.emoji.type == 1) {
                            face = `<emoji:${msg.emoji .id}>`;
                        } else {
                            face = `${String.fromCodePoint(msg.emoji.id)}`;
                        }

                        try {
                            await client.muteApi.muteMember(msg.guild_id, msg.user_id, { seconds: (60 * 60 * 24 * 30).toFixed(0).toString() });
                        } catch (err) {
                            await this.del_User_Reaction(msg.guild_id, msg.user_id, actionid);
                            return;
                        }

                        await ext.SendMessage({
                            guild_id: msg.guild_id, channel_id: sets.tochannel, msg_id: msg.eventId, content: `<@!${msg.user_id}>
本频道禁止发布【${face}】消息表态
请及时撤销您在<#${msg.channel_id}>发布的表情表态以及历史违规表态
撤销所有违规表态后即可解除禁言` });

                    }
                }

            }
        }
    }

    async check_new_member_hello(msg, ret) {
        let time = new Date().getTime().toString();
        let sets = await this.get_EventsSets(msg.guild_id, '入频通知');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true') {
                if (sets.content != '') {
                    if (!await this.check_isexpir(msg.guild_id)) {

                        let cdcheck = await redis.get(`ZuCache:MemberEnterC:${msg.guild_id}`);
                        if (cdcheck) {
                            await redis.set(`ZuCache:MemberEnterC:${msg.guild_id}`, 'on', 10);
                            return;
                        } else {
                            await redis.set(`ZuCache:MemberEnterC:${msg.guild_id}`, 'on', 10);
                        }

                        let answer = sets.content;
                        let img = sets.image;
                        if (!img) return;
                        let info = await this.getimageinfo(img);
                        if (!info) return;

                        let obj;
                        try {
                            obj = JSON.parse(answer);
                        } catch (err) { }

                        let before = '';
                        let content = '';
                        let md;
                        img = `${img}?t=${new Date().getTime()}`;

                        if (obj && obj.content) {

                            let arr = [];
                            for (let s in obj) {
                                let key = s;
                                let val = obj[key];

                                val = val.replaceAll('{时间}', this.timestamp2times(time));
                                val = val.replaceAll('{昵称}', msg.user.username);
                                val = val.replaceAll('{id}', msg.user.id);
                                val = val.replaceAll('{艾特}', `<@!${msg.user.id}>`);
                                val = val.replaceAll('\r\n', `\r`);
                                val = val.replaceAll('\n', `\r`);
                                val = this.rp_linkasn(val);

                                if (ret) {
                                    val = val.replaceAll('{计数}', ret);
                                } else {
                                    val = val.replaceAll('{计数}', ' err ');
                                }

                                arr = [...arr, { key: key, values: [val] }]
                            }

                            md = this.get_markdown_t4(`img #${info.width}px #${info.height}px`, img, this.getheadlink(msg.user.avatar), arr)
                        } else {
                            answer = answer.replaceAll('{时间}', this.timestamp2times(time));
                            answer = answer.replaceAll('{昵称}', msg.user.username);
                            answer = answer.replaceAll('{id}', msg.user.id);
                            answer = answer.replaceAll('{艾特}', `<@!${msg.user.id}>`);
                            answer = answer.replaceAll('\r\n', `\r`);
                            answer = answer.replaceAll('\n', `\r`);
                            answer = this.rp_linkasn(answer);

                            if (ret) {
                                answer = answer.replaceAll('{计数}', ret);
                            } else {
                                answer = answer.replaceAll('{计数}', ' err ');
                            }

                            let index = answer.indexOf('{头像}');
                            if (index == -1) {
                                before = ' ';
                                content = answer;
                            } else {
                                before = answer.slice(0, index);
                                content = answer.slice(index + 4);
                            }
                            if (!before) before = ' ';
                            content = content.replaceAll('{头像}', '');

                            md = this.get_markdown_t1(info.width, info.height, img, before, this.getheadlink(msg.user.avatar), content);
                        }

                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: sets.tochannel, event_id: msg.eventId, markdown: md });

                    }
                }
            }
        }
    }

    async check_new_member_set(msg) {
        let sets = await this.get_EventsSets(msg.guild_id, '新人加入设置');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true') {
                if (sets.content != '') {
                    let obj;
                    try {
                        obj = JSON.parse(sets.content);
                    } catch (err) { }
                    if (obj) {
                        if (obj.banspeak) {
                            let time = obj.bantime;
                            if (time <= 0) time = 300;
                            try {
                                await client.muteApi.muteMember(msg.guild_id, msg.user.id, { seconds: time });
                            } catch (err) { }
                        }
                        if (obj.setroles) {
                            let i = 0;
                            for (let s of obj.roles) {
                                let id = s.roleid;
                                let time = s.time;
                                if (id <= 0 || !id) continue;
                                try {
                                    await client.memberApi.memberAddRole(msg.guild_id, id, msg.user.id);
                                    if (time && time > 0) {
                                        await this.write_exprole(msg.guild_id, id, msg.user.id, time);
                                    }
                                } catch (err) { }
                                i++;
                                if (i >= 3) break;
                            }
                        }
                        if (obj.setpoints) {
                            let i = 0;
                            for (let s of obj.points) {
                                let id = s.point_id;
                                let cnt = s.pointcnt;
                                if (id <= 0 || !id || cnt <= 0 || !cnt) continue;
                                await this.user_points_change(msg.guild_id, msg.user.id, id, cnt, msg.user.avatar, msg.user.username);
                                await this.addpointchangelog(msg.guild_id, msg.user.id, id, cnt, '新人加入奖励', global.robotid, '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                                i++;
                                if (i >= 3) break;
                            }
                        }
                    }
                }
            }
        }
    }

    async check_member_goodbye(msg) {
        let time = new Date().getTime().toString();

        let sets;

        let ret = false;

        if (msg.op_user_id && msg.user.id != msg.op_user_id) { //不是自己退出
            sets = await this.get_EventsSets(msg.guild_id, '移除通知');
        } else {
            let today = this.Date_YMD();
            ret = await redis.incr(`ZuCacheUEOrUE2:quit:${msg.guild_id}:${today}`, 24 * 60 * 60);
            sets = await this.get_EventsSets(msg.guild_id, '退频通知');
        }

        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true') {

                if (msg.op_user_id && msg.user.id != msg.op_user_id) {
                    let cdcheck = await redis.get(`ZuCache:MemberRemoveC:${msg.guild_id}`);
                    if (cdcheck) {
                        await redis.set(`ZuCache:MemberRemoveC:${msg.guild_id}`, 'on', 10);
                        return;
                    } else {
                        await redis.set(`ZuCache:MemberRemoveC:${msg.guild_id}`, 'on', 10);
                    }
                }

                if (sets.content != '') {
                    if (!await this.check_isexpir(msg.guild_id)) {

                        let op = { id: '', at: '' };
                        if (msg.op_user_id) {
                            op.id = msg.op_user_id;
                            op.at = `<@!${op.id}>`
                        }

                        let answer = sets.content;
                        let img = `${sets.image} `;
                        if (!img) return;
                        let info = await this.getimageinfo(img);
                        if (!info) return;
                        answer = answer.replaceAll('{时间}', this.timestamp2times(time));
                        answer = answer.replaceAll('{昵称}', msg.user.username);
                        answer = answer.replaceAll('{id}', msg.user.id);
                        answer = answer.replaceAll('{操作人id}', op.id);
                        answer = answer.replaceAll('{艾特}', op.at);
                        answer = answer.replaceAll('\r\n', `\r`);
                        answer = answer.replaceAll('\n', `\r`);
                        answer = this.rp_linkasn(answer);
                        if (msg.op_user_id && msg.user.id != msg.op_user_id) {
                            answer = answer.replaceAll('{计数}', '');
                        } else {
                            if (ret) {
                                answer = answer.replaceAll('{计数}', ret);
                            } else {
                                answer = answer.replaceAll('{计数}', ' err ');
                            }
                        }
                        let before = '';
                        let content = '';
                        let index = answer.indexOf('{头像}');
                        if (index == -1) {
                            before = ' ';
                            content = answer;
                        } else {
                            before = answer.slice(0, index);
                            content = answer.slice(index + 4);
                        }
                        if (!before) before = ' ';
                        content = content.replaceAll('{头像}', '');

                        let md = this.get_markdown_t1(info.width, info.height, img, before, this.getheadlink(msg.user.avatar), content);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: sets.tochannel, event_id: msg.eventId, markdown: md });

                    }
                }
            }
        }
    }

    async check_member_goodbye_black(msg) {
        let sets = await this.get_EventsSets(msg.guild_id, '退频自动拉黑');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true') {
                if (!await this.check_isexpir(msg.guild_id)) {

                    if (msg.op_user_id && msg.user.id != msg.op_user_id) { //不是自己退出
                        return;
                    }

                    let answer = `id：${msg.user.id}\r用户退出频道，已自动拉黑`;

                    await this.del_guild_users_points(msg.guild_id, msg.user.id); //删除积分
                    await this.write_blacklists(msg.guild_id, msg.user.id, true, '用户退出频道，自动拉黑', '系统', '', '', msg.user.username, msg.user.avatar);

                    await this.s_writelog(msg.guild_id, msg.user.id, msg.user.username, msg.user.avatar, '0', `用户主动退出频道，触发自动拉黑设置`);
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: sets.tochannel, event_id: msg.eventId, content: answer });
                }
            }
        }
    }

    async handle_GUILD_MEMBER_ADD(msg) {

        if (await this.check_isexpir(msg.guild_id)) return;    
        //await this.write_MessagesId(msg.guild_id, '1', msg.eventId);
        await redis.set(`ZuCacheGEventId:${msg.guild_id}`, msg.eventId, 290);

        if (msg.user.bot == true) {
            return;
        }

        let ret = false;
        let today = this.Date_YMD();
        ret = await redis.incr(`ZuCacheUEOrUE2:join:${msg.guild_id}:${today}`, 24 * 60 * 60);

        if (await this.check_member_hello_black(msg)) {
            return;
        }

        await this.check_new_member_hello(msg, ret);

        await this.check_new_member_set(msg);

        let sets = await this.get_EventsSets(msg.guild_id, '入频验证码');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true' && sets.tochannel) {

                try {
                    await client.muteApi.muteMember(msg.guild_id, msg.user.id, { seconds: 600 });
                    await redis.set(`ZuCacheVef:AnswerVef:${msg.guild_id}:${msg.user.id}`, 'on', 600);

                    let s = encodeURIComponent(`pages/functions/newmembervefanswer/newmembervefanswer?guildID=${msg.guild_id}`);
                    let m = {
                        "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                        "params": [{
                            "key": "c1",
                            "values": [`img #1920px #640px](https://${global.miniappconfig.host}/img/answervef?t=1) \r#本频道已开启人机验证，请您完成验证![img #-1px #1px](https://m.q.qq.com/a/p/`]
                        }, {
                            "key": "c2",
                            "values": [`img #-1px #1px](https://m.q.qq.com/a/p/) \r> <@!${msg.user.id}>\r请在十分钟内完成验证，否则将被踢出![img #-1px #1px](https://m.q.qq.com/a/p/`]
                        }, {
                            "key": "c3",
                            "values": [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r[🔗点击前往验证](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s}`]
                        }, {
                            "key": "c4",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c5",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c6",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c7",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c8",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c9",
                            "values": ["img #-1px #1px](https://m.q.qq.com/a/p/"]
                        }, {
                            "key": "c0",
                            "values": ["img #-1px#1px](https://m.q.qq.com/a/p/"]
                        }]
                    };

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: sets.tochannel, event_id: msg.eventId, markdown: m });

                } catch (err) { }

            }
        }
    }

    async check_member_hello_black(msg) {
        if (!await this.check_isexpir(msg.guild_id)) {

            let precheck = await this.match_forbidden_words_nick(msg.user.username, msg.guild_id);
            if (precheck[0]) {
                let type = precheck[1][0].deal_type;
                let keyword = precheck[1][0].keyword;
                if (type == '0') {
                    await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.user.id, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                    await this.s_writelog(msg.guild_id, msg.user.id, msg.user.username, msg.user.avatar, '0', `新加入用户名片触发违禁词【${keyword}】，被移出频道`);
                } else if(type == '1') {
                    await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.user.id, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                    await this.del_guild_users_points(msg.guild_id, msg.user.id);
                    await this.s_writelog(msg.guild_id, msg.user.id, msg.user.username, msg.user.avatar, '0', `新加入用户名片触发违禁词【${keyword}】，被移出频道并拉黑`);
                }
                return true;
            }


            let check = await this.ifhas_black(msg.guild_id, msg.user.id);
            if (check[0] && check[1][0].is_black == true) {
                try {
                    await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.user.id, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                    let replay = `新成员为黑名单人员，已自动移除拉黑
发生时间：${this.timestamp2times(Date.now())}
用户id：${msg.user.id}
管理移除黑名单入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                    await this.punish_notify(msg.guild_id, replay, msg.eventId);
                    await this.s_writelog(msg.guild_id, msg.user.id, msg.user.username, msg.user.avatar, '0', `用户加入频道，发现是黑名单人员，已自动移除并拉黑`);
                    
                    return true;
                } catch (err) {

                }
            }
        }
        return false;
    }

    async handle_GUILD_MEMBER_UPDATE(msg) {

        if (await this.check_isexpir(msg.guild_id)) return;
        //await this.write_MessagesId(msg.guild_id, '1', msg.eventId);
        await redis.set(`ZuCacheGEventId:${msg.guild_id}`, msg.eventId, 290);

    }

    async getMesssagelink(msg, reason) {

        let oc = msg.content;
        if (oc && oc != '') {
            if (oc == '当前版本不支持查看，请升级QQ版本') oc = '[文件]';
            if (oc == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') oc = '[第三方卡片]';
            if (oc.includes('[分享]')) oc = '[分享]';
            if (oc.includes('[QQ小世界]')) oc = '[QQ小世界]';
            if (oc.includes('[QQ小程序]')) oc = '[QQ小程序]';
            if (oc.includes('[QQ红包]')) oc = '[QQ红包]';
            //oc = this.rp_linkasn(oc);
        }
        let imgs = [];
        if (msg.attachments) {
            for (let s of msg.attachments) {
                if (s.content_type.startsWith('image')) {
                    if (s.url) {
                        imgs.push(`https://${s.url}`);
                    }
                }
            }
        }
        let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: msg.author, member: msg.member, imgs: imgs, text: oc, reason: reason } }));
        if (id) {
            return `https://${global.miniappconfig.host}/s/m${id}`;
        }

        return false;
    }

    async checknick(msg) {

        if (await this.check_isexpir(msg.guild_id) || msg.member.roles.includes('2') || msg.member.roles.includes('4') || msg.member.roles.includes('5') || msg.member.roles.includes('7')) return false;

        let precheck = await this.match_forbidden_words_nick(msg.member.nick, msg.guild_id);
        if (precheck[0]) {
            let type = precheck[1][0].deal_type;
            let keyword = precheck[1][0].keyword;
            if (type == '0') {
                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.author.id, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                try {
                    await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                } catch (err) { }
                await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `用户名片触发违禁词【${keyword}】，被移出频道`);
            } else if (type == '1') {
                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.author.id, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                try {
                    await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                } catch (err) { }
                await this.del_guild_users_points(msg.guild_id, msg.author.id);
                await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `用户名片触发违禁词【${keyword}】，被移出频道并拉黑`);
            } else if (type == '2') {

                try {
                    await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                    await client.muteApi.muteMember(msg.guild_id, msg.author.id, { seconds: 60 });
                } catch (err) { }

                await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `用户名片触发违禁词【${keyword}】，被限制发言`);

                let link = await this.getMesssagelink(msg, `频道内昵称触发违禁词【${keyword}】`);

                let replay = `<@${msg.author.id}>
您的频道昵称包含敏感词，发言已被撤回
请及时整改
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}
管理快捷处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                await this.punish_notify(msg.guild_id, replay, msg.id);

                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `<@${msg.author.id}> 抱歉，您的频道昵称包含敏感词，请及时整改，方可解除发言限制，如若有任何疑问，请联系频道管理层` });

            }
            return true;
        }


        let sets = await this.get_EventsSets(msg.guild_id, '名片监控');
        if (sets[0]) {
            sets = sets[1][0];
            if (sets.useit == 'true') {

                let image = '';
                let content = '';
                let tochannel = '';
                let obj;

                try {
                    obj = JSON.parse(sets.content);
                    for (let s of obj.ls) {
                        for (let ss of s.fromcs) {
                            if (msg.member.roles.includes(ss.id)) {
                                image = s.ca;
                                content = s.cb;
                                tochannel = s.toca;
                                break;
                            }
                        }
                        if (image && content && tochannel) break;
                    }
                } catch (err) { }

                if (!(image && content && tochannel)) return false;

                content = content.replaceAll('\r\n', '\r');
                content = content.replaceAll('{艾特}', `<@!${msg.author.id}>`);
                content = this.rp_linkasn(content);

                let newnick = msg.member.nick;
                let regexStr = image;
                let regex = new RegExp(regexStr, 'g');
                if (!regex.test(newnick)) {

                    try {
                        await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                        await client.muteApi.muteMember(msg.guild_id, msg.author.id, { seconds: 60 });
                    } catch (err) { }

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: tochannel, msg_id: msg.id, content: content });
                    msg.content = '';
                    return true;
                }

            }
        }
        return false;
    }

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (await this.checknick(msg)) {
            msg.content = '';
            return;
        }

        if (msg.content) {
            let c = msg.content;
            c = c.replace(new RegExp(`^<@(!)?${global.robotid}> *`), '').trim()
            let obj = { val: c };
            if (await this.match_c(/^\/(全员)?(禁言|解禁) *(<?@?!?(\d+)>?)? *(\d+)? *(d|h|m|s)?/, obj, msg.guild_id)) {
                c = obj.val;
                let answer = '';
                if (c[2]) {
                    let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `${c[1] || ''}${c[2]}`, msg.channel_id);
                    if (role == '') {
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        if (c[1] == '全员') {
                            if (c[2] == '禁言') {
                                if (c[4]) {
                                    try {
                                        let time = Number(c[4]);
                                        if (c[6]) {
                                            if (c[6] == 'd') {
                                                time = time * 60 * 60 * 24;
                                            } else if (c[6] == 'h') {
                                                time = time * 60 * 60;
                                            } else if (c[6] == 'm') {
                                                time = time * 60;
                                            }
                                        }
                                        await client.muteApi.muteAll(msg.guild_id, { seconds: time.toString() });
                                        answer = '执行成功';
                                    } catch (err) {
                                        answer = `执行出错：${JSON.stringify(err)}`;
                                    }
                                } else {
                                    answer = '格式：/全员禁言300s\r表示禁言时长300秒，可选单位：\rd,h,m,s\r分别代表天、时、分、秒';
                                }
                            } else if (c[2] == '解禁') {
                                try {
                                    await client.muteApi.muteAll(msg.guild_id, { seconds: "0" });
                                    answer = '执行成功';
                                } catch (err) {
                                    answer = `执行出错：${JSON.stringify(err) }`;
                                }
                            } else {
                                return;
                            }
                        } else {
                            if (c[4]) {
                                if (c[2] == '禁言') {

                                    if (!c[5]) {
                                        answer = '格式：\r/禁言161525161616 300s\r/禁言@xxx 300s\r数字表示用户id\r@xxx表示艾特对方\r300s表示禁言时长300秒，可选单位：\rd,h,m,s\r分别代表天、时、分、秒';
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                                       
                                        return;
                                    }

                                    let member = '';
                                    try {
                                        let webr = await client.guildApi.guildMember(msg.guild_id, c[4]);
                                        member = webr.data;
                                    } catch (err) {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '获取对方信息出错，执行失败', message_reference: { message_id: msg.id } });
                                        return;
                                    }

                                    if (!member || !member.roles) member.roles = [];
                                    if (member.roles.includes('2') || member.roles.includes('4') || member.roles.includes('5') || member.roles.includes('7')) {
                                        answer = '对方为频道管理层，无法对其进行禁言';
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                                       
                                        return;
                                    }

                                    try {
                                        let time = Number(c[5]);
                                        if (c[6]) {
                                            if (c[6] == 'd') {
                                                time = time * 60 * 60 * 24;
                                            } else if (c[6] == 'h') {
                                                time = time * 60 * 60;
                                            } else if (c[6] == 'm') {
                                                time = time * 60;
                                            }
                                        }
                                        await client.muteApi.muteMember(msg.guild_id, c[4], { seconds: time.toString() });
                                        answer = '执行成功';
                                    } catch (err) {
                                        answer = `执行出错：${JSON.stringify(err) }`;
                                    }
                                } else if (c[2] == '解禁') {
                                    try {
                                        await client.muteApi.muteMember(msg.guild_id, c[4], { seconds: "0" });
                                        answer = '执行成功';
                                    } catch (err) {
                                        answer = `执行出错：${JSON.stringify(err) }`;
                                    }
                                } else {
                                    return;
                                }
                            } else {
                                if (c[2] == '禁言') answer = '格式：\r/禁言161525161616 300s\r/禁言@xxx 300s\r数字表示用户id\r@xxx表示艾特对方\r300s表示禁言时长300秒，可选单位：\rd,h,m,s\r分别代表天、时、分、秒';
                                if (c[2] == '解禁') answer = '格式：\r/解禁161525161616\r/解禁@xxx\r数字表示用户id\r@xxx表示艾特对方';
                            }
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                        
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });                       
                    }
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/踢(黑|撤)?(撤)? *(<?@?!?(\d+)>?)?/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[3]) {
                    let role = await this.check_cpermission(msg.member.roles, msg.guild_id, `踢${c[1] || ''}${c[2] || ''}`);
                    if (role) {
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        let black = false;
                        let draw = false;
                        if (c[1] == '黑') black = true;
                        if (c[1] == '撤') draw = true;
                        if (c[2]) draw = true;

                        let member = '';
                        try {
                            let webr = await client.guildApi.guildMember(msg.guild_id, c[4]);
                            member = webr.data;
                        } catch (err) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '获取对方信息出错，执行失败', message_reference: { message_id: msg.id } });
                            return;
                        }

                        if (!member || !member.roles) member.roles = [];

                        if (member.roles.includes('2') || member.roles.includes('4') || member.roles.includes('5') || member.roles.includes('7')) {
                            let answer = '对方为频道管理层，无法对其进行操作';
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                            
                            return;
                        }

                        if (black) {
                            await this.del_guild_users_points(msg.guild_id, c[4]);
                        }

                        let ret = await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: c[4], sandbox: false, add_blacklist: black, delete_history_msg_days: draw ? -1 : 0 });
                        let answer = ret ? `操作成功\r对方id：${c[4]}` : '操作失败，可能当前频道的机器人踢人接口被限制，建议过一段时间再尝试';
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                        
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });                       
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式示范：\r${c[0]}@xxx\r${c[0]} 1626161\r@xxx表示艾特对方，数字表示用户id`, message_reference: { message_id: msg.id } });                  
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/重置全员警告/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `重置全员警告`, msg.channel_id);
                if (role == '') {
                    let answer = '';

                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    answer = '成功重置所有用户警告次数为0';
                    let check = await this.user_worningcount_reset_alluser(msg.guild_id);
                    await this.del_worninglogs_guild(msg.guild_id);
                    if (!check) answer = '未知错误，重置失败';

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/(查|重置)警告 *(<?@?!?(\d+)>?)?/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[3]) {
                    let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `${c[1]}警告`, msg.channel_id);
                    if (role == '') {
                        let answer = '';
                        if (c[1] == '查') {
                            answer = '对方未被警告过';
                            let check = await this.ifhas_guild_users_points(msg.guild_id, c[3]);
                            if (check[0]) {
                                answer = `累计被警告次数：${check[1][0].warning_counts}\r\r若想查看警告原因、警告记录，请前往小程序日志页搜索查看`;
                            }
                        } else {
                            await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                            answer = '成功重置为0';
                            let check = await this.user_worningcount_reset(msg.guild_id, c[3]);
                            await this.del_worninglogs_user(msg.guild_id, c[3]);
                            if (!check) answer = '未知错误，重置失败';
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/${c[1]}警告@xxx\r@xxx表示艾特对方\r也可不艾特，使用对方的id\r如：${c[1]}警告 123`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/警告 *(\d+)? *(.*?)? *(<@!?(\d+)>)?$/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[2] && c[4]) {
                    let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '警告', msg.channel_id);
                    if (role == '') {
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        let member = '';
                        try {
                            let webr = await client.guildApi.guildMember(msg.guild_id, c[4]);
                            member = webr.data;
                        } catch (err) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '获取对方信息出错，执行失败', message_reference: { message_id: msg.id } });
                            return;
                        }

                        if (!member || !member.roles) member.roles = [];

                        if (member.roles.includes('2') || member.roles.includes('4') || member.roles.includes('5') || member.roles.includes('7')) {
                            let answer = '对方为频道管理层，无法对其进行操作';
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                            return;
                        }
                        let answer;

                        let scnt = 1;
                        if (c[1] && !isNaN(c[1])) scnt = Number(c[1]);
                        if (scnt <= 0) scnt = 1;
                        await this.s_writelog(msg.guild_id, c[4], member.user.username, member.user.avatar, '0', `被管理员警告${scnt}次，警告理由：${c[2]}`);
                        let cnow = await this.user_worningcount_add(msg.guild_id, c[4], scnt);
                        let check = await this.check_ifhitworningsets(msg.guild_id, c[4], cnow);
                        if (check) {
                            let cop = check.ptype;
                            let optime = check.ptime;
                            if (cop == 0) {
                                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: c[4], sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                                answer = `对方触发警告处罚策略，已被移出本频道`;
                                await this.user_worningcount_reset(msg.guild_id, c[4]);
                                await this.s_writelog(msg.guild_id, c[4], member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统踢出，警告理由：${c[2]}`);
                            } else if (cop == 1) {
                                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: c[4], sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                                answer = `对方触发警告处罚策略，已被移出并拉黑`;
                                await this.del_guild_users_points(msg.guild_id, c[4]);
                                await this.s_writelog(msg.guild_id, c[4], member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统踢出并拉黑，警告理由：${c[2]}`);
                            } else {

                                try {
                                    await client.muteApi.muteMember(msg.guild_id, c[4], { seconds: optime.toString() });
                                } catch (err) { }

                                answer = `<@!${c[4]}> 您因【${c[2]}】被管理员警告${scnt}次，触发禁言处罚，被禁言${this.longtime2s(optime*1000)}，请规范发言`;
                                if (check.reset == true) {
                                    await this.user_worningcount_reset(msg.guild_id, c[4]);
                                    await this.del_worninglogs_user(msg.guild_id, c[4]);
                                }
                                await this.s_writelog(msg.guild_id, c[4], member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统禁言${this.longtime2s(optime*1000)}，警告理由：${c[2]}`);
                            }
                        } else {
                            answer = `<@!${c[4]}> 您因【${c[2]}】被管理员警告${scnt}次，请规范发言，多次警告可能会被禁言或移出频道`;
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/警告 1 理由 @xxx\r1表示警告一次，@xxx表示艾特对方\r\n可省略警告次数，默认警告一次`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/撤销警告 *(\d+)? *(<@!?(\d+)>)?$/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[3]) {
                    let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '撤销警告', msg.channel_id);
                    if (role == '') {
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        let member = '';
                        try {
                            let webr = await client.guildApi.guildMember(msg.guild_id, c[3]);
                            member = webr.data;
                        } catch (err) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '获取对方信息出错，执行失败', message_reference: { message_id: msg.id } });
                            return;
                        }

                        if (!member || !member.roles) member.roles = [];

                        if (member.roles.includes('2') || member.roles.includes('4') || member.roles.includes('5') || member.roles.includes('7')) {
                            let answer = '对方为频道管理层，无法对其进行操作';
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                            return;
                        }

                        let scnt = 1;
                        if (c[1] && !isNaN(c[1])) scnt = Number(c[1]);
                        if (scnt <= 0) scnt = 1;

                        let cnow = await this.ifhas_guild_users_points(msg.guild_id, c[3]);
                        cnow = (cnow[0] && !isNaN(cnow[1][0].warning_counts) ? Number(cnow[1][0].warning_counts) : 0);
                        if (scnt <= cnow) {
                            scnt = -1 * scnt;
                        } else {
                            scnt = -1 * cnow;
                        }

                        await this.user_worningcount_add(msg.guild_id, c[3], scnt);

                        await this.s_writelog(msg.guild_id, c[3], member.user.username, member.user.avatar, '0', `被管理员撤回${(scnt * -1).toFixed(0).toString()}次警告`);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '撤回成功', message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/撤销警告 1 @xxx\r1表示撤销一次，@xxx表示艾特对方\r\n可省略次数，默认撤销一次`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/清理低等级用户 *(等级(2[0-5]|1[0-9]|[1-9]))? *(20(\d+)年(1[0-2]|[1-9])月)?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '清理低等级用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '格式：/清理低等级用户 等级1 2022年5月\r该命令表示清理所有2022年5月及之前加入且等级<=1的成员\r\r⚠⚠该功能会导致踢人被限制，将严重影响当天的其他功能，建议在每天的23点使用本功能，以此将负面影响降到最低';
                    if (c[2] && c[4] && c[5]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        answer = `清理任务开始排队\r目标等级：<= ${c[2]}\r目标时间：<= 20${c[4]}年${c[5]}月\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                        let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                        if (ret) {
                            pushMemberTask(msg, c[2], c[4], c[5], false, '', false, ret.id);
                        }
                        return;

                    }
                   await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });                  
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });                    
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/清理无身份组用户(ok)?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '清理无身份组用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '⚠⚠该功能会导致踢人被限制，将严重影响当天的其他功能，建议在每天的23点使用本功能，以此将负面影响降到最低\r\r确认清理请发送：\r/清理无身份组用户ok';
                    if (c[1]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        answer = `清理任务开始排队\r目标用户：无身份组用户\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                        let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                        if (ret) {
                            pushMemberTask(msg, '', '', '', true, '', false, ret.id);
                        }
                        return;

                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/清理指定身份组用户 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '清理指定身份组用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '格式：/清理指定身份组用户 身份组名\r该命令表示清理所有含有身份组[身份组名]的成员\r\r⚠⚠该功能会导致踢人被限制，将严重影响当天的其他功能，建议在每天的23点使用本功能，以此将负面影响降到最低';
                    if (c[1]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        try {
                            let { data } = await client.roleApi.roles(msg.guild_id);
                            answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                            for (let role of data.roles) {
                                if (role.id == '1' || role.id == '2' || role.id == '4' || role.id == '5' || role.id == '7') {
                                    continue;
                                } else if (role.name == c[1]) {
                                    answer = `清理任务开始排队\r目标用户：指定身份 [${c[1].trim()}]\rid：${role.id}\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                                    let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                                    if (ret) {
                                        pushMemberTask(msg, '', '', '', false, role.id, false, ret.id);
                                    }
                                    return;
                                }
                            }
                        } catch (err) {
                            answer = '获取频道身份组列表出错';
                        }

                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/迁移指定身份组用户 *((.*) *= *(.*))?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '迁移指定身份组用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '格式：/迁移指定身份组用户 身份名 = 目标身份名\r该命令表示将所有成员的身份组[身份名]替换为身份组[目标身份名]';
                    if (c[2] && c[3]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        try {
                            let ida = false;
                            let idb = false;
                            let { data } = await client.roleApi.roles(msg.guild_id);
                            answer = '未能查询到指令内的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                            for (let role of data.roles) {

                                if (role.id == '1' || role.id == '2' || role.id == '4' || role.id == '5' || role.id == '7') {
                                    continue;
                                } else if (role.name == c[2].trim()) {
                                    ida = role.id;
                                } else if (role.name == c[3].trim()) {
                                    idb = role.id;
                                }

                                if (ida && idb) {
                                    answer = `迁移任务开始排队\r目标用户：指定身份 [${c[2].trim()}]\rid：${ida}\r目标身份 [${c[3].trim()}]\rid：${idb}\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                                    let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                                    if (ret) {
                                        pushMemberTask(msg, ida, '', '', false, idb, true, ret.id);
                                    }
                                    return;
                                }
                            }
                        } catch (err) {
                            answer = '获取频道身份组列表出错';
                        }

                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/迁移无身份组用户 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '迁移无身份组用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '格式：/迁移无身份组用户 身份组名\r该命令表示给所有无身份组成员赋予指定身份组[身份组名]';
                    if (c[1]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        try {
                            let { data } = await client.roleApi.roles(msg.guild_id);
                            answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                            for (let role of data.roles) {
                                if (role.id == '1' || role.id == '2' || role.id == '4' || role.id == '5' || role.id == '7') {
                                    continue;
                                } else if (role.name == c[1]) {
                                    answer = `迁移任务开始排队\r目标身份 [${c[1]}]\rid：${role.id}\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                                    let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                                    if (ret) {
                                        pushMemberTask(msg, '', '', '', true, role.id, true, ret.id);
                                    }
                                    return;
                                }
                            }
                        } catch (err) {
                            answer = '获取频道身份组列表出错';
                        }

                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/查看任务进度', obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '查看任务进度');
                if (role) {
                    let answer = '';

                    answer = '当前没有正在排队或执行的任务';

                    let job = await que.getJob(msg.guild_id);
                    if (job) {
                        let state = await job.getState();
                        if (state == 'waiting') {
                            answer = '当前任务正在排队中\r退出排队指令：/退出任务排队';
                        }
                    }

                    let cdcheck = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
                    if (cdcheck) {
                        let tot = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:total`);
                        if (tot) {
                            answer = `当前任务进度：\r${cdcheck}/${tot}\r已处理数/已检查数\r\r如果需要强制结束任务，发送指令：\r/中断任务`;
                        }
                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/中断任务', obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '中断任务');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '当前没有正在执行的任务';
                    let cdcheck = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
                    if (cdcheck) {
                        await redis.set(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:stop`, 'on', 300);
                        answer = '任务已中断';
                    }

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/退出任务排队', obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '退出任务排队');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '当前没有正在排队的任务';

                    let job = await que.getJob(msg.guild_id);
                    if (job) {
                        let state = await job.getState();
                        if (state == 'waiting') {
                            await job.remove();
                            answer = '任务排队已退出';
                        }
                    }

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/迁移低等级用户 *(等级(2[0-5]|1[0-9]|[1-9]))? *(20(\d+)年(1[0-2]|[1-9])月)? *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission(msg.member.roles, msg.guild_id, '迁移低等级用户');
                if (role) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    let answer = '';

                    answer = '格式：/迁移低等级用户 等级1 2022年5月 身份组名\r该命令表示赋予所有2022年5月及之前加入且等级<=1的成员一个指定的身份组';
                    if (c[2] && c[4] && c[5] && c[6]) {

                        let job = await que.getJob(msg.guild_id);
                        if (job) {
                            let state = await job.getState();
                            if (state == 'active') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在执行，请先等待当前任务执行完成\r强制结束指令：/中断任务', message_reference: { message_id: msg.id } });
                                return;
                            } else if (state == 'waiting') {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '已有任务在排队中，请耐心等待\r退出排队指令：/退出任务排队', message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await job.remove();
                            }
                        }

                        try {
                            let { data } = await client.roleApi.roles(msg.guild_id);
                            answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                            for (let role of data.roles) {
                                if (role.id == '1' || role.id == '2' || role.id == '4' || role.id == '5' || role.id == '7') {
                                    continue;
                                } else if (role.name == c[6]) {
                                    answer = `迁移任务开始排队\r目标等级：<= ${c[2]}\r目标时间：<= 20${c[4]}年${c[5]}月\r目标身份 [${c[6]}]\rid：${role.id}\r\r若想主动查看执行进度，请发送指令：\r/查看任务进度`;
                                    let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                                    if (ret) {
                                        pushMemberTask(msg, c[2], c[4], c[5], false, role.id, true, ret.id);
                                    }
                                    return;
                                }
                            }
                        } catch (err) {
                            answer = '获取频道身份组列表出错';
                        }
                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '权限不足', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            }
        }
    } 

}

async function GetMid(guildid, ifevent) {

    let stmt = `SELECT id FROM MessagesId WHERE (guildid=? OR guildid=?) AND time>? AND type=?`;

    let p;

    if (ifevent) {
        p = [guildid, guildid, (Date.now() - 1000 * 60 * 5 + 1000 * 20), '1'];
    } else {
        p = [guildid, global.miniappconfig.refguildid, (Date.now() - 1000 * 60 * 5 + 1000 * 20), '0'];
    }

    let rows = await new Promise((resolve, reject) => {
        global.pool_message.query(stmt, p, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (rows && rows[0]) {
        return rows[0].id;
    } else {
        return '';
    }
}

function check_level(roles) {
    for (let role of roles) {
        let n = Number(role);
        if (!isNaN(n) && n >= 11 && n <= 35) {
            return n - 10;
        }
    }
    return 0;
}

async function ClearMembers(msg, level, y, m, noid, tid, mov) {

    let q = {
        after: '0',
        limit: 400
    };

    let total = 0;
    let dealed = 0;
    let stopcheck = false;
    let eventid = await GetMid(msg.guild_id, false);

    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `任务排队已完成，开始执行`, message_reference: { message_id: msg.id } });

    /*
    await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `任务已强制结束\r由于频道的API出现问题且迟迟未修复，批量操作频道用户可能导致高质量用户损失，该系列功能暂时关闭`, message_reference: { message_id: msg.id } });
    return;
    */

    await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:stop`);
    await redis.set(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:total`, total, 600);
    await redis.set(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 0, 300);

    let ct = true;
    while (ct) {
        try {

            stopcheck = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:stop`);
            if (stopcheck) {
                break;
            }

            let { data } = await client.guildApi.guildMembers(msg.guild_id, q);

            if (data.length <= 0) {
                ct = false;
                break;
            }

            let thistimetotal = data.length;
            let thistimedealed = 0;

            total += data.length;
            await redis.set(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:total`, total, 600);

            for (let s of data) {
                q.after = s.user.id;

                stopcheck = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:stop`);
                if (stopcheck) {
                    break;
                }

                if (s.roles && s.joined_at) {

                    if (s.roles.includes('2') || s.roles.includes('4') || s.roles.includes('5') || s.roles.includes('7') || s.user.bot == true) {
                        if(!mov) continue;
                    }

                    if (noid == true || (mov == true && !level)) { //无身份组成员
                        let match = false;
                        for (let i = 0; i < s.roles.length; i++) {
                            if (s.roles[i].length > 5) {
                                match = false;
                                break;
                            } else if (i == s.roles.length - 1) {
                                match = true;
                            }
                        }
                        if (!match) continue;

                        if (mov == true) {
                            let delr = await ext.postRoleMember(msg.guild_id, false, s.user.id, tid);
                            if (!delr) {
                                ct = false;
                                break;
                            } else {
                                await redis.incr(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 300);
                                dealed++;
                                thistimedealed++;
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        } else {
                            let delr = await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: s.user.id, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                            if (!delr) {
                                ct = false;
                                break;
                            } else {
                                await redis.incr(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 300);
                                dealed++;
                                thistimedealed++;
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }

                    } else if (tid != '' && !level) { //清理指定身份组成员

                        let match = false;
                        match = s.roles.includes(tid);
                        if (!match) continue;

                        let delr = await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: s.user.id, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                        if (!delr) {
                            ct = false;
                            break;
                        } else {
                            await redis.incr(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 300);
                            dealed++;
                            thistimedealed++;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                    } else if (tid != '' && level != '' && mov == true) { //迁移指定身份组成员

                        let match = false;
                        match = s.roles.includes(level);
                        if (!match) continue;

                        await ext.Del_RoleMember(msg.guild_id, false, s.user.id, level, false);
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        let delr = await ext.postRoleMember(msg.guild_id, false, s.user.id, tid);
                        if (!delr) {
                            ct = false;
                            break;
                        } else {
                            await redis.incr(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 300);
                            dealed++;
                            thistimedealed++;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                    } else {
                        let check = s.joined_at.match(/20(\d{2})-0?(1[0-2]|[1-9])/);
                        if (check[1] && check[2]) {
                            if (Number(check[1]) <= Number(y)) {
                                if (Number(check[2]) <= Number(m)) {
                                    if (check_level(s.roles) <= Number(level)) {

                                        let delr = false;
                                        if (mov) {
                                            delr = await ext.postRoleMember(msg.guild_id, false, s.user.id, tid);
                                        } else {
                                            delr = await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: s.user.id, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                                        }

                                        if (!delr) {
                                            ct = false;
                                            break;
                                        } else {
                                            await redis.incr(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`, 300);
                                            dealed++;
                                            thistimedealed++;
                                            if (!mov) await new Promise(resolve => setTimeout(resolve, 1000));
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
                s = null;
            }

            data = null;

            eventid = await GetMid(msg.guild_id, false);

            stopcheck = await redis.get(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员:stop`);
            if (stopcheck) {
                break;
            }

            if (stopcheck) {
                ct = false;
                await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `${mov == true ? '迁移' : '移除'}任务被强制终止`, message_reference: { message_id: msg.id } });
            } else if (ct == false) {
                await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `${mov == true ? '迁移' : '移除'}目标成员失败，任务终止，可能${mov == true ? '身份组设置' : '成员移除'}被限制，请${mov == true ? '检查身份组人数是否已满或等待一段时间' : '等到第二天'}再尝试`, message_reference: { message_id: msg.id } });
            } else {
                if (thistimedealed > 0) await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `成员${mov == true ? '迁移' : '移除'}进度汇报\r本次已${mov == true ? '迁移' : '移除'}: ${thistimedealed}/${thistimetotal}\r总共已${mov == true ? '迁移' : '移除'}: ${dealed}/${total}\r已处理数/已检查数\r\r如果需要强制结束任务，发送指令：\r/中断任务`, message_reference: { message_id: msg.id } });
            }
        } catch (err) {
            await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: '获取成员列表失败，任务终止，可能查询被限制', message_reference: { message_id: msg.id } });
            ct = false;
        }
    }
    await redis.del(`GuildPro:初遇小竹:用户管理系统:${msg.guild_id}:清理低等级成员`);
    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: eventid, content: `工作完成，共${mov == true ? '迁移' : '清理'} ${dealed}/${total} 个成员`, message_reference: { message_id: msg.id } });
}