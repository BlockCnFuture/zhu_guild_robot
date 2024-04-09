import tools from '../tools.js'

export default class handler extends tools {

    async RunOp(ret, msg) {
        let lastkeyword = '';
        let replayarr = [];
        let tmp = [];
        let id = 0;
        for (let check of ret) {
            check.id = id;
            id++;
            if (check.enabled_channels == 'all' || check.enabled_channels.includes(`<#${msg.channel_id}>`)) {
                if (lastkeyword == '') lastkeyword = check.keyword;
                if (lastkeyword != check.keyword) {
                    replayarr.push(tmp[Math.floor(Math.random() * tmp.length)]);
                    tmp.length = 0;
                    tmp = [];
                    lastkeyword = check.keyword;
                    tmp.push(check);
                } else {
                    tmp.push(check);
                }
            }
        }
        if (tmp.length > 0) {
            replayarr.push(tmp[Math.floor(Math.random() * tmp.length)]);
            tmp.length = 0;
            tmp = [];
        }
        for (let s of replayarr) {
            if (s.approved == 'on') {
                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '该关键词审核中，暂时无法展示内容\r加速审核：加入我的官方频道进行反馈', message_reference: { message_id: msg.id } });
                break;
            } else if (s.approved == 'not') {
                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '该关键词审核未通过，请检查回复内容是否含有敏感信息\r审核反馈：加入我的官方频道进行反馈', message_reference: { message_id: msg.id } });
                break;
            }
            let img = '';
            if (s.image) img = await this.readFileToBuffer(s.image);
            let message_reference = '';
            let content = s.content;
            if (content.includes('{回复}') && !img) message_reference = { message_id: msg.id };
            content = content.replaceAll('{回复}', '');
            content = content.replaceAll('{艾特}', `<@!${msg.author.id}>`);
            content = content.replaceAll('\r\n', `\r`);

            let cd = Number(s.cd);
            if (isNaN(cd) || cd < 0 || cd > 15) cd = 0;
            if (cd > 0) {
                let cdcheck = await redis.get(`ZuKeyWordS:${msg.guild_id}:${msg.author.id}:${s.keyword}:${s.id.toString()}:cd`);
                if (cdcheck) {
                    break;
                }
            }
            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: content, image: img, message_reference: message_reference });
            if (cd > 0) await redis.set(`ZuKeyWordS:${msg.guild_id}:${msg.author.id}:${s.keyword}:${s.id.toString()}:cd`, cd.toString(), cd);
        }
    }

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (await this.check_isexpir(msg.guild_id)) return;

        let atrobot = false;
        if (msg.mentions && msg.mentions.filter(i => { return i.bot; }).length > 0) atrobot = true;
        if (!msg.content || msg.content.length <= 0) {
            if (msg.attachments && msg.attachments.filter(i => { return i.content_type.startsWith('image'); }).length > 0) {
                await this.addactiverecord(msg.guild_id, msg.author.id, '成员发言奖励设置', 0, true, atrobot, msg.author.avatar, msg.author.username);
            }
        } else {
            await this.addactiverecord(msg.guild_id, msg.author.id, '成员发言奖励设置', msg.content.length, false, atrobot, msg.author.avatar, msg.author.username);
        }

        await redis.set(`ZuCacheGuildsChid:${msg.guild_id}`, msg.channel_id, 300);

        if (!msg.nocheck) {

            await this.write_Messages(msg.guild_id, msg.channel_id, msg.seq, JSON.stringify(msg));
            let idarr = await this.check_notSupportMessages(msg.guild_id, msg.channel_id, msg.seq);
            if (idarr && idarr.length > 0) {
                let i = 0;
                for (let ss of idarr) {
                    if (i >= 2) break;
                    global.post_new_event_que.add('频道事件', {
                        eventType: 'NotSupportMessage',
                        eventId: `NotSupportMessage`,
                        msg: {
                            guild_id: msg.guild_id,
                            channel_id: msg.channel_id,
                            seq: ss,
                            content: '<不支持的消息>'
                        }
                    });
                    i++;
                }
            }
        }

        if (msg.content) {
            let tc = msg.content;
            if (tc == '当前版本不支持查看，请升级QQ版本') tc = '<文件>';
            if (tc == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') tc = '<第三方卡片>';
            if (tc.includes('[分享]')) tc = '<分享>';
            if (tc.includes('[QQ小世界]')) tc = '<QQ小世界>';
            if (tc.includes('[QQ小程序]')) tc = '<QQ小程序>';
            if (tc.includes('[QQ红包]')) tc = '<QQ红包>';

            let ret = await this.match_reply_keywords(tc, msg.guild_id);
            if (ret[0]) {
                ret = ret[1];
                await this.RunOp(ret, msg);
                return;
            }
        }

    }

}