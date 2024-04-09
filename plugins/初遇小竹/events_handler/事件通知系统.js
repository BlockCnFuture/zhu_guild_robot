import tools from '../tools.js'

export default class handler extends tools {

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

    async handle_MESSAGE_DELETE(msg) {

        if (!msg.message.author) return;

        if (msg.message.author.bot) return;

        if (msg.message.author.id == msg.op_user.id) {
            if (!await this.check_isexpir(msg.message.guild_id)) {

                let sets = await this.get_EventsSets(msg.message.guild_id, '撤回通知');
                if (sets[0] && sets[1][0].useit == 'true') {
                    let schannel = sets[1][0].tochannel;
                    let seq = ext.depackmsgid(msg.message.id);
                    let check = await this.check_Messages(msg.message.guild_id, msg.message.channel_id, seq);
                    if (check[0]) {
                        try {
                            let oldmsg = JSON.parse(check[1]);
                            let oc = oldmsg.content;
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
                            if (oldmsg.attachments) {
                                for (let s of oldmsg.attachments) {
                                    if (s.content_type.startsWith('image')) {
                                        if (s.url) {
                                            imgs.push(`https://${s.url}`);
                                        }
                                    }
                                }
                            }
                            let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: oldmsg.author, member: oldmsg.member, imgs: imgs, text: oc } }));
                            if (id) {
                                let replay = `<#${msg.message.channel_id}>
<@!${msg.message.author.id}> 撤回了一条消息
发送时间：${oldmsg.timestamp.replaceAll('+08:00', '').replaceAll('T', ' ')}
撤回时间：${this.timestamp2times(Date.now())}
撤回内容：
https://${global.miniappconfig.host}/s/m${id}`;
                                await ext.SendMessage({ guild_id: msg.message.guild_id, channel_id: schannel, msg_id: msg.eventId, content: replay });
                            }
                        } catch (err) { }
                    }
                }
            }
        }
    }

    async handle_AUDIO_OR_LIVE_CHANNEL_MEMBER_ENTER(msg) {

        if (!await this.check_isexpir(msg.guild_id)) {
            if (msg.channel_type == 2) {
                let time = Date.now();
                await this.AorVrecordStart(msg.guild_id, msg.user_id, '语音房互动奖励设置', time);

                let cdcheck = await redis.get(`ZuCache:VoiceEnterC:${msg.guild_id}:${msg.channel_id}:cd`);
                if (cdcheck) {
                    return;
                } else {
                    await redis.set(`ZuCache:VoiceEnterC:${msg.guild_id}:${msg.channel_id}:cd`, 'on', 10);
                }

                let s = await this.SAorVrecordStart(msg.guild_id, msg.channel_id, msg.user_id, '语音房通知', true, time);
                if (!s) return;

                let answer = s.content;
                answer = answer.replaceAll('\r\n', `\r`);
                answer = answer.replaceAll('{艾特}', `<@!${msg.user_id}>`);
                answer = answer.replaceAll('{互动时长}', ``);
                answer = answer.replaceAll('{时间}', this.timestamp2times(time));
                answer = answer.replaceAll('{原始子频道}', `<#${msg.channel_id}>`);
                answer = this.rp_linkasn(answer);
                let tochannel = s.tochannel;
                if (tochannel == '0') tochannel = msg.channel_id;

                if (answer && tochannel) await ext.SendMessage({ guild_id: msg.guild_id, channel_id: tochannel, msg_id: msg.eventId, content: answer });
            } else if (msg.channel_type == 5) {
                let time = Date.now();
                await this.AorVrecordStart(msg.guild_id, msg.user_id, '直播间互动奖励设置', time);

                let cdcheck = await redis.get(`ZuCache:LiveEnterC:${msg.guild_id}:${msg.channel_id}:cd`);
                if (cdcheck) {
                    return;
                } else {
                    await redis.set(`ZuCache:LiveEnterC:${msg.guild_id}:${msg.channel_id}:cd`, 'on', 10);
                }

                let s = await this.SAorVrecordStart(msg.guild_id, msg.channel_id, msg.user_id, '直播间通知', true, time);
                if (!s) return;

                let answer = s.content;
                answer = answer.replaceAll('\r\n', `\r`);
                answer = answer.replaceAll('{艾特}', `<@!${msg.user_id}>`);
                answer = answer.replaceAll('{互动时长}', ``);
                answer = answer.replaceAll('{时间}', this.timestamp2times(time));
                answer = answer.replaceAll('{原始子频道}', `<#${msg.channel_id}>`);
                answer = this.rp_linkasn(answer);
                let tochannel = s.tochannel;
                if (tochannel == '0') tochannel = msg.channel_id;

                if (answer && tochannel) await ext.SendMessage({ guild_id: msg.guild_id, channel_id: tochannel, msg_id: msg.eventId, content: answer });
            }
        }
    }

    async handle_AUDIO_OR_LIVE_CHANNEL_MEMBER_EXIT(msg) {

        if (!await this.check_isexpir(msg.guild_id)) {
            if (msg.channel_type == 2) {
                let now = Date.now();
                await this.AorVrecordEnd(msg.guild_id, msg.user_id, '语音房互动奖励设置', now);

                let ret = await this.SAorVrecordEnd(msg.guild_id, msg.channel_id, msg.user_id, '语音房通知', false, now);
                if (!ret) return;
                let bt = this.longtime2s(ret[0] * 1000);
                let s = ret[1];

                let answer = s.content;
                answer = answer.replaceAll('\r\n', `\r`);
                answer = answer.replaceAll('{艾特}', `<@!${msg.user_id}>`);
                answer = answer.replaceAll('{互动时长}', bt);
                answer = answer.replaceAll('{时间}', this.timestamp2times(now));
                answer = answer.replaceAll('{原始子频道}', `<#${msg.channel_id}>`);
                answer = this.rp_linkasn(answer);
                let tochannel = s.tochannel;
                if (tochannel == '0') tochannel = msg.channel_id;

                if (answer && tochannel) await ext.SendMessage({ guild_id: msg.guild_id, channel_id: tochannel, msg_id: msg.eventId, content: answer });
            } else if (msg.channel_type == 5) {
                let now = Date.now();
                await this.AorVrecordEnd(msg.guild_id, msg.user_id, '直播间互动奖励设置', now);

                let ret = await this.SAorVrecordEnd(msg.guild_id, msg.channel_id, msg.user_id, '直播间通知', false, now);
                if (!ret) return;
                let bt = this.longtime2s(ret[0] * 1000);
                let s = ret[1];

                let answer = s.content;
                answer = answer.replaceAll('\r\n', `\r`);
                answer = answer.replaceAll('{艾特}', `<@!${msg.user_id}>`);
                answer = answer.replaceAll('{互动时长}', bt);
                answer = answer.replaceAll('{时间}', this.timestamp2times(now));
                answer = answer.replaceAll('{原始子频道}', `<#${msg.channel_id}>`);
                answer = this.rp_linkasn(answer);
                let tochannel = s.tochannel;
                if (tochannel == '0') tochannel = msg.channel_id;

                if (answer && tochannel) await ext.SendMessage({ guild_id: msg.guild_id, channel_id: tochannel, msg_id: msg.eventId, content: answer });
            }
        }
    }

}