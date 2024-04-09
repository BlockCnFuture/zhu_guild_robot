import tools from '../tools.js'

export default class handler extends tools {

    async handle_MESSAGE_CREATE(msg) {

        if (!msg.member.roles) {
            msg.member.roles = [];
        }

        let troles = msg.member.roles;
        if (!troles.includes('4') && !troles.includes('2') && !troles.includes('5') && !troles.includes('7')) {
            if (await this.check_isexpir(msg.guild_id) == false) {
                let s = await this.ifhas_black(msg.guild_id, msg.author.id);
                if (s[0] && s[1][0].is_black == true) {
                    try {
                        await ext.Del_guild_member({ guild_id: msg.guild_id, author_id: msg.author.id, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                        await this.s_writelog(msg.guild_id, msg.author.id, msg.author.username, msg.author.avatar, '0', '发现是黑名单用户，已自动踢出并拉黑');
                        let replay = `发现黑名单内用户，已自动移除拉黑
来自：<#${msg.channel_id}>
管理移除黑名单入口：
https://${global.miniappconfig.host}/s/o${msg.guild_id}`;
                        await this.punish_notify(msg.guild_id, replay, msg.id);
                    } catch (err) { }
                    msg.content = '';
                    return;
                }
            }
        }

    }

}