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

    async checkifhitrole(uroles, needroles) {
        for (let s of needroles) {
            if (uroles.includes(s)) return true;
        }
        return false;
    }

    async WriteAttachMessage(channel, messageid) {

        try {
            let { data } = await client.messageApi.message(channel, messageid);
            let msg = data.message;

            if (!msg) return false;

            if (msg.content == '') msg.content = '<不支持的消息>';

            let sret = await client.guildApi.guildMember(msg.guild_id, msg.author.id);
            if (!sret.data) return false;

            if (!msg.author.avatar) msg.author.avatar = sret.data.user.avatar;
            msg.member.roles = sret.data.roles;

            msg.member.nick = msg.author.username;

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
            let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: msg.author, member: msg.member, imgs: imgs, text: oc, reason: '', id: msg.id, channel_id: msg.channel_id, guild_id: msg.guild_id } }));
            if (id) {
                return id;
            }

        } catch (err) { }

        return false;
    }

    async WriteMessage(msg) {

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
        let id = await this.write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: msg.author, member: msg.member, imgs: imgs, text: oc, reason: '', id: msg.id, channel_id: msg.channel_id, guild_id: msg.guild_id } }));
        if (id) {
            return id;
        }

        return false;
    }

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (msg.mentions) {
            msg.mentions = msg.mentions.filter(i => { return !i.bot });
        }

        if (msg.content) {
            let c = msg.content;
            c = c.replace(new RegExp(`^<@(!)?${global.robotid}> *`), '').trim()
            let obj = { val: c };

            if (await this.match_c(/^\/批量撤回 *(\d+)? *(\d+)?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '批量撤回', msg.channel_id);
                if (role == '') {
                    this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    if (c && c[1]) {
                        if (c[2]) {
                            let iA = Number(c[1]);
                            let iB = Number(c[2]);
                            if (iA <= iB && iA > 0 && iB - iA + 1 <= 100) {
                                drawTask(msg, iA, iB);
                            } else {
                                await ext.SendMessage({
                                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `指令要求：
撤回起点大于0
撤回起点小于等于撤回终点
撤回数量最高100条`, message_reference: { message_id: msg.id }
                                });
                            }
                        } else {
                            let cnt = Number(c[1]);
                            if (cnt <= 0 || cnt > 100) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '请提供正确的欲撤回数量（1~100）', message_reference: { message_id: msg.id } });
                            } else {
                                drawTask(msg, msg.seq - 1 - cnt + 1, msg.seq - 1);
                            }
                        }
                    } else {
                        drawTask(msg, msg.seq - 1 - 10 + 1, msg.seq - 1);
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/撤回并警告 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '撤回并警告', msg.channel_id);
                if (role == '') {
                    this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                    if (msg.message_reference && msg.message_reference.message_id && c[1]) {

                        let uid;
                        let bot;

                        try {
                            let { data } = await client.messageApi.message(msg.channel_id, msg.message_reference.message_id);
                            uid = data.message.author.id;
                            bot = data.message.author.bot;
                        } catch (err) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '查询源消息失败', message_reference: { message_id: msg.id } });
                            return;
                        }

                        if (bot) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '您不能对机器人发出警告', message_reference: { message_id: msg.id } });
                            return;
                        }

                        let member = '';
                        try {
                            let webr = await client.guildApi.guildMember(msg.guild_id, uid);
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

                        try {
                            await client.messageApi.deleteMessage(msg.channel_id, msg.message_reference.message_id, true);
                        } catch (err) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，由于权限限制，您无法对对方发出警告', message_reference: { message_id: msg.id } });
                            return;
                        }

                        await this.s_writelog(msg.guild_id, uid, member.user.username, member.user.avatar, '0', `被管理员警告1次，警告理由：${c[1]}`);
                        let cnow = await this.user_worningcount_add(msg.guild_id, uid, 1);
                        let check = await this.check_ifhitworningsets(msg.guild_id, uid, cnow);
                        let answer;
                        if (check) {
                            let cop = check.ptype;
                            let optime = check.ptime;
                            if (cop == 0) {
                                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: uid, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                                answer = `对方触发警告处罚策略，已被移出本频道`;
                                this.user_worningcount_reset(msg.guild_id, uid);
                                this.s_writelog(msg.guild_id, uid, member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统踢出，警告理由：${c[1]}`);
                            } else if (cop == 1) {
                                await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: uid, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                                answer = `对方触发警告处罚策略，已被移出并拉黑`;
                                await this.del_guild_users_points(msg.guild_id, uid);
                                this.s_writelog(msg.guild_id, uid, member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统踢出并拉黑，警告理由：${c[1]}`);
                            } else {

                                try {
                                    await client.muteApi.muteMember(msg.guild_id, uid, { seconds: optime.toString() });
                                } catch (err) { }

                                answer = `<@!${uid}> 您因【${c[1]}】被管理员警告1次，触发禁言处罚，被禁言${optime}秒，请规范发言`;
                                if (check.reset == true) this.user_worningcount_reset(msg.guild_id, uid);
                                this.s_writelog(msg.guild_id, uid, member.user.username, member.user.avatar, '0', `管理员手动警告，对方触发警告处罚策略，被系统禁言${optime}秒，警告理由：${c[1]}`);
                            }
                        } else {
                            answer = `<@!${uid}> 您因【${c[1]}】被管理员警告1次，请规范发言，多次警告可能会被禁言或移出频道`;
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '使用方法：\r回复想要撤回的消息，并发送指令 /撤回并警告 理由', message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/撤回', obj, msg.guild_id)) {
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '撤回', msg.channel_id);
                if (role == '') {
                    this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 /撤回`);

                    if (msg.message_reference && msg.message_reference.message_id) {
                        try {
                            await client.messageApi.deleteMessage(msg.channel_id, msg.message_reference.message_id, true);
                        } catch (err) { }
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '回复想要撤回的消息，并发送指令，即可撤回目标消息', message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/礼品商店', obj, msg.guild_id)) {
                let s1 = encodeURIComponent(`pages/functions/goodslist/goodslist?guildID=${msg.guild_id}`);
                let link = `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s1}`;
                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: {
                        "template_id": 37,
                        "kv": [
                            {
                                "key": "#PROMPT#",
                                "value": "礼品商店"
                            },
                            {
                                "key": "#METATITLE#",
                                "value": "【通知】频道主已开启礼品商店，大家快进来看看吧!"
                            },
                            {
                                "key": "#METASUBTITLE#",
                                "value": ""
                            },
                            {
                                "key": "#METACOVER#",
                                "value": `https://${global.miniappconfig.host}/img/packge`
                            },
                            {
                                "key": "#METAURL#",
                                "value": link
                            }
                        ]
                    }
                });
                return;
            } else if (await this.match_c('/跨频转账', obj, msg.guild_id)) {
                let s1 = encodeURIComponent(`pages/functions/transpoints/transpoints?guildID=${msg.guild_id}`);
                let link = `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s1}`;
                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: {
                        "template_id": 37,
                        "kv": [
                            {
                                "key": "#PROMPT#",
                                "value": "跨频转账"
                            },
                            {
                                "key": "#METATITLE#",
                                "value": "【通知】本频道已开通积分跨频转账功能，快来看看吧!"
                            },
                            {
                                "key": "#METASUBTITLE#",
                                "value": ""
                            },
                            {
                                "key": "#METACOVER#",
                                "value": `https://${global.miniappconfig.host}/img/transpoint`
                            },
                            {
                                "key": "#METAURL#",
                                "value": link
                            }
                        ]
                    }
                });
                return;
            } else if (await this.match_c('/频道信息', obj, msg.guild_id)) {
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '频道信息', msg.channel_id);
                if (role == '') {
                    try {
                        let { data } = await client.guildApi.guild(msg.guild_id);
                        if (data.id) {
                            let check = data.icon.match(/cn\/(\d+)\//);
                            await ext.SendMessage({
                                guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `频道id：${data.id}
频道真实id：${check && check[1] ? check[1] : '未知'}
频道主id：${data.owner_id}
成员数量：${data.member_count.toString()}
人数上限：${data.max_members.toString()}`, message_reference: { message_id: msg.id }
                            });
                            return;
                        }
                    } catch (err) { }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '查询频道信息失败，可能没有给予小竹对应的权限，请重试', message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/反查id *(\d+)?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, '反查id', msg.channel_id);
                if (role == '') {
                    if (c[1]) {
                        try {
                            let { data } = await client.guildApi.guildMember(msg.guild_id, c[1]);
                            if (data.user.id) {
                                await ext.SendMessage({
                                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `昵称：${data.nick.replaceAll('@everyone', ' ')}
是否为机器人：${data.user.bot ? '是' : '否'}
入频时间：${data.joined_at.slice(0, data.joined_at.length - 6).replace('T', ' ')}
头像：
`, image: data.user.avatar
                                });
                                return;
                            }
                        } catch (err) { }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '反查id信息失败，请检查用户id是否正确，或用户是否已离开本频道，若id无误，可能是没有给予小竹对应的权限，请重试', message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '格式：/反查id 1651521\r数字代表用户在频道机器人场景下的id', message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/使用兑换码 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[1]) {
                    let card = c[1].trim();
                    let carddbs = await this.fetchGcardsdb(msg.guild_id);
                    if (!carddbs) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '本频道还没有任何自定义兑换码，快联系管理员创建吧', message_reference: { message_id: msg.id } });
                    } else {
                        if (carddbs[0].fixchannel && carddbs[0].fixchannel != msg.channel_id) {
                            await ext.SendMessage({
                                guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `请前往<#${carddbs[0].fixchannel}>使用此指令`, message_reference: { message_id: msg.id }
                            });
                            return;
                        } else {
                            let check = await this.useonecard(msg.guild_id, card);
                            if (check === false) {
                                await ext.SendMessage({
                                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `抱歉，该兑换码无效或已下架，无法使用`, message_reference: { message_id: msg.id }
                                });
                                return;
                            } else {
                                let info = carddbs.filter(i => {
                                    return i.id == check;
                                });
                                if (info.length <= 0) {
                                    await ext.SendMessage({
                                        guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `抱歉，该兑换码已下架，无法使用`, message_reference: { message_id: msg.id }
                                    });
                                    return;
                                } else {
                                    info = info[0];
                                    if (info.type == '0') { //身份组
                                        let secs = info.rolesecs;
                                        if (secs <= 0) {
                                            await client.memberApi.memberAddRole(msg.guild_id, info.roleid, msg.author.id);
                                            await this.deltarget_exprole(msg.guild_id, info.roleid, msg.author.id);
                                            await ext.SendMessage({
                                                guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `兑换成功，获得身份组【${info.rolename}】`, message_reference: { message_id: msg.id }
                                            });
                                            return;
                                        } else {
                                            await client.memberApi.memberAddRole(msg.guild_id, info.roleid, msg.author.id);
                                            await this.write_exprole(msg.guild_id, info.roleid, msg.author.id, secs);
                                            await ext.SendMessage({
                                                guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `兑换成功，获得身份组【${info.rolename}】 ${this.longtime2s(secs * 1000)}`, message_reference: { message_id: msg.id }
                                            });
                                            return;
                                        }
                                    } else if (info.type == '1') { //积分
                                        await this.user_points_change(msg.guild_id, msg.author.id, info.point_id, info.pointcnt, msg.author.avatar, msg.author.username);
                                        await this.addpointchangelog(msg.guild_id, msg.author.id, info.point_id, info.pointcnt, `兑换码【${card}】兑换获得`, msg.author.id, msg.author.username, msg.author.avatar);
                                        await ext.SendMessage({
                                            guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `兑换成功，获得 ${info.point_name} 【${info.pointcnt}】点`, message_reference: { message_id: msg.id }
                                        });
                                        return;
                                    } else if (info.type == '2') { //补签卡
                                        await this.adduserworkcards(msg.guild_id, msg.author.id, info.gaincnt);
                                        await ext.SendMessage({
                                            guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `兑换成功，获得${info.gaincnt}张补签卡，已自动入账`, message_reference: { message_id: msg.id }
                                        });
                                        return;
                                    } else {
                                        await ext.SendMessage({
                                            guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `该兑换码属未知类型，无法使用，系统已将其销毁`, message_reference: { message_id: msg.id }
                                        });
                                        return;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '格式：/使用兑换码 xxxx', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/查id *(<@(!)?(\d+)>)?/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[3]) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `<@!${c[3]}>的id为：${c[3]}`, message_reference: { message_id: msg.id } });
                } else {

                    let rmid = '';
                    try {
                        let { data } = await client.messageApi.message(msg.channel_id, msg.id);
                        if (data && data.message.id) rmid = data.message.id;
                    } catch (err) { }

                    let rid = ext.depackuserid(rmid);
                    if (!rid) rid = '未知';

                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的id为：${msg.author.id}\r真实id：${rid}\r查询其他人的id：\r/查id@xxx`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/查消息id/, obj, msg.guild_id)) {
                if (msg.message_reference && msg.message_reference.message_id) {
                    let seq = ext.depackmsgid(msg.message_reference.message_id);
                    if (seq > 0) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `目标消息的id为：${seq}`, message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `查询目标消息id失败`, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的消息id为：${msg.seq}\r回复想要查询的消息，并发送指令，即可查询目标消息的id`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c('/取图片hash', obj, msg.guild_id)) {
                let imgs = [];
                if (msg.message_reference && msg.message_reference.message_id) {
                    try {
                        let { data } = await client.messageApi.message(msg.channel_id, msg.message_reference.message_id);
                        let _msg = data.message;
                        imgs = this.get_imghash(_msg.attachments);
                    } catch (err) { }
                } else {
                    imgs = this.get_imghash(msg.attachments);
                }
                if (imgs.length > 0) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: imgs.join('|'), message_reference: { message_id: msg.id } });
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `用法：\r引用带图的消息，并回复 /取图片hash\r或 /取图片hash [图1][图2]...`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/举报 *([\s\S]*)?/, obj, msg.guild_id)) {
                c = obj.val;

                let csets = await this.get_EventsSets_back(msg.guild_id, '值班室设置');
                if (csets && csets[0]) {
                    csets = csets[1][0];
                    if (csets.useit == 'true') {

                        let retc = csets;
                        csets = csets?.content;
                        try {
                            csets = JSON.parse(csets);
                            csets = csets.report;
                            retc.content = JSON.parse(retc.content);
                        } catch (err) { }

                        if (csets && csets.able) {
                            if (csets.needroles && csets.needroles.length > 0) {
                                if (!await this.checkifhitrole(msg.member.roles, csets.needroles)) {
                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，您在频道内的等级过低或无相应身份组，无法使用该指令', message_reference: { message_id: msg.id } });
                                    return;
                                }
                            }

                            if (csets.fixchannel && csets.fixchannel != '' && csets.fixchannel != msg.channel_id) {
                                await ext.SendMessage({
                                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `请前往<#${csets.fixchannel}>使用此指令`, message_reference: { message_id: msg.id } });
                                return;
                            }

                            if (msg.message_reference && msg.message_reference.message_id) {
                                let mida = await this.WriteMessage(msg);
                                let midb = await this.WriteAttachMessage(msg.channel_id, msg.message_reference.message_id);
                                if (!mida || !midb) {
                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，写入举报内容失败', message_reference: { message_id: msg.id } });
                                } else {
                                    let result = await this.write_office_task(msg.guild_id, msg.author.id, '3', mida, midb);
                                    if (result) {
                                        let users = retc.content;
                                        users = this.get_today_users(users);

                                        let s2 = encodeURIComponent(`pages/functions/officetasks/officetasks?guildID=${msg.guild_id}`);
                                        let md = this.get_markdown_office(`${users}新的值班任务待处理\r任务id：${result}\r任务类型：处理举报消息\r来源子频道：<#${msg.channel_id}>\r`,
                                            [
                                                { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}` },
                                                { before: '\r被举报消息：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${midb}` },
                                                { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                            ],
                                            '请使用第一行按钮进行处罚操作，若被举报的消息无违规，请点击[📛无法确认]或[🔒关闭任务]，更多自定义操作请进入小程序'
                                        );
                                        let sendresult = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: retc.tochannel, markdown: md, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });
                                        if (sendresult && sendresult.id) {
                                            await this.HistoryMessage_addid(midb, sendresult.id);
                                        }

                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '提交举报成功，已通知值班人员处理', message_reference: { message_id: msg.id } });
                                    } else {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，推送举报内容失败', message_reference: { message_id: msg.id } });
                                    }
                                }
                            } else if (c[1] || (!c[1] && msg.attachments && msg.attachments.length > 0)) {
                                let mida = await this.WriteMessage(msg);
                                if (!mida) {
                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，写入举报内容失败', message_reference: { message_id: msg.id } });
                                } else {
                                    let result = await this.write_office_task(msg.guild_id, msg.author.id, '1', mida, 0);
                                    if (result) {
                                        let users = retc.content;
                                        users = this.get_today_users(users);
                                        let md = this.get_markdown_office(`${users}新的值班任务待处理\r任务id：${result}\r任务类型：处理举报内容\r来源子频道：<#${msg.channel_id}>\r`,
                                            [
                                                { before: '举报内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}` }
                                            ],
                                            '请人工处理，若确认举报有效，请点击[✅有效]，若举报无效，请点击[❎无效]'
                                        );
                                        let sendresult = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: retc.tochannel, markdown: md, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });
                                        if (sendresult && sendresult.id) {
                                            await this.HistoryMessage_addid(mida, sendresult.id);
                                        }

                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '提交举报成功，已通知值班人员处理', message_reference: { message_id: msg.id } });
                                    } else {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，提交举报内容失败', message_reference: { message_id: msg.id } });
                                    }
                                }
                            } else {
                                let sext = '';
                                if (csets.enp.able && csets.enp.name && csets.enp.number > 0) {
                                    sext = `\r核实奖励：${csets.enp.name} 【${csets.enp.number}】点`;
                                }
                                await ext.SendMessage({
                                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `用法：
/举报 xxx理由(可附带截图)
若想举报某条消息，请长按消息后选择回复"/举报"${sext}`, message_reference: { message_id: msg.id }
                                });
                            }
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启此指令，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                        }
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启此指令，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启此指令，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/测试md *([\s\S]*)?/, obj, msg.guild_id)) {
                c = obj.val;
                let m = JSON.parse(c[1].replaceAll('&gt;', '>').replaceAll('&lt;', '<'));
                let ret = await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, event_id: await this.GetMid(msg.guild_id, true), markdown: m });
                console.log(ret);
                return;
            } else if (await this.match_c('/打卡排行', obj, msg.guild_id)) {
                let sets = await this.getcoworksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启打卡相关功能，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        if (sets.fixtime.on) {
                            if (!this.isTimeInRange(sets.fixtime.start, sets.fixtime.end)) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本指令的使用时间段为${sets.fixtime.start} - ${sets.fixtime.end}`, message_reference: { message_id: msg.id } });
                                return;
                            }
                        }
                        let list = await this.fetchuser_cotwork_orderbytime(msg.guild_id);
                        if (!list || list.length <= 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `暂时还没有人上榜，改天再来看看吧`, message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            let m = {
                                "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                                "params": []
                            };
                            for (let i = 0; i < 10; i++) {
                                let value = '';
                                if (i < list.length) {
                                    if (i == list.length - 1 && i == 9) {
                                        value = `图片Holder #20px#20px](${list[i].userhead}) ${list[i].usernick} 连续打卡${list[i].cot_workdays}天${i < list.length - 1 ? '\r' : ''}\r[🔗>>查看详细榜单](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/onworklist/onworklist?guildID=${msg.guild_id}`;
                                    } else {
                                        value = `图片Holder #20px#20px](${list[i].userhead}) ${list[i].usernick} 连续打卡${list[i].cot_workdays}天${i < list.length - 1 ? '\r' : ''}![img #-1px #1px](https://m.q.qq.com/a/p/`;
                                    }
                                } else {
                                    value = 'img #-1px #1px](https://m.q.qq.com/a/p/';
                                }

                                if (i + 1 == 10) {
                                    m.params.push({ key: `c0`, values: [`${value}`] });
                                } else {
                                    m.params.push({ key: `c${i + 1}`, values: [`${value}`] });
                                }
                            }
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, markdown: m });
                        }
                    }
                }
                return;
            } else if (await this.match_c('/赞助排行', obj, msg.guild_id)) {
                let list = await this.fetchuser_willingpay_orderbytotal(msg.guild_id);
                if (!list || list.length <= 0) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `暂时还没有人上榜，改天再来看看吧`, message_reference: { message_id: msg.id } });
                    return;
                } else {
                    let m = {
                        "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                        "params": []
                    };
                    for (let i = 0; i < 10; i++) {
                        let value = '';
                        if (i < list.length) {
                            if (i == list.length - 1 && i == 9) {
                                value = `图片Holder #20px#20px](${list[i].head}) ${list[i].nick} 累计赞助${list[i].totalamount}￥${i < list.length - 1 ? '\r' : ''}\r[🔗>>查看详细榜单](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/ubankpaylist/ubankpaylist?guildID=${msg.guild_id}`;
                            } else {
                                value = `图片Holder #20px#20px](${list[i].head}) ${list[i].nick} 累计赞助${list[i].totalamount}￥${i < list.length - 1 ? '\r' : ''}![img #-1px #1px](https://m.q.qq.com/a/p/`;
                            }
                        } else {
                            value = 'img #-1px #1px](https://m.q.qq.com/a/p/';
                        }

                        if (i + 1 == 10) {
                            m.params.push({ key: `c0`, values: [`${value}`] });
                        } else {
                            m.params.push({ key: `c${i + 1}`, values: [`${value}`] });
                        }
                    }
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, markdown: m, event_id: await this.fetch_eventid(msg.guild_id) });
                }
                return;
            } else if (await this.match_c('/资产排行', obj, msg.guild_id)) {
                let sets = await this.getcoworksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启打卡相关功能，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        if (sets.fixtime.on) {
                            if (!this.isTimeInRange(sets.fixtime.start, sets.fixtime.end)) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本指令的使用时间段为${sets.fixtime.start} - ${sets.fixtime.end}`, message_reference: { message_id: msg.id } });
                                return;
                            }
                        }
                        let m = {
                            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
                            "params": []
                        };
                        for (let i = 0; i < 10; i++) {
                            let value = '';
                            if (i ==0) {
                                value = `img #-1px #1px](https://m.q.qq.com/a/p/) 本频道采用了多积分体系，无法列出所有资产排行，请进入小程序查看\r[🔗点击查看资产排行](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/upointslist/upointslist?guildID=${msg.guild_id}`;
                            } else {
                                value = 'img #-1px #1px](https://m.q.qq.com/a/p/';
                            }

                            if (i + 1 == 10) {
                                m.params.push({ key: `c0`, values: [`${value}`] });
                            } else {
                                m.params.push({ key: `c${i + 1}`, values: [`${value}`] });
                            }
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, markdown: m });
                    }
                }
                return;
            } else if (await this.match_c('/开始值班', obj, msg.guild_id)) {
                let sets = await this.getofficetasksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道暂未开启值班室，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        let users = sets;
                        users = [...users.u1, ...users.u2, ...users.u3, ...users.u4, ...users.u5, ...users.u6, ...users.u7];
                        users = users.map(i => { return i.id });
                        if (users.includes(msg.author.id) || msg.member.roles.includes('4')) {
                            if (!sets.mentionusers) sets.mentionusers = [];
                            if (sets.mentionusers.includes(msg.author.id)) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您已开始值班，无需重复开启`, message_reference: { message_id: msg.id } });
                            } else {
                                sets.mentionusers = [...sets.mentionusers, msg.author.id];
                                let saveret = await this.officetaskssetsref(msg.guild_id, sets);
                                if (saveret) {
                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `开始值班成功`, message_reference: { message_id: msg.id } });
                                } else {
                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `系统错误，数据保存失败`, message_reference: { message_id: msg.id } });
                                }
                            }
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您没有值班权限，请联系频道主或管理员给予值班权限`, message_reference: { message_id: msg.id } });
                        }
                    }
                }
                return;
            } else if (await this.match_c('/结束值班', obj, msg.guild_id)) {
                let sets = await this.getofficetasksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道暂未开启值班室，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        if (!sets.mentionusers) sets.mentionusers = [];
                        if (!sets.mentionusers.includes(msg.author.id)) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您还未开始值班`, message_reference: { message_id: msg.id } });
                        } else {
                            sets.mentionusers = sets.mentionusers.filter(i => { return i != msg.author.id });
                            let saveret = await this.officetaskssetsref(msg.guild_id, sets);
                            if (saveret) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `结束值班成功`, message_reference: { message_id: msg.id } });
                            } else {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `系统错误，数据保存失败`, message_reference: { message_id: msg.id } });
                            }
                        }
                    }
                }
                return;
            } else if (await this.match_c('/打卡', obj, msg.guild_id)) {
                let sets = await this.getcoworksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启打卡相关功能，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        if (sets.fixtime.on) {
                            if (!this.isTimeInRange(sets.fixtime.start, sets.fixtime.end)) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本指令的使用时间段为${sets.fixtime.start} - ${sets.fixtime.end}`, message_reference: { message_id: msg.id } });
                                return;
                            }
                        }
                        let check = await this.adduserworkdays(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.map(i => { return `|${i}|` }).join(''));
                        if (!check) { //今日已打卡
                            let workindex = await this.readuserTodayCoworkIndex(msg.guild_id, msg.author.id);
                            let workdays = await this.readuserWorkDays(msg.guild_id, msg.author.id);
                            if (!workdays) return;
                            let content = sets.failed.content;
                            let image = `${sets.failed.image}?t=1`;
                            let before = ' ';
                            content = content.replaceAll('\r\n', '\r');
                            content = content.replaceAll('\n', '\r');
                            let index = content.indexOf('{头像}');
                            if (index == -1) {

                            } else {
                                before = content.slice(0, index);
                                content = content.slice(index + 4);
                            }
                            if (!before) before = ' ';
                            content = content.replaceAll('{头像}', '');
                            content = content.replaceAll('{艾特}', `<@!${msg.author.id}>`);
                            content = content.replaceAll('{每日奖励}', '0');
                            content = content.replaceAll('{连续奖励}', '0');
                            content = content.replaceAll('{累计奖励}', '0');
                            content = content.replaceAll('{漏签天数}', `${workdays.points}`);
                            content = content.replaceAll('{连续}', `${workdays.cot_workdays}`);
                            content = content.replaceAll('{累计}', `${workdays.workdays}`);
                            content = content.replaceAll('{排名}', `${workindex}`);

                            content = this.rp_linkasn(content);
                            let info = await this.getimageinfo(image);
                            if (!info) return;
                            
                            let m = this.get_markdown_t1(info.width, info.height, image, before, this.getheadlink(msg.author.avatar), content);
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateA}` } });
                        } else {
                            let workindex = await this.readuserTodayCoworkIndex(msg.guild_id, msg.author.id);
                            let workdays = await this.readuserWorkDays(msg.guild_id, msg.author.id);
                            if (!workdays) return;
                            let content = sets.success.content;
                            let image = `${sets.success.image}?t=1`;
                            let before = ' ';
                            content = content.replaceAll('\r\n', '\r');
                            content = content.replaceAll('\n', '\r');
                            let index = content.indexOf('{头像}');
                            if (index == -1) {

                            } else {
                                before = content.slice(0, index);
                                content = content.slice(index + 4);
                            }
                            if (!before) before = ' ';
                            //计算奖励
                            let pa = 0;
                            let pb = 0;
                            let pd = 0;
                            if (sets.gpa.on) {
                                let r = sets.gpa.rules;
                                r = r.filter(i => {
                                    return workindex >= i.a && workindex <= i.b;
                                });
                                if (r.length > 0) {
                                    pa = this.getRandomInteger(r[0].c, r[0].d);
                                    if (pa > 0) {
                                        await this.user_points_change(msg.guild_id, msg.author.id, sets.gpa.point_id, 1 * pa, msg.author.avatar, msg.author.username);
                                        await this.addpointchangelog(msg.guild_id, msg.author.id, sets.gpa.point_id, 1 * pa, `每日打卡奖励`, msg.author.id, msg.author.username, msg.author.avatar);
                                    }
                                }
                            }
                            if (sets.gpb.on) {
                                let r = sets.gpb.rules;
                                r = r.filter(i => {
                                    return workdays.cot_workdays >= i.a && workdays.cot_workdays <= i.b;
                                });
                                if (r.length > 0) {
                                    pb = this.getRandomInteger(r[0].c, r[0].d);
                                    if (pb > 0) {
                                        await this.user_points_change(msg.guild_id, msg.author.id, sets.gpb.point_id, 1 * pb, msg.author.avatar, msg.author.username);
                                        await this.addpointchangelog(msg.guild_id, msg.author.id, sets.gpb.point_id, 1 * pb, `连续打卡奖励`, msg.author.id, msg.author.username, msg.author.avatar);
                                    }
                                }
                            }
                            if (sets?.gpd?.on) {
                                let r = sets.gpd.rules;
                                r = r.filter(i => {
                                    return workdays.workdays >= i.a && workdays.workdays <= i.b;
                                });
                                if (r.length > 0) {
                                    pd = this.getRandomInteger(r[0].c, r[0].d);
                                    if (pd > 0) {
                                        await this.user_points_change(msg.guild_id, msg.author.id, sets.gpd.point_id, 1 * pd, msg.author.avatar, msg.author.username);
                                        await this.addpointchangelog(msg.guild_id, msg.author.id, sets.gpd.point_id, 1 * pd, `累计打卡奖励`, msg.author.id, msg.author.username, msg.author.avatar);
                                    }
                                }
                            }
                            content = content.replaceAll('{头像}', '');
                            content = content.replaceAll('{艾特}', `<@!${msg.author.id}>`);
                            content = content.replaceAll('{每日奖励}', `${pa}`);
                            content = content.replaceAll('{连续奖励}', `${pb}`);
                            content = content.replaceAll('{累计奖励}', `${pd}`);
                            content = content.replaceAll('{漏签天数}', `${workdays.points}`);
                            content = content.replaceAll('{连续}', `${workdays.cot_workdays}`);
                            content = content.replaceAll('{累计}', `${workdays.workdays}`);
                            content = content.replaceAll('{排名}', `${workindex}`);

                            content = this.rp_linkasn(content);
                            let info = await this.getimageinfo(image);
                            if (!info) return;
                            let m = this.get_markdown_t1(info.width, info.height, image, before, this.getheadlink(msg.author.avatar), content);
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateA}` } });
                        }
                    }
                }
                return;
            } else if (await this.match_c('/我的钱包', obj, msg.guild_id)) {
                let sets = await this.getcoworksets(msg.guild_id);
                if (!sets) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '抱歉，本频道未开启打卡相关功能，请联系频道主或管理员开启', message_reference: { message_id: msg.id } });
                } else {
                    if (sets.tochannel && sets.tochannel != msg.channel_id) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `当前子频道不支持此指令，请前往<#${sets.tochannel}>使用`, message_reference: { message_id: msg.id } });
                    } else {
                        sets = sets.content;
                        if (sets.fixtime.on) {
                            if (!this.isTimeInRange(sets.fixtime.start, sets.fixtime.end)) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本指令的使用时间段为${sets.fixtime.start} - ${sets.fixtime.end}`, message_reference: { message_id: msg.id } });
                                return;
                            }
                        }
                        let list = await this.fetchmypoints(msg.guild_id, msg.author.id);
                        if (!list || list.length <= 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您还没有任何资产`, message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            list = list.map(i => {
                                return `${i.name} ${i.points}点`;
                            }).join('\r');
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您目前有资产：\r${list}`, message_reference: { message_id: msg.id } });
                            return;
                        }
                    }
                }
                return;
            } else if (await this.match_c('/赞助频道', obj, msg.guild_id)) {
                let s1 = encodeURIComponent(`pages/functions/payforguild/payforguild?guildID=${msg.guild_id}`);
                let link = `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s1}`;
                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: {
                        "template_id": 23,
                        "kv": [
                            {
                                "key": "#DESC#",
                                "value": "赞助频道"
                            },
                            {
                                "key": "#PROMPT#",
                                "value": "赞助频道"
                            },
                            {
                                "key": "#LIST#",
                                "obj": [
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "您的每一份赞助都将被铭记于心"
                                            }
                                        ]
                                    },
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "赞助入口"
                                            },
                                            {
                                                "key": "link",
                                                "value": link
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
                return;
            } else if (await this.match_c('/积分银行', obj, msg.guild_id)) {
                let s1 = encodeURIComponent(`pages/functions/pointsbank/pointsbank?guildID=${msg.guild_id}`);
                let link = `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s1}`;
                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: {
                        "template_id": 23,
                        "kv": [
                            {
                                "key": "#DESC#",
                                "value": "积分银行"
                            },
                            {
                                "key": "#PROMPT#",
                                "value": "积分银行"
                            },
                            {
                                "key": "#LIST#",
                                "obj": [
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "将积分存入银行，每日均可产生收益"
                                            }
                                        ]
                                    },
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "积分银行入口"
                                            },
                                            {
                                                "key": "link",
                                                "value": link
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
                return;
            } else if (await this.match_c('/积分转换', obj, msg.guild_id)) {
                let s1 = encodeURIComponent(`pages/functions/mypoints/mypoints?guildID=${msg.guild_id}`);
                let link = `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s1}`;
                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: {
                        "template_id": 23,
                        "kv": [
                            {
                                "key": "#DESC#",
                                "value": "积分转换"
                            },
                            {
                                "key": "#PROMPT#",
                                "value": "积分转换"
                            },
                            {
                                "key": "#LIST#",
                                "obj": [
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "本频道已支持各积分间相互转换，快进来看看吧"
                                            }
                                        ]
                                    },
                                    {
                                        "obj_kv": [
                                            {
                                                "key": "desc",
                                                "value": "积分转换入口"
                                            },
                                            {
                                                "key": "link",
                                                "value": link
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
                return;
            } else if (await this.match_c(/^\/(加|减|置)积分( *(.*?) *(\d+) *(.*))?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `${c[1]}积分`, msg.channel_id);
                if (role == '') {
                    if (c[2] && c[3] && c[4] && msg.mentions?.length > 0) {
                        if (c[5]) c[5] = c[5].trim();
                        let amount = Number(c[4]);
                        if (isNaN(amount) || amount < 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `积分数量不得小于0`, message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            amount = Number(amount.toFixed(0));
                        }
                        if (c[1] != '置' && amount == 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `积分数量必须大于0`, message_reference: { message_id: msg.id } });
                            return;
                        }
                        if (c[1] == '减') amount = -1 * amount;

                        let list = await this._getGpoints(msg.guild_id);
                        if (!list) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本频道还无任何自定义积分，请先创建积分`, message_reference: { message_id: msg.id } });
                            return;
                        }
                        list = list.filter(i => { return i.point_name == c[3] });
                        if (list.length <= 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本频道无此名称的积分`, message_reference: { message_id: msg.id } });
                            return;
                        }
                        let point_id = list[0].point_id;

                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        let users = [];
                        users = msg.mentions.map(i => {
                            if (c[5]) c[5] = c[5].replaceAll(`<@!${i.id}>`, '').trim();
                            return i;
                        });

                        let ret = await this.users_points_change(msg.guild_id, users, point_id, amount, c[5], msg.author.id, msg.author.username, msg.author.avatar, c[1] == '置');
                        if (ret) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '操作成功', message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，操作失败', message_reference: { message_id: msg.id } });
                            return;
                        }
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/${c[1]}积分 积分名 10 理由@xxx @xxx\r理由可省略，可艾特操作多人`, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/(使用)?补签(卡)?( *(\d+)天)?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `${c[1] || ''}补签${c[2] || ''}`, msg.channel_id);
                if (role == '') {
                    let cnt = 1;
                    let bycard = false;
                    if (c[4] && !isNaN(c[4]) && Number(c[4]) > 0) cnt = Number(c[4]);
                    if (c[2] == '卡') bycard = true;

                    let ret = await this.usercoworkdaysrepair(msg.guild_id, msg.author.id, cnt, bycard, msg.author.avatar, msg.author.username);
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: ret, message_reference: { message_id: msg.id } });
                    return;
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/断签恢复.*/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `断签恢复`, msg.channel_id);
                if (role == '') {
                    if (msg.mentions?.length > 0) {

                        let users = [];
                        users = msg.mentions.map(i => {
                            return i.id;
                        });

                        let ret = await this.userscoworkdaysrestore(msg.guild_id, users);
                        if (ret) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '操作成功', message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '系统错误，操作失败', message_reference: { message_id: msg.id } });
                            return;
                        }
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/断签恢复 @xxx @xxx\r可艾特操作多人`, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/转账( *(.*?) *(\d+) *(.*))?/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `转账`, msg.channel_id);
                if (role == '') {
                    if (c[1] && c[2] && c[3] && msg.mentions?.length > 0) {
                        if (c[4]) c[4] = c[4].trim();
                        let amount = Number(c[3]);
                        if (isNaN(amount) || amount < 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `积分数量不得小于0`, message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            amount = Number(amount.toFixed(0));
                        }

                        let list = await this._getGpoints(msg.guild_id);
                        if (!list) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本频道还无任何自定义积分，请先创建积分`, message_reference: { message_id: msg.id } });
                            return;
                        }
                        list = list.filter(i => { return i.point_name == c[2] });
                        if (list.length <= 0) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `本频道无此名称的积分`, message_reference: { message_id: msg.id } });
                            return;
                        }

                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 ${c[0]}`);

                        msg.mentions.map(i => {
                            if (c[4]) c[4] = c[4].replaceAll(`<@!${i.id}>`, '').trim();
                            return i;
                        });

                        let ret = await this.transport_upoint_upoint(msg.guild_id, list[0], msg.author, msg.mentions[0], amount, c[4]);
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: ret, message_reference: { message_id: msg.id } });
                        return;
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：/转账 积分名 10 理由@xxx\r理由可省略，一次仅可向一人转账`, message_reference: { message_id: msg.id } });
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/天气 *(.*)/, obj, msg.guild_id)) {
                let role = await this.check_cpermission_tools(msg.guild_id, '天气', msg.channel_id);
                if (role.code == 0) {
                    c = obj.val;
                    if (c[1] && c[1].trim() != '') {
                        let cdcheck = await redis.get(`ZuCacheCo:qtzl:${msg.guild_id}:cd`);
                        if (cdcheck) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '该指令 10s 内只能使用一次', message_reference: { message_id: msg.id } });
                            return;
                        }
                        let city = '天气 ' + c[1].trim();
                        if (role.points) {
                            let deret = await this.user_points_change(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, msg.author.avatar, msg.author.username);
                            if (deret === false) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的资产不足，无法使用本功能`, message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await this.addpointchangelog(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, '/天气 功能消耗', msg.author.id, msg.author.username, msg.author.avatar);
                            }
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `查询中，请耐心等待...`, message_reference: { message_id: msg.id } });
                        let url = `https://www.baidu.com/s?ie=utf-8&wd=${encodeURIComponent(city)}`;
                        let img = await webview.screenshot({ pageurl: url, nocache: true, needblock: '._content-border_17ta2_4', removes: ['.more_3kyUW', '.s_form', '.more_3uhsr', '._icon_avy0e_31', '.weather-days-top_1a2IJ', '.pc-tabs_5ruLD'] });
                        if (img) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, image: img });
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `查询失败，请检查城市名是否正确`, message_reference: { message_id: msg.id } });
                        }
                        await redis.set(`ZuCacheCo:qtzl:${msg.guild_id}:cd`, 'on', 10);
                        return;
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `示范：/天气 北京`, message_reference: { message_id: msg.id } });
                        return;
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role.msg, message_reference: { message_id: msg.id } });
                    return;
                }
                return;
            } else if (await this.match_c('/青年大学习', obj, msg.guild_id)) {
                let role = await this.check_cpermission_tools(msg.guild_id, '青年大学习', msg.channel_id);
                if (role.code == 0) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '由于政策问题，该功能已禁用', message_reference: { message_id: msg.id } });
                    return;
                    if (role.points) {
                        let deret = await this.user_points_change(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, msg.author.avatar, msg.author.username);
                        if (deret === false) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的资产不足，无法使用本功能`, message_reference: { message_id: msg.id } });
                            return;
                        } else {
                            await this.addpointchangelog(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, '/青年大学习 功能消耗', msg.author.id, msg.author.username, msg.author.avatar);
                        }
                    }
                    let result = await ext.GetQcAnswer();
                    if (!result) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '查询出错', message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `${result.title}\r${result.msg}`, image: result.cover });
                    }
                    return;
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role.msg, message_reference: { message_id: msg.id } });
                    return;
                }
                return;
            } else if (await this.match_c(/^\/(QQ|网易云)音乐 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_tools(msg.guild_id, `${c[1]}音乐`, msg.channel_id);
                if (role.code == 0) {
                    if (c[2] && c[2].trim() != '') {
                        let cdcheck = await redis.get(`ZuCacheCo:music${c[1]}:${msg.guild_id}`);
                        if (cdcheck) {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '该指令 5s 内只能使用一次', message_reference: { message_id: msg.id } });
                            return;
                        }
                        if (role.points) {
                            let deret = await this.user_points_change(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, msg.author.avatar, msg.author.username);
                            if (deret === false) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的资产不足，无法使用本功能`, message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await this.addpointchangelog(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, `/${c[1]}音乐 功能消耗`, msg.author.id, msg.author.username, msg.author.avatar);
                            }
                        }
                        let ret;
                        if (c[1] == 'QQ') ret = await ext.searchmusic_QQ(c[2].trim());
                        if (c[1] == '网易云') ret = await ext.searchmusic_163(c[2].trim());
                        if (ret) {
                            let ark = {
                                "template_id": 24,
                                "kv": [
                                    {
                                        "key": "#DESC#",
                                        "value": `${c[1]}音乐点歌`
                                    },
                                    {
                                        "key": "#PROMPT#",
                                        "value": `${c[1]}音乐点歌`
                                    },
                                    {
                                        "key": "#TITLE#",
                                        "value": ret.title
                                    },
                                    {
                                        "key": "#METADESC#",
                                        "value": ret.singer
                                    },
                                    {
                                        "key": "#IMG#",
                                        "value": ret.cover
                                    },
                                    {
                                        "key": "#LINK#",
                                        "value": ret.url
                                    },
                                    {
                                        "key": "#SUBTITLE#",
                                        "value": `${c[1]}音乐`
                                    }
                                ]
                            };
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, ark: ark });
                            await redis.set(`ZuCacheCo:music${c[1]}:${msg.guild_id}`, 'on', 5);
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `未搜索到相关结果`, message_reference: { message_id: msg.id } });
                        }
                        return;
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `示范：/${c[1]}音乐 周杰伦`, message_reference: { message_id: msg.id } });
                        return;
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role.msg, message_reference: { message_id: msg.id } });
                    return;
                }
                return;
            } else if (await this.match_c(/^\/今日油价 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let role = await this.check_cpermission_tools(msg.guild_id, `今日油价`, msg.channel_id);
                if (role.code == 0) {
                    if (c[1] && c[1].trim() != '') {
                        if (role.points) {
                            let deret = await this.user_points_change(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, msg.author.avatar, msg.author.username);
                            if (deret === false) {
                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `您的资产不足，无法使用本功能`, message_reference: { message_id: msg.id } });
                                return;
                            } else {
                                await this.addpointchangelog(msg.guild_id, msg.author.id, role.points.point_id, -1 * role.points.point_cnt, `/今日油价 功能消耗`, msg.author.id, msg.author.username, msg.author.avatar);
                            }
                        }
                        let ret = await ext.OilPriceGet(c[1].trim());

                        if (ret) {
                            await ext.SendMessage({
                                guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `更新日期：${ret.DIM_DATE}
单位：元/升

${ret.CITYNAME}油价：
柴油：${ret.V0.toString().replace('.', ' .')}
95号汽油：${ret.V95.toString().replace('.', ' .')}
92号汽油：${ret.V92.toString().replace('.', ' .')}
89号汽油：${ret.V89.toString().replace('.', ' .')}

变动幅度：
柴油：${ret.ZDE0.toString().replace('.', ' .')}
95号汽油：${ret.ZDE95.toString().replace('.', ' .')}
92号汽油：${ret.ZDE92.toString().replace('.', ' .')}
89号汽油：${ret.ZDE89.toString().replace('.', ' .')}` });
                        } else {
                            await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `未搜索到相关结果，请检查省份名是否正确`, message_reference: { message_id: msg.id } });
                        }
                        return;
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `示范：/今日油价 北京`, message_reference: { message_id: msg.id } });
                        return;
                    }
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role.msg, message_reference: { message_id: msg.id } });
                    return;
                }
                return;
            } else if (await this.match_c(/^\/我的活跃数据 *(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                let ret = [0, 0,
                    0, 0,
                    0, 0,
                    0, 0,
                    0, 0];
                ret = await redis.mget([`ZuActiveDataRc:成员主题奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveContiDataRc:成员主题奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveDataRc:成员评论奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveContiDataRc:成员评论奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveDataRc:成员发言奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveContiDataRc:成员发言奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveDataRc:语音房互动奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveContiDataRc:语音房互动奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveDataRc:直播间互动奖励设置:${msg.guild_id}:${msg.author.id}`,
                    `ZuActiveContiDataRc:直播间互动奖励设置:${msg.guild_id}:${msg.author.id}`]);

                await ext.SendMessage({
                    guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `* 仅当管理启用了相关的活跃奖励设置时，才会进行数据统计，否则默认全部数据为0

今日发布主题 ${ret[0] || 0 }篇
连续发布主题 ${ret[1] || 0 }天

今日发表评论 ${ret[2] || 0 }条
连续发表评论 ${ret[3] || 0 }天

今日发言 ${ret[4] || 0 }条
连续发言 ${ret[5] || 0 }天

今日语音房互动 ${this.secs2hm(ret[6] || 0)}
连续互动 ${ret[7] || 0 }天

今日直播间互动 ${this.secs2hm(ret[8] || 0)}
连续互动 ${ret[9] || 0 }天`
                });
                return;
            }
        }
    }

    async handle_INTERACTION_CREATE(msg) {
        let msgid = msg.data.resolved.message_id;
        let button_id = msg.data.resolved.button_id;

        let ret = await this.get_EventsSets_back(msg.guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) {
                await this.senddms(msg.guild_id, msg.data.resolved.user_id, '本频道还未开启值班室，请联系管理员开启', msg.eventId);
                try {
                    await client.interactionApi.putInteraction(msg.id, {
                        code: 1
                    })
                } catch (err) { }
                return;
            }
            let users = ret.content;
            users = [...users.u1, ...users.u2, ...users.u3, ...users.u4, ...users.u5, ...users.u6, ...users.u7];
            users = users.map(i => { return i.id });
            let uinfo;
            try {
                let sb = await client.guildApi.guildMember(msg.guild_id, msg.data.resolved.user_id);
                uinfo = sb.data;
            } catch (err) {
                try {
                    await client.interactionApi.putInteraction(msg.id, {
                        code: 1
                    })
                } catch (err) { }
                return;
            }

            if (users.includes(uinfo.user.id) || uinfo.roles.includes('4')) {
                try {
                    let { data } = await client.messageApi.message(msg.channel_id, msgid);
                    let c = data.message.content;
                    let c1 = c.match(/该值班任务已被处理\r任务id：(\d*)/);
                    let c2 = c.match(/新的值班任务待处理\r任务id：(\d*)/);
                    if (c1 && c1[1]) { //重置任务
                        await this.del_officetask(msg.guild_id, Number(c1[1]), '0', uinfo.nick, ret.tochannel, uinfo.user.avatar, uinfo.user.id, ret.content);
                        try {
                            await client.interactionApi.putInteraction(msg.id, {
                                code: 0
                            })
                        } catch (err) { }
                        return;
                    } else if (c2 && c2[1]) { //处理任务
                        if (button_id == '11') { //关闭任务
                            await this.del_officetask(msg.guild_id, Number(c2[1]), '1', uinfo.nick, ret.tochannel, uinfo.user.avatar, uinfo.user.id, ret.content);
                            try {
                                await client.interactionApi.putInteraction(msg.id, {
                                    code: 0
                                })
                            } catch (err) { }
                            return;
                        } else {
                            let dealret = await this.deal_officetasks(msg.guild_id, ret.content, Number(c2[1]), button_id, uinfo.nick, uinfo.user.avatar, uinfo.user.id, ret.tochannel);
                            if (dealret) {
                                try {
                                    await client.interactionApi.putInteraction(msg.id, {
                                        code: 0
                                    })
                                } catch (err) { }
                            } else {
                                await this.senddms(msg.guild_id, msg.data.resolved.user_id, `值班任务[${Number(c2[1])}]不支持此按钮的操作或任务已过期`, msg.eventId);
                                try {
                                    await client.interactionApi.putInteraction(msg.id, {
                                        code: 1
                                    })
                                } catch (err) { }
                            }
                            return;
                        }
                    } else {
                        try {
                            await client.interactionApi.putInteraction(msg.id, {
                                code: 1
                            })
                        } catch (err) { }
                        return;
                    }
                } catch (err) {
                    try {
                        await client.interactionApi.putInteraction(msg.id, {
                            code: 1
                        })
                    } catch (err) { }
                    return;
                }
            } else {
                await this.senddms(msg.guild_id, msg.data.resolved.user_id, '抱歉，您没有值班权限，请联系管理员给予值班权限', msg.eventId);
                try {
                    await client.interactionApi.putInteraction(msg.id, {
                        code: 4
                    })
                } catch (err) { }
                return;
            }
        } else {
            await this.senddms(msg.guild_id, msg.data.resolved.user_id, '本频道还未开启值班室，请联系管理员开启', msg.eventId);
            try {
                await client.interactionApi.putInteraction(msg.id, {
                    code: 1
                })
            } catch (err) { }
            return;
        }
        /*
        try {
            await client.interactionApi.putInteraction(msg.id, {
                code: 4 // 0成功,1操作失败,2操作频繁,3重复操作,4没有权限,5仅管理员操作
            })
        } catch (err) { }
        */
    }

    secs2hm(secs) {
        if (secs <= 0) return '0分';
        let ret = '';
        let h = Math.floor(secs / (60 * 60));
        if (h > 0) {
            ret += `${h}时`;
        }
        secs -= h * (60 * 60);
        let m = Math.floor(secs / 60);
        if (m > 0) {
            ret += `${m}分`;
        }
        if (!ret) ret = '0分';
        return ret;
    }

    async senddms(guildid, userid, content, msgid) {
        try {
            let { data } = await client.directMessageApi.createDirectMessage({
                source_guild_id: guildid,
                recipient_id: userid
            });
            await client.directMessageApi.postDirectMessage(data.guild_id, { content: content, msg_id: msgid });
        } catch (err) { }
    }

    async del_officetask(guildid, taskid, close, nick, tochannel, head, uid, content) {

        let delret = await this.delofficetask(guildid, taskid, close);

        if (delret === false) {
            return false;
        } else {
            if (delret != true && delret.mida) {
                let msg;
                if (delret.tasktype == '3') {
                    msg = await this.readHistoryMessage(delret.midb);
                } else {
                    msg = await this.readHistoryMessage(delret.mida);
                }
                if (msg) {
                    if (close == '1') {
                        let m;
                        let answer = '值班人员关闭任务';
                        if (delret.tasktype == '0') {
                            m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                [
                                    { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                ],
                                `处理人：${nick.replaceAll('@everyone', ' ')}`
                            );
                        } else if (delret.tasktype == '1') {
                            m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                [
                                    { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                ],
                                `处理人：${nick.replaceAll('@everyone', ' ')}`
                            );
                        } else if (delret.tasktype == '2') {
                            m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：解除禁言申请\r\r>${answer}\r\r`,
                                [
                                    { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                ],
                                `处理人：${nick.replaceAll('@everyone', ' ')}`
                            );
                        } else if (delret.tasktype == '3') {
                            m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报消息\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                [
                                    { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}` },
                                    { before: '\r处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.midb}?ref=${Date.now()}` }
                                ],
                                `处理人：${nick.replaceAll('@everyone', ' ')}`
                            );
                        }
                        let sendresult = await ext.SendMessage({ guild_id: guildid, channel_id: tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateC}` } });
                        if (sendresult && sendresult.id) {
                            if (delret.tasktype == '3') {
                                try {
                                    await client.messageApi.deleteMessage(tochannel, msg.tid, true);
                                } catch (err) { }
                                await this.HistoryMessage_addid(delret.midb, sendresult.id);
                                await this.HistoryMessage_adddeallog(delret.midb, head, uid, nick, '关闭任务');
                            } else {
                                try {
                                    await client.messageApi.deleteMessage(tochannel, msg.tid, true);
                                } catch (err) { }
                                await this.HistoryMessage_addid(delret.mida, sendresult.id);
                                await this.HistoryMessage_adddeallog(delret.mida, head, uid, nick, '关闭任务');
                            }
                        }
                    } else {
                        let atusers = this.get_today_users(content);
                        let m;
                        let s2 = encodeURIComponent(`pages/functions/officetasks/officetasks?guildID=${guildid}`);
                        if (delret.tasktype == '0') {
                            if (!msg.id) {
                                m = this.get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r\r>  该发言是对主题的评论，机器人无法撤回，请前往对应子频道手动撤回\r\r`,
                                    [
                                        { before: '发送内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` },
                                        { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                    ],
                                    `请使用第一行按钮进行处罚操作，若用户无违规，请点击[🔊解禁]或[🔒关闭任务]，更多自定义操作请进入小程序`
                                );
                            } else {
                                m = this.get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r`,
                                    [
                                        { before: '发送内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` },
                                        { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                    ],
                                    `请使用第一行按钮进行处罚操作，若用户无违规，请点击[🔊解禁]或[🔒关闭任务]，更多自定义操作请进入小程序`
                                );
                            }
                        } else if (delret.tasktype == '1') {
                            m = this.get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msg.channel_id}>\r`,
                                [
                                    { before: '举报内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                ],
                                `请人工处理，若确认举报有效，请点击[✅有效]，若举报无效，请点击[❎无效]`
                            );
                        } else if (delret.tasktype == '2') {
                            m = this.get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：解除禁言申请\r`,
                                [
                                    { before: '申请理由：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                ],
                                `若同意帮助用户解除禁言，请点击[✔️同意]，若不同意，请点击[❌拒绝]`
                            );
                        } else if (delret.tasktype == '3') {
                            m = this.get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理举报消息\r来源子频道：<#${msg.channel_id}>\r`,
                                [
                                    { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}` },
                                    { before: '\r被举报消息：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.midb}?ref=${Date.now()}` },
                                    { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                ],
                                `请使用第一行按钮进行处罚操作，若被举报的消息无违规，请点击[📛无法确认]或[🔒关闭任务]，更多自定义操作请进入小程序`
                            );
                        }
                        let sendresult = await ext.SendMessage({ guild_id: guildid, channel_id: tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });

                        if (sendresult && sendresult.id) {
                            if (delret.tasktype == '3') {
                                try {
                                    await client.messageApi.deleteMessage(tochannel, msg.tid, true);
                                } catch (err) { }
                                await this.HistoryMessage_addid(delret.midb, sendresult.id);
                                await this.HistoryMessage_adddeallog(delret.midb, head, uid, nick, '重新启用任务');
                            } else {
                                try {
                                    await client.messageApi.deleteMessage(tochannel, msg.tid, true);
                                } catch (err) { }
                                await this.HistoryMessage_addid(delret.mida, sendresult.id);
                                await this.HistoryMessage_adddeallog(delret.mida, head, uid, nick, '重新启用任务');
                            }
                        }
                    }
                }

            }
            return true;
        }
    }

    async deal_officetasks(guildid, content, taskid, button_id, nick, head, uid, tochannel) {

        let optype = '';
        let taskinfo = await this.readofficetaskinfo(guildid, taskid);
        if (!taskinfo) return false;
        let mida = taskinfo.mida;
        let midb = taskinfo.midb;
        let tasktype = taskinfo.tasktype;
        if (tasktype == '0') {
            if ('|1||2||3||4||9|'.includes(`|${button_id}|`)) {
                if (button_id == '1') optype = '4';
                if (button_id == '2') optype = '1';
                if (button_id == '3') optype = '3';
                if (button_id == '4') optype = '5';
                if (button_id == '9') optype = '30';
            } else {
                return false;
            }
        } else if (tasktype == '1') {
            if ('|5||6|'.includes(`|${button_id}|`)) {
                if (button_id == '5') optype = '21';
                if (button_id == '6') optype = '22';
            } else {
                return false;
            }
        } else if (tasktype == '2') {
            if ('|7||8|'.includes(`|${button_id}|`)) {
                if (button_id == '7') optype = '6';
                if (button_id == '8') optype = '7';
            } else {
                return false;
            }
        } else if (tasktype == '3') {
            if ('|1||2||3||4||10|'.includes(`|${button_id}|`)) {
                if (button_id == '1') optype = '12';
                if (button_id == '2') optype = '9';
                if (button_id == '3') optype = '11';
                if (button_id == '4') optype = '13';
                if (button_id == '10') optype = '14';
            } else {
                return false;
            }
        } else {
            return false;
        }

        let msga = await this.readHistoryMessage(mida);
        let msgb = await this.readHistoryMessage(midb);
        let answer = false;

        if (!msga || (midb && midb != '' && !msgb)) {
            return false;
        }

        if ('|0||1||2||3||4||5|'.includes(`|${optype}|`)) { //撤回A
            try {
                await client.messageApi.deleteMessage(msga.channel_id, msga.id, true);
            } catch (err) { }
        }
        if ('|3||4|'.includes(`|${optype}|`)) { //移除A
            await ext.Del_guild_member({ guild_id: msga.guild_id, author_id: msga.author.id, sandbox: false, add_blacklist: optype == '4' ? true : false, delete_history_msg_days: optype == '4' ? -1 : 0 });
        }
        if ('|1||2|'.includes(`|${optype}|`)) { //警告A
            answer = await this.worningOneUser(guildid, msga.author.id, msga.author.username, msga.author.avatar, uid, false);
        }
        if (optype == '6' || optype == '30') { //同意解禁申请
            try {
                await client.muteApi.muteMember(msga.guild_id, msga.author.id, { seconds: '0' });
            } catch (err) { }
        }
        ///////////////////////////////////////////////////////////////////
        if ('|8||9||10||11||12||13|'.includes(`|${optype}|`)) { //撤回B
            try {
                await client.messageApi.deleteMessage(msgb.channel_id, msgb.id, true);
            } catch (err) { }
        }
        if ('|11||12|'.includes(`|${optype}|`)) { //移除B
            await ext.Del_guild_member({ guild_id: msgb.guild_id, author_id: msgb.author.id, sandbox: false, add_blacklist: optype == '12' ? true : false, delete_history_msg_days: optype == '12' ? -1 : 0 });
        }
        if ('|9||10|'.includes(`|${optype}|`)) { //警告B
            answer = await this.worningOneUser(guildid, msgb.author.id, msgb.author.username, msgb.author.avatar, uid, false);
        }
        ///////////////////////////////////////////////////////////////////

        if (optype == '3') answer = `该用户发言违规，值班人员已将发送者踢出，请各位规范发言`;
        if (optype == '4') answer = `该用户发言违规，值班人员已将发送者踢出并拉黑，请各位规范发言`;
        if (optype == '5') answer = `<@!${msga.author.id}> 您的发言违规，值班人员已将消息撤回，请规范发言`;
        if (optype == '30') answer = `<@!${msga.author.id}> 您的发言已被确认无违规，值班人员已解除您的禁言`;

        if (optype == '21') answer = `<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
        if (optype == '22') answer = `<@!${msga.author.id}> 抱歉，无法确认您提交的举报内容有效，建议提供更多证据`;

        if (optype == '6') answer = `<@!${msga.author.id}> 值班人员已同意您的解除禁言申请`;
        if (optype == '7') answer = `<@!${msga.author.id}> 抱歉，您的理由不充分，值班人员已拒绝您的解除禁言申请`;

        if (optype == '11') answer = `被举报用户发言违规，值班人员已将发送者踢出，请各位规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
        if (optype == '12') answer = `被举报用户发言违规，值班人员已将发送者踢出并拉黑，请各位规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
        if (optype == '13') answer = `<@!${msgb.author.id}> 您的发言违规，值班人员已将消息撤回，请规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
        if (optype == '14') answer = `<@!${msga.author.id}> 抱歉，无法确认您举报的用户有违规行为`;

        if ('|21||8||9||10||11||12||13|'.includes(`|${optype}|`)) { //检查是否需要加积分
            if (content.report.enp.able && !users.includes(msga.author.id)) {
                let point_id = content.report.enp.id;
                let point_name = content.report.enp.name;
                let point_cnt = content.report.enp.number;
                if (point_id && point_name && point_cnt) {
                    let pchange = await this.user_points_change(guildid, msga.author.id, point_id, point_cnt, msga.author.avatar, msga.author.username);
                    if (pchange) {
                        answer = `${answer}\r举报有效奖励 ${point_name} 【${point_cnt}】点`;
                        await this.addpointchangelog(guildid, msga.author.id, point_id, point_cnt, '举报确认积分奖励', msga.author.id, msga.author.username, msga.author.avatar);
                    }
                }
            }
        }

        if (answer) {
            let m;
            if ('|0||1||2||3||4||5||30|'.includes(`|${optype}|`)) {
                m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msga.channel_id}>\r\r>${answer}\r\r`,
                    [
                        { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()}` }
                    ],
                    `处理人：${nick.replaceAll('@everyone', ' ')}`
                );
            } else if ('|21||22|'.includes(`|${optype}|`)) {
                m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msga.channel_id}>\r\r>${answer}\r\r`,
                    [
                        { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()}` }
                    ],
                    `处理人：${nick.replaceAll('@everyone', ' ')}`
                );
            } else if ('|6||7|'.includes(`|${optype}|`)) {
                m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：解除禁言申请\r\r>${answer}\r\r`,
                    [
                        { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()}` }
                    ],
                    `处理人：${nick.replaceAll('@everyone', ' ')}`
                );
            } else if ('|8||9||10||11||12||13||14|'.includes(`|${optype}|`)) {
                m = this.get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报消息\r\r来源子频道：<#${msgb.channel_id}>\r\r>${answer}\r\r`,
                    [
                        { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}` },
                        { before: '\r处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${midb}?ref=${Date.now()}` }
                    ],
                    `处理人：${nick.replaceAll('@everyone', ' ')}`
                );
            }
            let deal = '';
            if (optype == '0' || optype == '8') deal = '撤回并禁言';
            if (optype == '1' || optype == '9') deal = '撤回并警告';
            if (optype == '2' || optype == '10') deal = '撤回并警告、禁言';
            if (optype == '3' || optype == '11') deal = '撤回并踢出';
            if (optype == '4' || optype == '12') deal = '撤回并踢出、拉黑';
            if (optype == '5' || optype == '13') deal = '仅撤回';
            if (optype == '30') deal = '解除禁言';
            if (optype == '21') deal = '确认举报内容有效';
            if (optype == '22') deal = '无法确认举报内容有效';
            if (optype == '6') deal = '同意申请';
            if (optype == '7') deal = '拒绝申请';
            if (optype == '14') deal = '无法确认被举报者违规';
            let sendresult = await ext.SendMessage({ guild_id: guildid, channel_id: tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateC}` } });
            if (sendresult && sendresult.id) {
                if ('|8||9||10||11||12||13||14|'.includes(`|${optype}|`)) {
                    try {
                        await client.messageApi.deleteMessage(tochannel, msgb.tid, true);
                    } catch (err) { }
                    await this.HistoryMessage_addid(midb, sendresult.id);
                    await this.HistoryMessage_adddeallog(midb, head, uid, nick, deal);
                } else {
                    try {
                        await client.messageApi.deleteMessage(tochannel, msga.tid, true);
                    } catch (err) { }
                    await this.HistoryMessage_addid(mida, sendresult.id);
                    await this.HistoryMessage_adddeallog(mida, head, uid, nick, deal);
                }
            }
        }

        await this.delofficetask(guildid, taskid, '1');

        return true;
    }

}

async function drawTask(msg, start, end) {

    let check = await redis.get(`ZuCacheDrawTask:${msg.guild_id}`);
    if (check) {
        await ext.SendMessage({
            guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `已有批量撤回任务正在执行，请先等待现有任务执行完成`, message_reference: { message_id: msg.id }
        });
        return;
    }

    await redis.set(`ZuCacheDrawTask:${msg.guild_id}`, 'on', 60);

    await ext.SendMessage({
        guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `开始执行批量撤回
执行时间可能较长，请耐心等待
撤回起点：${start}
撤回终点：${end}`, message_reference: { message_id: msg.id }
    });
    
    let static_cnt = 0;
    
    for (let i = start; i <= end; i++) {
        if (i < 0) continue;
        let mid = ext.packmsgid(msg.guild_id, msg.channel_id, i.toString(), Date.now());
        try {
            await client.messageApi.deleteMessage(msg.channel_id, mid, true);
            static_cnt++;
            await redis.set(`ZuCacheDrawTask:${msg.guild_id}`, 'on', 60);
        } catch (err) { }
    }

    await redis.del(`ZuCacheDrawTask:${msg.guild_id}`);

    await ext.SendMessage({
        guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `已尝试撤回${end - start + 1}条消息
成功 ${static_cnt} 条
指令示范：
/批量撤回 20
代表欲撤回指令前20条消息

/批量撤回 921 931
表示撤回消息id 921~931
id可用指令 /查消息id 查看`, message_reference: { message_id: msg.id }
    });
    
}