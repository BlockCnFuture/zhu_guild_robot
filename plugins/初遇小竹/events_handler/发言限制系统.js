import tools from '../tools.js'

export default class handler extends tools {

    async getMesssagelink(msg, reason) {

        let oc = msg.content;
        if (oc && oc != '') {
            if (oc == '当前版本不支持查看，请升级QQ版本') oc = '[文件]';
            if (oc == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') oc = '[第三方卡片]';
            if (oc.includes('[分享]')) oc = '[分享]';
            if (oc.includes('[QQ小世界]')) oc = '[QQ小世界]';
            if (oc.includes('[QQ小程序]')) oc = '[QQ小程序]';
            if (oc.includes('[QQ红包]')) oc = '[QQ红包]';
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

    async WriteMessage(msg, reason) {

        let oc = msg.content;
        if (oc && oc != '') {
            if (oc == '当前版本不支持查看，请升级QQ版本') oc = '[文件]';
            if (oc == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') oc = '[第三方卡片]';
            if (oc.includes('[分享]')) oc = '[分享]';
            if (oc.includes('[QQ小世界]')) oc = '[QQ小世界]';
            if (oc.includes('[QQ小程序]')) oc = '[QQ小程序]';
            if (oc.includes('[QQ红包]')) oc = '[QQ红包]';
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
        let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: msg.author, member: msg.member, imgs: imgs, text: oc, reason: reason, id: msg.id, channel_id: msg.channel_id, guild_id: msg.guild_id } }));
        if (id) {
            return id;
        }

        return false;
    }

    async handle_FORUM_THREAD_CREATE(msg) {
        if (await this.check_isexpir(msg.guild_id)) return;

        let content = msg.thread_info.content;
        try {
            content = JSON.parse(content);
            content = this.extractStringsFromJson(content);
        } catch (err) {
            return;
        }
        if (!content || content.length <= 0) return;
        await this.addactiverecord(msg.guild_id, msg.author_id, '成员主题奖励设置', content.length, false, false);
    }

    async handle_FORUM_THREAD_UPDATE(msg) {
        if (await this.check_isexpir(msg.guild_id) == false) {

            if (msg.thread_info.content) {
                let content = msg.thread_info.content;
                try {
                    content = JSON.parse(content);
                    content = this.extractStringsFromJson(content);
                } catch (err) { }

                let ret = await this.match_forbidden_words(content, msg.guild_id, false, '');               

                let sets = await this.get_EventsSets(msg.guild_id, '发帖屏蔽通知');
                let s = await this.get_EventsSets_(msg.guild_id, msg.channel_id, '新帖通知', true);
                let tl = await this.check_ifhitlevellimit_thread(msg.guild_id);

                if ((sets[0] && sets[1][0].useit == 'true') || (s[0] && s[1][0].useit == 'true') || tl != false || ret[0]) {

                    let cdcheck = await redis.get(`ZuCacheTCD:TreadF:${msg.thread_info.thread_id}`);
                    if (cdcheck) {
                        return;
                    }

                    let info = await ext.GetThreadInfo(msg.channel_id, false, msg.thread_info.thread_id);
                    try {
                        if (info.code == 503012 && sets[0] && sets[1][0].useit == 'true') {
                            let cdcheck = await redis.get(`ZuCacheTCD:TreadF:${msg.thread_info.thread_id}`);
                            if (cdcheck) {
                                return;
                            } else {
                                await redis.set(`ZuCacheTCD:TreadF:${msg.thread_info.thread_id}`, 'on', 180);
                            }

                            let ssc = content;
                            ssc = ssc.replaceAll('\r\n', '<br tag>');
                            ssc = ssc.replaceAll('\r', '\r\n');
                            ssc = ssc.replaceAll('\n', '\r\n');
                            ssc = ssc.replaceAll('<br tag>', '\r\n');

                            let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: { avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100', username: '系统', id: global.robotid }, member: false, imgs: [], reason: ssc, text: JSON.stringify(msg.thread_info.content) } }));
                            let extc = '';
                            if (id) {
                                extc = `\r内容回溯：\rhttps://${global.miniappconfig.host}/s/m${id}\r`;
                            }

                            await ext.SendMessage({
                                guild_id: msg.guild_id, channel_id: sets[1][0].tochannel, msg_id: msg.eventId, content: `<@!${msg.author_id}> 您在<#${msg.channel_id}>
发布/重编辑 的主题可能已被QQ官方屏蔽

由于频道可能将主题屏蔽后又恢复主题，因此需要手动确认

手动确认方法：
将校验链接发送给其他账号，若其他账号可正常查看主题，则此为误报
若其他账号无法正常查看主题，则该主题已被屏蔽，建议歇一会或更换发布账号再试试
${extc}
被屏蔽主题发布时间：
${msg.thread_info.date_time.replaceAll('+08:00', '').replaceAll('T', ' ')}
校验链接：
https://${global.miniappconfig.host}/s/t${msg.thread_info.thread_id}`
                            });

                            let check = await redis.get(`ZuCacheT:TreadsSend:${msg.thread_info.thread_id}`);
                            if (check) {
                                check = JSON.parse(check);
                                client.messageApi.deleteMessage(check.channel, check.id, true);
                            }
                            return;
                        } else {

                            if (info.code == 503012 || info.code != undefined) return;

                            let uinfo;
                            try {
                                let { data } = await client.guildApi.guildMember(msg.guild_id, msg.author_id);
                                if (data && data.roles && !data.user.bot) {
                                    uinfo = data;
                                } else {
                                    return;
                                }
                            } catch (err) {
                                return;
                            }

                            if (!(uinfo.roles.includes('4') || uinfo.roles.includes('2') || uinfo.roles.includes('5') || uinfo.roles.includes('7'))) {

                                if (ret[0]) {
                                    for (let sss of ret[1]) {
                                        if (sss.enabled_channels == 'all' || sss.enabled_channels.includes(`<#${msg.channel_id}>`)) {

                                            let safer = false;
                                            if (sss.saferoles && sss.saferoles != '') {
                                                for (let ss of uinfo.roles) {
                                                    if (sss.saferoles.includes(`|${ss}|`)) {
                                                        safer = true;
                                                        break;
                                                    }
                                                }
                                            }

                                            if (!safer) {
                                                await ext.Del_guild_thread(msg.channel_id, false, msg.thread_info.thread_id);
                                                return;
                                            }
                                        }
                                    }
                                }

                                let level = this.check_level(uinfo.roles);
                                for (let sss of tl) {
                                    if (level <= sss.level && !sss?.channels?.includes(`|${msg.channel_id}|`)) {
                                        await ext.Del_guild_thread(msg.channel_id, false, msg.thread_info.thread_id);
                                        return;
                                    }
                                }

                            }

                            if (s[0] && s[1][0].useit == 'true') {
                                let cdcheck = await redis.get(`ZuFCache:ThreadLimit:${msg.guild_id}:${msg.thread_info.thread_id}:cd`);
                                if (cdcheck) {
                                    return;
                                }
                                await redis.set(`ZuFCache:ThreadLimit:${msg.guild_id}:${msg.thread_info.thread_id}:cd`, 'on', 80);

                                try {
                                    if (uinfo.roles.includes('4') || uinfo.roles.includes('2') || uinfo.roles.includes('5') || uinfo.roles.includes('7')) {

                                        let c = info.thread.thread_info.content;

                                        c = JSON.parse(c);
                                        let text = '';
                                        let answer = { Groups: [] };
                                        let index = -1;

                                        index++;
                                        answer.Groups[index] = { poster: { head: '', nick: '', time: '' } };
                                        answer.Groups[index].poster.head = uinfo.user.avatar;
                                        answer.Groups[index].poster.nick = uinfo.user.username;
                                        answer.Groups[index].poster.time = msg.thread_info.date_time.replaceAll('+08:00', '').replaceAll('T', ' ');

                                        for (let p of c.paragraphs) {
                                            for (let e of p.elems) {
                                                if (e && e.type) {
                                                    if (e.type == 1 && e.text) { //文字
                                                        if (e.text.text.slice(-1) != '\n' && e.text.text.slice(-1) != '\r') {
                                                            e.text.text = e.text.text + '\r';
                                                        }
                                                        if (e.text.text) text = `${text}${e.text.text}`
                                                    } else if (e.type == 4 && e.url) { //链接
                                                        if (e.url.desc.slice(-1) != '\n' && e.url.desc.slice(-1) != '\r') {
                                                            e.url.desc = e.url.desc + '\r';
                                                        }
                                                        if (text.slice(-1) == '\r') {
                                                            text = text.slice(0, -1);
                                                        }
                                                        if (e.url.url) text = `${text}<a href="${e.url.url}">${e.url.desc}</a>`
                                                    } else if (e.type == 2 && e.image) { //图片
                                                        if (e.image.plat_image && e.image.plat_image.url) {
                                                            if (text) {
                                                                text = text.replaceAll('\r\n', '<br/>');
                                                                text = text.replaceAll('\r', '<br/>');
                                                                text = text.replaceAll('\n', '<br/>');
                                                                index++;
                                                                answer.Groups[index] = { text: '' };
                                                                answer.Groups[index].text = text;
                                                                text = '';
                                                            }
                                                            index++;
                                                            answer.Groups[index] = { url: '' };
                                                            answer.Groups[index].url = e.image.plat_image.url;
                                                        }
                                                    } else if (e.type == 3 && e.video) { //视频
                                                        if (e.video.plat_video && e.video.plat_video.cover && e.video.plat_video.cover.url) {
                                                            if (text) {
                                                                text = text.replaceAll('\r\n', '<br/>');
                                                                text = text.replaceAll('\r', '<br/>');
                                                                text = text.replaceAll('\n', '<br/>');
                                                                index++;
                                                                answer.Groups[index] = { text: '' };
                                                                answer.Groups[index].text = text;
                                                                text = '';
                                                            }
                                                            index++;
                                                            answer.Groups[index] = { url: '' };
                                                            answer.Groups[index].url = e.video.plat_video.cover.url;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (text) {
                                            text = text.replaceAll('\r\n', '<br/>');
                                            text = text.replaceAll('\r', '<br/>');
                                            text = text.replaceAll('\n', '<br/>');
                                            index++;
                                            answer.Groups[index] = { text: '' };
                                            answer.Groups[index].text = text;
                                            text = '';
                                        }
                                        if (index > 0) {
                                            answer.resourcepath = await this.get_resourcepath();
                                            let html = await render(await this.get_template('image'), answer);
                                            if (html) {
                                                let img = await webview.screenshot({ render_ret: html, data: '', nocache: true });
                                                if (img) {
                                                    let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: s[1][0].tochannel, msg_id: msg.eventId, content: `新的主题 <#${msg.channel_id}>`, image: img });
                                                    if (ret.id) {
                                                        await redis.set(`ZuCacheT:TreadsSend:${msg.thread_info.thread_id}`, JSON.stringify({ channel: msg.channel_id, id: ret.id }), 600);
                                                    }
                                                }

                                            }
                                        }
                                    }
                                } catch (err) { }
                            }

                        }
                    } catch (err) { }
                }




            }
        }
    }

    async RunOp(ret, msg, isreplay) {
        for (let op of ret) {
            if (op.enabled_channels == 'all' || op.enabled_channels.includes(`<#${msg.channel_id}>`)) {

                let safer = false;
                if (op.saferoles && op.saferoles != '') {
                    for (let ss of msg.member.roles) {
                        if (op.saferoles.includes(`|${ss}|`)) {
                            safer = true;
                            break;
                        }
                    }
                }
                if (safer) continue;

                let optype = op.deal_type;
                let optime = Number(op.op_time);
                let notifytext = op.notifytext;
                if (notifytext && msg.id!='') {
                    notifytext = this.rp_linkasn(notifytext);
                    notifytext = notifytext.replaceAll('{艾特}', `<@!${msg.author.id}>`);
                    notifytext = notifytext.replaceAll('{用户id}', `${msg.author.id}`);
                    notifytext = notifytext.replaceAll('{用户昵称}', '');
                    notifytext = notifytext.replaceAll('{回复}', '');
                    notifytext = notifytext.replaceAll('\r\n', '\r');
                    notifytext = notifytext.replaceAll('\n', '\r');
                }
                if (optime <= 0 || isNaN(optime)) optime = 300;

                if (optype != '6' && optype != '8') {
                    try {
                        if (msg.id != '') await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                    } catch (err) { }
                }

                let banspeacking = false;
                let kickout = false;
                let black = false;
                let worning = false;

                if (optype == '0') { //禁言
                    banspeacking = true;
                    let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                    if (notifytext && msg.id != '') {
                        notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                        notifytext = notifytext.replaceAll('{证据链}', link);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                    }
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发违禁词【${op.keyword}】，被禁言${this.longtime2s(optime*1000)}\r\n\r\n发送内容：\r\n${msg.content}`);                   

                    let replay = `<@${msg.author.id}>
您的发言涉嫌违规，已自动禁言
${this.longtime2s(optime * 1000)}
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}
管理解除处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                    await this.punish_notify(msg.guild_id, replay, msg.id);
                } else if (optype == '1') { //警告
                    worning = true;
                } else if (optype == '2') { //警告并禁言
                    banspeacking = true;
                    worning = true;
                } else if (optype == '3') { //踢出
                    kickout = true;
                    let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                    if (notifytext && msg.id != '') {
                        notifytext = notifytext.replaceAll('{处罚时长}', '');
                        notifytext = notifytext.replaceAll('{证据链}', link);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                    }
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发违禁词【${op.keyword}】，被移出频道\r\n\r\n发送内容：\r\n${msg.content}`);                   

                    let replay = `<@${msg.author.id}>
您的发言涉嫌违规，将被【移出频道】
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}`;
                    await this.punish_notify(msg.guild_id, replay, msg.id);
                } else if (optype == '4') { //踢出并拉黑
                    kickout = true;
                    black = true;
                    let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                    if (notifytext && msg.id!='') {
                        notifytext = notifytext.replaceAll('{处罚时长}', '');
                        notifytext = notifytext.replaceAll('{证据链}', link);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                    }
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发违禁词【${op.keyword}】，被移出频道并拉黑\r\n\r\n发送内容：\r\n${msg.content}`);                   

                    let replay = `<@${msg.author.id}>
您的发言涉嫌违规，将被【移出并拉黑】
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}`;
                    await this.punish_notify(msg.guild_id, replay, msg.id);
                } else if (optype == '5') { //无额外操作，单撤回
                    let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                    if (notifytext && msg.id!='') {
                        notifytext = notifytext.replaceAll('{处罚时长}', '');
                        notifytext = notifytext.replaceAll('{证据链}', link);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                    }
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发违禁词【${op.keyword}】，已撤回\r\n\r\n发送内容：\r\n${msg.content}`);                   

                    let replay = `<@${msg.author.id}>
您的发言涉嫌违规，已被系统撤回
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}
管理快捷处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                    await this.punish_notify(msg.guild_id, replay, msg.id);
                } else if (optype == '6' || optype == '7' || optype == '8' || optype == '9') { //人工处理
                    if (optype == '8' || optype == '9') banspeacking = true;
                    let mida = await this.WriteMessage(msg, `触发违禁词【${op.keyword}】`);
                    if (mida) {
                        if (notifytext && msg.id != '') {
                            if (optype == '8' || optype == '9') {
                                notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                            } else {
                                notifytext = notifytext.replaceAll('{处罚时长}', '');
                            }
                            let link = `https://${global.miniappconfig.host}/s/m${mida}`;
                            notifytext = notifytext.replaceAll('{证据链}', link);
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                        }
                        let taskid = await this.write_office_task(msg.guild_id, msg.author.id, '0', mida, 0);
                        if (taskid) await this.punish_office_forbiddenword(msg.guild_id, mida, taskid, msg.id, msg.channel_id, isreplay);
                    }
                }

                if (worning) {
                    await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发违禁词【${op.keyword}】，被警告一次\r\n\r\n发送内容：\r\n${msg.content}`);
                    let cnow = await this.user_worningcount_add(msg.guild_id, msg.author.id, 1);
                    let check = await this.check_ifhitworningsets(msg.guild_id, msg.author.id, cnow);
                    if (check) {
                        let type = check.ptype;
                        optime = check.ptime;
                        let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                        if (type == 0) {
                            kickout = true;
                            black = false;
                            if (notifytext && msg.id != '') {
                                if (banspeacking) {
                                    notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                                } else {
                                    notifytext = notifytext.replaceAll('{处罚时长}', '');
                                }
                                notifytext = notifytext.replaceAll('{证据链}', link);
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                            }
                            await this.user_worningcount_reset(msg.guild_id, msg.author.id);
                            await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `被警告多次，触发警告处罚策略，已被移出频道`);

                            let replay = `<@${msg.author.id}>
您被警告多次，将被【移出频道】
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>`;
                            await this.punish_notify(msg.guild_id, replay, msg.id);
                        } else if (type == 1) {
                            kickout = true;
                            black = true;
                            if (notifytext && msg.id != '') {
                                if (banspeacking) {
                                    notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                                } else {
                                    notifytext = notifytext.replaceAll('{处罚时长}', '');
                                }
                                notifytext = notifytext.replaceAll('{证据链}', link);
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                            }
                            await this.user_worningcount_reset(msg.guild_id, msg.author.id);
                            await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `被警告多次，触发警告处罚策略，已被移出并拉黑`);

                            let replay = `<@${msg.author.id}>
您被警告多次，将被【移出并拉黑】
${this.longtime2s(optime * 1000)}
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>`;
                            await this.punish_notify(msg.guild_id, replay, msg.id);
                        } else {
                            banspeacking = true;
                            if (notifytext && msg.id != '') {
                                notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                                notifytext = notifytext.replaceAll('{证据链}', link);
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                            }
                            if (check.reset == true) {
                                await this.user_worningcount_reset(msg.guild_id, msg.author.id);
                                await this.del_worninglogs_user(msg.guild_id, msg.author.id);
                            }
                            await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `被警告多次，触发警告处罚策略，已被禁言${this.longtime2s(optime * 1000)}`);

                            let replay = `<@${msg.author.id}>
您被警告多次，已被禁言
${this.longtime2s(optime * 1000)}
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
管理解除处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                            await this.punish_notify(msg.guild_id, replay, msg.id);
                        }
                    } else {
                        let link = await this.getMesssagelink(msg, `触发违禁词【${op.keyword}】`);
                        if (notifytext && msg.id != '') {
                            if (banspeacking) {
                                notifytext = notifytext.replaceAll('{处罚时长}', this.longtime2s(optime * 1000));
                            } else {
                                notifytext = notifytext.replaceAll('{处罚时长}', '');
                            }
                            notifytext = notifytext.replaceAll('{证据链}', link);
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: notifytext });
                        }         

                        let replay = `<@${msg.author.id}>
您的发言涉嫌违规，给予【警告一次】
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
违规证据链：
${link}
管理重置警告入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                        await this.punish_notify(msg.guild_id, replay, msg.id);
                    }
                }

                if (banspeacking) {
                    try {
                        await client.muteApi.muteMember(msg.guild_id, msg.author.id, { seconds: optime.toString() });
                    } catch (err) { }
                }

                if (black) {
                    await this.del_guild_users_points(msg.guild_id, msg.author.id);
                }

                if (kickout) {
                    await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.author.id, sandbox: false, add_blacklist: black, delete_history_msg_days: black ? -1 : 0 });
                }

                return;
            }
        }
    }

    async handle_NotSupportMessage(msg) {

        if (await this.check_isexpir(msg.guild_id) == false) {
            if (msg.content) {

                msg.id = ext.packmsgid(msg.guild_id, msg.channel_id, msg.seq.toString(), Date.now());

                try {
                    let { data } = await client.messageApi.message(msg.channel_id, msg.id);
                    let message = data.message;

                    if (message.content != '') return;
                    if (message.author.bot == true) return;

                    let sret = await client.guildApi.guildMember(msg.guild_id, message.author.id);
                    if (!sret.data) return;
                    if (sret.data.user.bot) return;

                    msg.author = message.author;
                    msg.member = message.member;

                    if (!msg.author.avatar) msg.author.avatar = sret.data.user.avatar; //sret.data.user.avatar; 'https://q2.qlogo.cn/headimg_dl?dst_uin=10000&spec=100'
                    msg.member.roles = sret.data.roles;

                    msg.member.nick = msg.author.username;
                    msg.seq_in_channel = msg.seq.toString();
                    msg.timestamp = message.timestamp;
                    msg.nocheck = true;

                    global.post_new_event_que.add('频道事件', {
                        eventType: 'MESSAGE_CREATE',
                        eventId: `MESSAGE_CREATE:${msg.id}`,
                        msg: msg
                    });
                } catch (err) {
                    return;
                }
                
            }
        }
    }

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (!msg.member.roles.includes('4') && !msg.member.roles.includes('2') && !msg.member.roles.includes('5') && !msg.member.roles.includes('7')) {
            if (await this.check_isexpir(msg.guild_id) == false) {

                let t = msg.content;
                if (!t) {
                    t = '';
                } else {
                    if (t == '当前版本不支持查看，请升级QQ版本') t = '<文件>';
                    if (t == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') t = '<第三方卡片>';
                    if (t.includes('[分享]')) t = '<分享>';
                    if (t.includes('[QQ小世界]')) t = '<QQ小世界>';
                    if (t.includes('[QQ小程序]')) t = '<QQ小程序>';
                    if (t.includes('[QQ红包]')) t = '<QQ红包>';
                }
                let ret = await this.match_forbidden_words(t, msg.guild_id, msg.attachments, msg.author.username);
                if (ret[0]) {
                    ret = ret[1];
                    await this.RunOp(ret, msg);
                    msg.content = '';
                    return;
                }

                if (msg.content) {

                    let imgs = msg?.attachments?.filter(i => {
                        return i.content_type.startsWith('image');
                    })

                    if (await this.check_ifhitrule(msg.guild_id, msg.channel_id, t, (imgs && imgs.length > 0))) {
                        try {
                            await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                            await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发发言格式限制策略，消息被撤回`);
                            let link = await this.getMesssagelink(msg);

                            let replay = `<@${msg.author.id}>
抱歉，您的发言不符合所在子频道的格式限制规则，已自动撤回
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
发送内容：
${link}
管理快捷处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                            await this.punish_notify(msg.guild_id, replay, msg.id);
                        } catch (err) { }
                        msg.content = '';
                        return;
                    }

                }

                if (await this.check_ifhitlevellimit(msg)) {
                    try {
                        await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发等级发言限制策略，消息被撤回`);
                        let link = await this.getMesssagelink(msg);

