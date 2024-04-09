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

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        if (msg.content) {
            let c = msg.content;
            c = c.replace(new RegExp(`^<@(!)?${global.robotid}> *`), '').trim()
            let obj = { val: c };
            if (await this.match_c(/^\/(上|下)身份组(.*)/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[1]) {
                    let role = await this.check_cpermission_safe(msg.member.roles, msg.guild_id, `${c[1]}身份组`, msg.channel_id);
                    if (role == '') {
                        this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, msg.member.roles.includes('4') ? '2' : (msg.member.roles.includes('2') ? '1' : '0'), `使用指令 /${c[1]}身份组`);

                        let answer = '';
                        if (c[1] == '上') {
                            answer = `格式：\r/${c[1]}身份组 身份组名@xxx @xxx\r/${c[1]}身份组 身份组名 1天@xxx @xxx\r@xxx意思是艾特目标用户，可艾特多人\r有效时间可选，默认永久\r时间单位有：分钟、小时、天`;
                            if (c[2]) {
                                c = c[2];
                                let ids = c.match(/<@!?(\d+)>/g);
                                if (ids && ids.length > 0) {

                                    if (ids.length > 3) {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '最多允许操作三人', message_reference: { message_id: msg.id } });
                                        return;
                                    }

                                    for (let s of ids) {
                                        c = c.replaceAll(s, '');
                                    }
                                    c = c.trim();
                                    if (c) {
                                        let check = c.match(/(.*?) *(\d+)(分钟|小时|天)/);
                                        if (check && check[1] && check[2] && check[3]) {
                                            let time = 0;
                                            if (check[3] == '分钟') {
                                                time = Number(check[2]) * 60;
                                            } else if (check[3] == '小时') {
                                                time = Number(check[2]) * 60 * 60;
                                            } else if (check[3] == '天') {
                                                time = Number(check[2]) * 60 * 60 * 24;
                                            }
                                            if (isNaN(time)) time = 0;
                                            if (time > 60 * 60 * 24 * 30) {
                                                answer = '身份组可用最大有效期为30天';
                                            } else {
                                                try {
                                                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '开始执行', message_reference: { message_id: msg.id } });
                                                    let { data } = await client.roleApi.roles(msg.guild_id);
                                                    answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                                                    let role = data.roles.filter(i => {
                                                        return !['1', '2', '4'].includes(i.id) && i.name == check[1].trim();
                                                    });
                                                    if (role.length > 0) {
                                                        let id = role[0].id;
                                                        let replay = '';
                                                        for (let i of ids) {
                                                            let ret = await ext.postRoleMember(msg.guild_id, false, i.match(/\d+/)[0], id, id == '5' ? msg.channel_id : false);
                                                            if (ret) {
                                                                replay = replay + `成功赋予${i} 身份组\r`;
                                                                if (time > 0) {
                                                                    this.write_exprole_change(msg.guild_id, id, i.match(/\d+/)[0], time);
                                                                } else {
                                                                    await this.deltarget_exprole(msg.guild_id, id, i.match(/\d+/)[0]);
                                                                }
                                                            } else {
                                                                replay = replay + `赋予${i} 身份组失败\r`;
                                                            }
                                                        }
                                                        answer = replay.slice(0, replay.length - 1);
                                                    }
                                                } catch (err) {
                                                    answer = '获取频道身份组列表出错';
                                                }
                                            }
                                        } else { //没时间
                                            try {
                                                await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '开始执行', message_reference: { message_id: msg.id } });
                                                let { data } = await client.roleApi.roles(msg.guild_id);
                                                answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                                                let role = data.roles.filter(i => {
                                                    return !['1', '2', '4'].includes(i.id) && i.name == c.trim();
                                                });
                                                if (role.length > 0) {
                                                    let id = role[0].id;
                                                    let replay = '';
                                                    for (let i of ids) {
                                                        let ret = await ext.postRoleMember(msg.guild_id, false, i.match(/\d+/)[0], id, id == '5' ? msg.channel_id : false);
                                                        if (ret) {
                                                            replay = replay + `成功赋予${i} 身份组\r`;
                                                            await this.deltarget_exprole(msg.guild_id, id, i.match(/\d+/)[0]);
                                                        } else {
                                                            replay = replay + `赋予${i} 身份组失败\r`;
                                                        }
                                                    }
                                                    answer = replay.slice(0, replay.length - 1);
                                                }
                                            } catch (err) {
                                                answer = '获取频道身份组列表出错';
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (c[1] == '下') {
                            answer = `格式：\r/${c[1]}身份组 身份组名@xxx @xxx\r@xxx意思是艾特对方，可艾特多人`;
                            if (c[2]) {
                                c = c[2];
                                let ids = c.match(/<@!?(\d+)>/g);
                                if (ids && ids.length > 0) {

                                    if (ids.length > 3) {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '最多允许操作三人', message_reference: { message_id: msg.id } });
                                        return;
                                    }

                                    for (let s of ids) {
                                        c = c.replaceAll(s, '');
                                    }
                                    c = c.trim();
                                    try {
                                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '开始执行', message_reference: { message_id: msg.id } });
                                        let { data } = await client.roleApi.roles(msg.guild_id);
                                        answer = '未能查询到指定的身份组名，或许是没给予小竹对应的权限，请检查身份组名后重试';
                                        let role = data.roles.filter(i => {
                                            return !['1', '2', '4'].includes(i.id) && i.name == c.trim();
                                        });
                                        if (role.length > 0) {
                                            let id = role[0].id;
                                            let replay = '';
                                            for (let i of ids) {
                                                let ret = await ext.Del_RoleMember(msg.guild_id, false, i.match(/\d+/)[0], id, id == '5' ? msg.channel_id : false);
                                                if (ret) {
                                                    replay = replay + `成功取消${i} 的身份组\r`;
                                                    this.del_caroles(msg.guild_id, id, i.match(/\d+/)[0]);
                                                } else {
                                                    replay = replay + `取消${i} 的身份组失败\r`;
                                                }
                                            }
                                            answer = replay.slice(0, replay.length - 1);
                                        }
                                    } catch (err) {
                                        answer = '获取频道身份组列表出错';
                                    }
                                }
                            }
                        } else {
                            return;
                        }
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: answer, message_reference: { message_id: msg.id } });
                    } else {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: role, message_reference: { message_id: msg.id } });
                    }
                }
                msg.content = '';
                return;
            }
        }
    }

}