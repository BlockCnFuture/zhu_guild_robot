import tools from '../tools.js'

export default class handler extends tools {

    async match_c(command, obj, guildid) {
        let c = obj.val;
        if (typeof command === 'string' && c.startsWith(command)) {
            //if (await this.check_isexpir(guildid)) return false;
            obj.val = c.substring(command.length).trim();
            return true;
        } else {
            if (typeof command === 'object') {
                let match = c.match(command)
                if (match) {
                    //if (await this.check_isexpir(guildid)) return false;
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
            if (c == global.miniappconfig.command) {
                if (await this.check_isexpir(msg.guild_id)) {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '当前频道已被停用（授权到期或违规）' });
                } else {

                    let cdcheck = await redis.get(`GuildPro:初遇小竹:小竹菜单:${msg.guild_id}:cd`);
                    if (cdcheck) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: '该条指令CD中，请勿频繁调用（5s）', message_reference: { message_id: msg.id } });
                        return;
                    }

                    let data = this.get_template_obj('help');
                    let html = await render(this.get_template('help'), data);
                    let img = await webview.screenshot({ render_ret: html, data: data });
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, image: img });

                    await redis.set(`GuildPro:初遇小竹:小竹菜单:${msg.guild_id}:cd`, 'on', 5);
                }
                msg.content = '';
                return;
            } else if (await this.match_c(/^\/频道续期( *(\d+) *(\d+)个月)?/, obj, msg.guild_id)) {
                c = obj.val;
                if (c[2] && c[3]) {
                    c[2] = c[2].trim();
                    c[3] = c[3].trim();

                    let days = Number(c[3]);

                    if (days <= 0 || isNaN(days)) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `月份数量错误`, message_reference: { message_id: msg.id } });
                        return;
                    }
                    let pcnt = Number((days * global.miniappconfig.renewprice).toFixed(0));
                    let addtime = Number((days * 30 * 24 * 60 * 60 * 1000).toFixed(0));

                    let list = await this._getGpoints(global.miniappconfig.officialguildid);
                    if (!list) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `官方频道还未创建代币，无法续期`, message_reference: { message_id: msg.id } });
                        return;
                    }
                    list = list.filter(i => { return i.point_name == global.miniappconfig.pointname });
                    if (list.length <= 0) {
                        await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `官方频道未正确创建代币，无法续期`, message_reference: { message_id: msg.id } });
                        return;
                    }
                    let ret = await this.guildaddtime(c[2], msg.author.id, list[0].point_id, pcnt, addtime);
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: ret, message_reference: { message_id: msg.id } });
                    return;
                } else {
                    await ext.SendMessage({ guild_id: msg.guild_id, channel_id: msg.channel_id, msg_id: msg.id, content: `格式：\r/频道续期 11966633263703387 1个月\r参数一为频道id，参数二为续期月数\r此处一个月指30天`, message_reference: { message_id: msg.id } });
                }
                msg.content = '';
                return;
            }
        }
    }

}