                        let replay = `<@${msg.author.id}>
抱歉，您在频道内的等级过低，发言类型被限制，请通过挂麦等方式积极活跃，待等级提升后，发言类型限制即可逐步解除
${this.longtime2s(optime * 1000)}
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
发送内容：
${link}
管理快速处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                        await this.punish_notify(msg.guild_id, replay, msg.id);
                    } catch (err) { }
                    msg.content = '';
                    return;
                }

                if (await this.check_ifhitchannellimit(msg)) {
                    try {
                        await client.messageApi.deleteMessage(msg.channel_id, msg.id, true);
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', `触发发言类型限制策略，消息被撤回`);
                        let link = await this.getMesssagelink(msg);

                        let replay = `<@${msg.author.id}>
抱歉，您所在子频道不允许发送此类型的消息，请前往其他子频道发送
${this.longtime2s(optime * 1000)}
发生时间：${this.timestamp2times(Date.now())}
来自：<#${msg.channel_id}>
发送内容：
${link}
管理处罚入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                        await this.punish_notify(msg.guild_id, replay, msg.id);
                    } catch (err) { }
                    msg.content = '';
                    return;
                }

            }
        }
    }

    async handle_FORUM_POST_CREATE(msg) {

        if (await this.check_isexpir(msg.guild_id)) return;

        let uinfo;
        try {
            let { data } = await client.guildApi.guildMember(msg.guild_id, msg.author_id);
            if (data && data.roles && !data.user.bot) {
                uinfo = data;
            } else {
                return;
            }
        } catch (err) {
            return;
        }
        if (!uinfo) return;

        msg.author = uinfo.user;
        msg.id = '';
        msg.member = uinfo;
        msg.content = msg.post_info.content;
        try {
            msg.content = JSON.parse(msg.content);
            msg.content = this.extractStringsFromJson(msg.content);
        } catch (err) {
            return;
        }
        if (!msg.content || msg.content.length <= 0) return;

        await this.addactiverecord(msg.guild_id, msg.author_id, '成员评论奖励设置', msg.content.length, false, false);

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (!msg.member.roles.includes('4') && !msg.member.roles.includes('2') && !msg.member.roles.includes('5') && !msg.member.roles.includes('7')) {
            let t = msg.content;
            if (!t) {
                t = '';
            }
            let ret = await this.match_forbidden_words(t, msg.guild_id, false, msg.author.username);
            if (ret[0]) {
                ret = ret[1];
                await this.RunOp(ret, msg, true);
                return;
            }
        }
        
    }

    async handle_FORUM_REPLY_CREATE(msg) {

        if (await this.check_isexpir(msg.guild_id)) return;

        let uinfo;
        try {
            let { data } = await client.guildApi.guildMember(msg.guild_id, msg.author_id);
            if (data && data.roles && !data.user.bot) {
                uinfo = data;
            } else {
                return;
            }
        } catch (err) {
            return;
        }
        if (!uinfo) return;

        msg.author = uinfo.user;
        msg.id = '';
        msg.member = uinfo;
        msg.content = msg.reply_info.content;
        try {
            msg.content = JSON.parse(msg.content);
            msg.content = this.extractStringsFromJson(msg.content);
        } catch (err) {
            return;
        }
        if (!msg.content || msg.content.length <= 0) return;

        await this.addactiverecord(msg.guild_id, msg.author_id, '成员评论奖励设置', msg.content.length, false, false);

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (!msg.member.roles.includes('4') && !msg.member.roles.includes('2') && !msg.member.roles.includes('5') && !msg.member.roles.includes('7')) {
            let t = msg.content;
            if (!t) {
                t = '';
            }
            let ret = await this.match_forbidden_words(t, msg.guild_id, false, msg.author.username);
            if (ret[0]) {
                ret = ret[1];
                await this.RunOp(ret, msg, true);
                return;
            }
        }

    }


}