import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

let dir = path.dirname(fileURLToPath(import.meta.url));

const appid = global.miniappconfig.appid;
const secret = global.miniappconfig.secret;

let p_admins = global.miniappconfig.p_admins;
let lc_admins = '<@!139761108189060386><@!3669914753415294093><@!10778654309842814946><@!9844024419693556553><@!11683981545343540322><@!12521657159334231705><@!4582480470203108031><@!14249651517400865701><@!10668207281654929803><@!6935681660701203778><@!16522184531633794793><@!12579026560300522590>';

global.GetLid = async function () {
    let today = new Date().toISOString().slice(0, 10);
    let check = await redis.get(`ZuCacheL:Shourlid:${today}`);
    if (!check) {
        await redis.set(`ZuCacheL:Shourlid:${today}`, Date.now() * 100);
    }
    let ret = await redis.incr(`ZuCacheL:Shourlid:${today}`, 24 * 60 * 60);
    if (ret) return ret;
    return -1;
}

export async function link_jmp(data) {
    if (data.id) {

        if (data.id.startsWith('r')) {
            let html = `<html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0;url=https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/getrole/getrole?guildID=${data.id.slice(1)}">
        <title>页面跳转中...</title>
      </head>
      <body>
        <p>页面跳转中，请稍等...</p>
      </body>
    </html>`;
            return html;
        }

        if (data.id.startsWith('o')) {
            let html = `<html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0;url=https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/logs/logs?guildID=${data.id.slice(1)}">
        <title>页面跳转中...</title>
      </head>
      <body>
        <p>页面跳转中，请稍等...</p>
      </body>
    </html>`;
            return html;
        }

        if (data.id.startsWith('t')) {
            let html = `<html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0;url=https://qun.qq.com/pro/feed/detail?feedId=${data.id.slice(1)}&guild_id=647046823986013702&channel_id=457414769">
        <title>页面跳转中...</title>
      </head>
      <body>
        <p>页面跳转中，请稍等...</p>
      </body>
    </html>`;
            return html;
        }

        if (data.id.startsWith('w')) {
            let mid = data.id.slice(1);
            let content = await read_historyMessage(mid);
            if (content) {
                return content;
            } else {
                return `{"errcode":0,"errmsg":"ok","data":{"author":{"avatar":"https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100","bot":true,"id":"${global.robotid}","username":"系统"},"imgs":[],"text":"该条记录已过期，下次记得早点来哦~"}}`;
            }
        }

        if (data.id.startsWith('m')) {
            let mid = data.id.slice(1);
            let content = await read_historyMessage(mid);
            if (!content) {
                content = `{"errcode":0,"errmsg":"ok","data":{"author":{"avatar":"https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100","bot":true,"id":"${global.robotid}","username":"系统"},"imgs":[],"text":"该条记录已过期，下次记得早点来哦~"}}`;
            }
            content = JSON.parse(content);
            content = { content: content.data };
            if (content.content.member && content.content.member.roles) {
                let level = check_level(content.content.member.roles);
                let admin = false;
                if (content.content.member.roles.includes('7')) admin = '分组管理员';
                if (content.content.member.roles.includes('5')) admin = '子频道管理员';
                if (content.content.member.roles.includes('2')) admin = '超级管理员';
                if (content.content.member.roles.includes('4')) admin = '频道主';
                let entertime = new Date(content.content.member.joined_at).getTime();
                content = { level: level, admin: admin, enterDays: longtime2s(new Date().getTime() - entertime), enterAt: content.content.member.joined_at.replace('+08:00', '').replace('T', ' '), ...content };
            }
            let html = await render(get_template('show'), content);
            return html;
        }

        if (data.id.startsWith('h')) {
            let mid = data.id.slice(1);
            return `https://qqchannel-profile-1251316161.file.myqcloud.com/${mid}?t=${Date.now()}`;
        }

        if (data.id.startsWith('k')) {
            let mid = data.id.slice(1);
            return `http://thirdqq.qlogo.cn/g?b=oidb&k=${decodeURIComponent(mid)}&t=${Date.now()}`;
        }

        if (data.id.startsWith('L')) {
            let mid = data.id.slice(1);
            return decodeURIComponent(mid);
        }

        if (data.id.startsWith('G')) {
            let mid = data.id.slice(1);
            let html = `<html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0;url=${decodeURIComponent(mid)}">
        <title>页面跳转中...</title>
      </head>
      <body>
        <p>页面跳转中，请稍等...</p>
      </body>
    </html>`;
            return html;
        }

        return false;
    } else {
        return false;
    }
}

export async function outimages(data) {
    let name = data.name;
    let filePath = path.join(dir, '..', '..', '图片', `${name}.png`)
    if (name.length >= 30) {
        let info = await fetch_imginfo(name);
        if (!info) {
            try {
                await fs.promises.unlink(filePath);
            } catch (err) { }
            return false;
        }
        return true;
    }
    return true;
}

export async function code2session(data) {

    let code = data.code;
    let oldtoken = data.token;

    let url = `https://api.q.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    try {
        let headers = {};
        headers['Content-Type'] = 'application/json';

        let result = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        let s = await result.json();
        if (s.errcode == 0) {

            let openid = s.openid;
            let session_key = s.session_key;
            let saltLength = 16;
            let salt = crypto.randomBytes(Math.ceil(saltLength / 2)).toString('hex').slice(0, saltLength);
            let token = await md5WithSalt(`${openid}..${session_key}..`, salt);
            if (await write_qqapplication(token, openid, session_key)) {
                return { errcode: 0, errmsg: "ok", token: token };
            } else {
                return { errcode: 501, errmsg: "存储错误" };
            }
        } else {
            return s;
        }
    } catch (err) {
        return { errcode: 500, errmsg: "服务错误" };
    }
}

export async function decodedata(data) {
    try {
        let info = await ifhas_qqapplication(data.token);
        let token = data.token;
        if (info[0] && info[1][0]) {
            let sessionKey = info[1][0].session_key;
            let openid = info[1][0].openid;
            if (!sessionKey || !openid) return { errcode: 507, errmsg: "decode err" };
            let result = await decryptData(data.encryptedData, sessionKey, data.iv);
            if (result) {
                if (result.includes('member_userid')) {
                    let c = JSON.parse(result);
                    if (c.retcode == 0) {
                        let open_guild_id = c.data.open_guild_id;
                        let member_role = c.data.member_role;
                        let member_userid = c.data.member_userid;

                        let data;

                        try {
                            let userinfo = await client.guildApi.guildMember(open_guild_id, member_userid);
                            data = userinfo.data;
                        } catch (err) { }

                        if (!data) return { errcode: 500, errmsg: "取用户信息错误", token: token };

                        c.data.member_head = data.user.avatar;
                        if (!await w_qqapplication_upguild(openid, open_guild_id, member_role, member_userid, data.nick, data.user.avatar)) {
                            return { errcode: 501, errmsg: "存储错误", token: token };
                        } else {
                            let { data } = await client.guildApi.guild(open_guild_id);
                            c.data.guild_head = data.icon;
                            let ret = data.icon.match(/cn\/(\d+)\//);
                            if (ret && ret[1]) {
                                c.data.guild_bg = `https://groupprocover.gtimg.cn/${ret[1]}`;
                                c.data.guild_bg = 'https://groupprocover.gtimg.cn/';
                            } else {
                                c.data.guild_bg = 'https://groupprocover.gtimg.cn/';
                            }
                            let points = await getupoints(open_guild_id, member_userid);
                            c.data.permissions = await getPermissions(open_guild_id, member_userid, member_role == 2);
                            c.data.points = points;

                            await addusersguilds(openid, member_userid, '', { guildid: open_guild_id, guildtype: 0, guildname: c.data.guild_name, guildhead: data.icon, guilddesc: data.description, guildrole: member_role, owner: data.owner_id, ps: c.data.permissions.replaceAll('0', '').length });
                            mqupguildinfo(open_guild_id, data.icon, c.data.guild_name, data.owner_id);

                            return { errcode: 0, errmsg: "ok", data: JSON.stringify(c) };
                        }

                    }
                } else {
                    let c = { retcode: 0, data: {} };
                    if (data.open_guild_id) await delusersguilds(openid, '', '', data.open_guild_id);
                    return { errcode: 0, errmsg: "ok", data: JSON.stringify(c) };
                }
                return { errcode: 502, errmsg: "failed" };
            } else {
                return { errcode: 400, errmsg: "no per..." };
            }
        } else {
            return { errcode: 400, errmsg: "no per..." };
        }
    } catch (err) {
        return { errcode: 500, errmsg: "服务错误" };
    }
}

export async function adminlist(data) {
    let token = data.token;
    let info = await check_permision(token, 1);
    if (info) {
        let list = [];
        let ret = await ext.getRoleMember(info.open_guild_id, 4, 400, '0', false);
        if (ret && ret.data) {
            let arr = ret.data;
            for (let s of arr) {
                if (s.user.bot) continue;
                s.user.role = 4;
                list.push(s);
            }
            ret = await ext.getRoleMember(info.open_guild_id, 2, 400, '0', false);
            if (ret && ret.data) {
                let arr = ret.data;
                for (let s of arr) {
                    if (s.user.bot) continue;
                    s.user.role = 2;
                    list.push(s);
                }
                return { errcode: 0, errmsg: 'ok', data: list };
            }
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function tu_list(data) {
    let token = data.token;
    let next = data.next;
    let nowgrpid = data.nowgrpid;
    let p = data.p;
    if (!next) next = '0';
    if (!p) p = '1';
    let info = await check_permision(token, Number(p));
    if (info) {
        let list = [];
        let ret = await ext.getRoleMember(info.open_guild_id, nowgrpid, 400, next, false);
        if (ret && ret.data) {
            let arr = ret.data;
            for (let s of arr) {
                if (s.user.bot) continue;
                list.push(s);
            }
            return { errcode: 0, errmsg: 'ok', next: ret.next, data: list };
        } else if (ret.code == 50001) {
            return { errcode: 0, errmsg: 'ok', next: '0', data: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }
}

export async function getpermissions(data) {
    let token = data.token;
    let userid = data.userid;

    let info = await check_permision(token, 1);
    if (info) {
        let p = await getPermissions(info.open_guild_id, userid);
        if (p) {
            return { errcode: 0, errmsg: 'ok', p: p };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function fetchuserinfo(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 402, errmsg: '拉取失败' };
        let p = await getPermissions(info.open_guild_id, info.member_userid);
        if (p) {
            await ref_qqapplication_logintime(info.openid);
            let points = await getupoints(info.open_guild_id, info.member_userid);
            let exptime = await readguildsets(info.open_guild_id);
            return { errcode: 0, errmsg: 'ok', p: p, points: points, exptime: timestamp2times(exptime.expiration_time) };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function setpermission(data) {
    let token = data.token;
    let p = data.p;
    let userid = data.userid;

    let info = await check_permision(token, 1);
    if (info) {
        let ret = await writePermissions(info.open_guild_id, userid, p);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function setpermission_(data) {
    let token = data.token;
    let p = data.p;

    let info = await check_permision(token, 1);
    if (info && data.data.users.length <= 50) {
        let ret = await _writePermissions(info.open_guild_id, data.data.users, p);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '更新失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function getlogs(data) {
    let token = data.token;
    let page = data.page;

    let info = await check_permision(token, 2);
    if (info) {
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await s_getlogs(info.open_guild_id, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function postlog(data) {
    let token = data.token;
    let log = data.log;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let ret = await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, log);
        if (ret) {
            return { errcode: 0, errmsg: 'ok'};
        }
        return { errcode: 402, errmsg: 'failed' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }
}

export async function channellist(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let { data } = await client.channelApi.channels(info.open_guild_id);
        if (data) {
           let list = data.filter(item => item.type != 1 && item.type != 3 & item.type != 4).sort((a, b) => b.position - a.position);
            let group = data.filter(item => item.type == 4).sort((a, b) => a.position - b.position);
            if (group.length > 0 && group[0].position == 1) group[0].name = '无分组 (默认分组)';
            for (let l of list) {
                let index = group.findIndex(item => item.id == l.parent_id);
                group.splice(index + 1, 0, l);
            }
            return { errcode: 0, errmsg: 'ok', cnt: data.length, data: group };
        }
        return { errcode: 402, errmsg: 'failed' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }
}

export async function rolelist(data) {
    let token = data.token;
    let p = data.p;

    let check = await ifhas_qqapplication(token);

    if (check[0]) {
        let info = check[1][0];
        try {
            let { data } = await client.roleApi.roles(info.open_guild_id);
            if (data) {
                return { errcode: 0, errmsg: 'ok', cnt: data.roles.length, data: data.roles };
            }
        } catch (err) { }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function uploadimage(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await write_expimg(data.md5, data.width, data.height);
        if (ret) {
            await NewIPush(`有新的图片被上传，等待巡查\r哈希：${data.md5}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/imagesp/imagesp?guildID=${global.miniappconfig.officialguildid}`);
        }
        return ret;
    } else {
        return false;
    }
}

export async function newrole(data) {
    let token = data.token;
    let p = data.p;
    let channelinfo = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        if (!info.open_guild_id) return { errcode: 402, errmsg: '拉取失败' };
        try {
            channelinfo.color = Number(BigInt('0x' + channelinfo.color.substr(1)));
            let { data } = await client.roleApi.postRole(info.open_guild_id, channelinfo);
            if (data) {
                return { errcode: 0, errmsg: 'ok', ...data };
            }
        } catch (err) { }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }
}

export async function geteventssets(data) {
    let token = data.token;
    let p = data.p;
    let name = data.name;

    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await get_EventsSets(info.open_guild_id, name);
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 0, errmsg: 'ok' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getGuildVefSets(data) {
    let token = data.token;

    let check = await ifhas_qqapplication(token);
    if(check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets(info.open_guild_id, '入频验证码');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) {
                return { errcode: 407, errmsg: '未开启' };
            }
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 407, errmsg: '未开启' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchblacklist(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getblacklist(info.open_guild_id, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delblack(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await delblacklist(info.open_guild_id, s.ids);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function editblack(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await upblacklist(info.open_guild_id, s.ids, s.isblack, s.reason, info.member_nick);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '更新出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upeventssets(data) {
    let token = data.token;
    let p = data.p;
    let set = data.data;
    try {
        if (typeof set.content =='object') set.content = JSON.stringify(set.content);
    } catch (err) { }
    set.useit = (set.useit ? 'true' : 'false');
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await write_EventsSets(info.open_guild_id, set.fromchannel, set.tochannel, set.name, set.useit, set.image, set.content);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 501, errmsg: '保存出错' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchforbidenkeywords(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getforbidenwords(info.open_guild_id, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delforbidenwords(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await delfwords(info.open_guild_id, s.words);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function forbidenwordswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await fwordsup(s.keyword, info.open_guild_id, s.enabled_channels, s.deal_type, s.op_time, info.member_userid, info.member_nick, info.member_head, s.notifytext, s.saferoles);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchkeywords(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getkeywords(info.open_guild_id, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delkeywords(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await delkwords(info.open_guild_id, s.words);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function keywordswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await kwordsup(s.keyword, info.open_guild_id, s.enabled_channels, s.content, s.image, s.cd, info.member_userid, info.member_nick, info.member_head, s.id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getrolesets(data) {
    let token = data.token;
    let name = '自助领取身份组';

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets(info.open_guild_id, name);
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 0, errmsg: 'ok' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchuinfo(data) {
    let token = data.token;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 503, errmsg: 'err' };
        try {
            let { data } = await client.guildApi.guildMember(info.open_guild_id, info.member_userid);
            return { errcode: 0, errmsg: 'ok', info: data };
        } catch (err) { }
        return { errcode: 503, errmsg: 'err' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function changerole(data) {
    let token = data.token;
    let roleid = data.roleid;
    let op = data.op;
    let time = data.time;
    let fromzero = data.fromzero;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        try {

            if (op != 'del') {
                let rc = await redis.get(`ZuCacheVef:AnswerVef:${info.open_guild_id}:${info.member_userid}`);
                if (rc) {
                    return { errcode: 407, errmsg: 'need vef' };
                }
            }

            op == 'del' ? await client.memberApi.memberDeleteRole(info.open_guild_id, roleid, info.member_userid) : await client.memberApi.memberAddRole(info.open_guild_id, roleid, info.member_userid);
            if (op != 'del') {
                if (time && Number(time) > 0) {
                    await write_exprole_change(info.open_guild_id, roleid, info.member_userid, time);
                }

                if (fromzero && fromzero == '1') {
                    let disban = await check_ifneed_disban(info.open_guild_id);
                    if (disban) {
                        try {
                            await client.muteApi.muteMember(info.open_guild_id, info.member_userid, { seconds: '0' });
                        } catch (err) { }
                    }
                }
            } else {
                await del_caroles(info.open_guild_id, roleid, info.member_userid);
            }
            return { errcode: 0, errmsg: 'ok' };
        } catch (err) {
           return { errcode: 501, errmsg: 'ok' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_pkeywords(data) {
    let token = data.token;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await getkeywords_p(page);
            if (ret) {
                return { errcode: 0, errmsg: 'ok', ...ret };
            } else {
                return { errcode: 0, errmsg: 'ok', cnt: 0 };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function op_pkeywords(data) {
    let token = data.token;
    let op = data.op;
    let ls = data.data;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await kwordsup_p(ls.words, op, info.member_userid);
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 502, errmsg: '存储错误' };
            }
            
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getguildsets(data) {
    let token = data.token;
    let p = data.p;

    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await readguildsets(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 501, errmsg: 'err' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upguildsets(data) {
    let token = data.token;
    let p = data.p;
    let set = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await mqupguildsets(info.open_guild_id, set);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 501, errmsg: '保存出错' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchforbidenkeywords_nick(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getforbidenwords_nick(info.open_guild_id, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delforbidenwords_nick(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await delfwords_nick(info.open_guild_id, s.words);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function forbidenwordswr_nick(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await fwordsup_nick(s.keyword, info.open_guild_id, s.deal_type, info.member_userid, info.member_nick, info.member_head);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchtask_banspeaking(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await fetchtask__(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function savetask_banspeaking(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await savetask_banspeak(info.open_guild_id, data.data, info.member_nick,info.member_head);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 402, errmsg: 'err' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_ptasks(data) {
    let token = data.token;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await fetchtask_(page);
            if (ret) {
                return { errcode: 0, errmsg: 'ok', ...ret };
            } else {
                return { errcode: 0, errmsg: 'ok', cnt: 0 };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function op_ptasks(data) {
    let token = data.token;
    let op = data.op;
    let ls = data.data;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await tasksup_p(ls.words, op, info.member_userid);
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 502, errmsg: '存储错误' };
            }

        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchtasks(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await _fetchtask_(info.open_guild_id, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function deltasks(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await deltasks_(info.open_guild_id, s.words);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function taskswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await _tasksup(info.open_guild_id, s, info.member_nick, info.member_head, s.id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getmylogs(data) {
    let token = data.token;
    let page = data.page;

    let check = await ifhas_qqapplication(token);

    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await s_getlogs_my(info.open_guild_id, info.member_userid, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function fetchkeywords_lc(data) { //光萌的函数，无用
    return { errcode: 0, errmsg: 'ok', cnt: 0 };
}

export async function delkeywords_lc(data) {//光萌的函数，无用
    return { errcode: 0, errmsg: 'ok' };
}

export async function refkeywords_lc(data) {//光萌的函数，无用
    return { errcode: 0, errmsg: 'ok' };
}

export async function channellist_lc(data) {//光萌的函数，无用
    return { errcode: 402, errmsg: 'failed' };
}

export async function getCsets_lc(data) {//光萌的函数，无用
    return { errcode: 403, errmsg: '无权限' };
}

export async function savesets_LC(data) {//光萌的函数，无用
    return { errcode: 403, errmsg: '无权限' };
}

export async function sendmd(data) {
    let token = data.token;
    let index = data.index;
    let channel = data.channel;
    let info = await check_permision(token, 3);
    if (info) {
        let sets = await get_EventsSets(info.open_guild_id, '自助领取身份组');
        if (!sets[0]) return { errcode: 402, errmsg: '错误' };
        let cc = JSON.parse(sets[1][0].content);
        if (index >= 0 && index < cc.length) {
            cc = cc[index];
        } else {
            if (cc.length <= 0) return { errcode: 402, errmsg: '错误' };
            cc = cc[0];
        }
        let img = cc.image;
        let roles = cc.roles;
        if (!img || !roles || roles.length <= 0) return { errcode: 402, errmsg: '错误' };
        let imginfo = await getimageinfo(img);
        if (!imginfo) return { errcode: 402, errmsg: '错误' };

        if (cc.desc) {
            cc.desc = cc.desc.replaceAll('\r\n', `\r`);
            cc.desc = cc.desc.replaceAll('\n', `\r`);
        }
        let arr = [];
        let s = encodeURIComponent(`pages/functions/getrole/getrole?guildID=${info.open_guild_id}&i=${index}`);

        let desc = '';
        if (cc.multigain) {
            desc = cc.desc ? `${cc.desc}\r✅可选${cc.maxcnt}个` : `✅可选${cc.maxcnt}个`;
        } else {
            desc = cc.desc ? `${cc.desc}\r✅仅单选` : `✅仅单选`;
        }

        roles.map(i => {
            i.desc = i.desc.replaceAll('\r\n', `\r`);;
            i.desc = i.desc.replaceAll('\n', `\r`);;
            arr.push({ name: `『${i.rolename}』`, desc: i.desc ? `> ${i.desc}\r[🔗点击领取](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s}` : `> [🔗点击领取](https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s}` });
        });
        
        let m = {
            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
            "params": []
        };

        for (let i = 0; i < 10; i++) {
            if (i + 1 == 1) {
                m.params.push({ key: `c${i + 1}`, values: [`img #${imginfo.width}px #${imginfo.height}px](${img}?t=2 )\r${desc || ' '}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
            } else {
                let index = i + 1;
                if (index == 10) index = 0;
                if (i - 1 < arr.length) {
                    arr[i - 1].name = arr[i - 1].name.replaceAll('\r\n', `\r`);;
                    arr[i - 1].name = arr[i - 1].name.replaceAll('\n', `\r`);;
                    arr[i - 1].desc = arr[i - 1].desc.replaceAll('\r\n', `\r`);;
                    arr[i - 1].desc = arr[i - 1].desc.replaceAll('\n', `\r`);;
                    m.params.push({ key: `c${index}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r${arr[i - 1].name}\r\r${arr[i - 1].desc}`] });
                } else {
                    m.params.push({ key: `c${index}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                }
                
            }
        }

        let ret = await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: channel, event_id: await GetMid(info.open_guild_id, true), markdown: m });
        if (ret && !ret.code) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '错误' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchinvitecodes(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    let own = data.own;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = false;
    if (own == '1') {
        let check = await ifhas_qqapplication(token);
        if (check[0]) info = check[1][0];
    } else {
        info = await check_permision(token, Number(p));
    }

    if (info) {
        let ret = await getinvitecodes(info.open_guild_id, info.member_userid, page, own);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delinvitecodes(data) {

    let token = data.token;
    let p = data.p;
    let own = data.own;
    let s = data.data;

    let info = false;
    if (own == '1') {
        let check = await ifhas_qqapplication(token);
        if (check[0]) info = check[1][0];
    } else {
        info = await check_permision(token, Number(p));
    }

    if (info) {
        let ret = await _delinvitecodes(info.open_guild_id, s.words);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function invitecodeswr(data) {

    let token = data.token;
    let p = data.p;
    let own = data.own;
    let s = data.data;

    let info = false;
    if (own == '1') {
        let check = await ifhas_qqapplication(token);
        if (check[0]) info = check[1][0];

        if (s.gbantime > 0 || JSON.parse(s.groles).length > 0 || JSON.parse(s.gpoints).length > 0) {
            let pc = await check_permision(token, 35);
            if (!pc) {
                return { errcode: 407, errmsg: '无权限' };
            }
        }
    } else {
        info = await check_permision(token, Number(p));
    }

    if (info) {

        if (s.code) { //修改
            let icodecheck = await getinvitecodeinfo(s.code);
            if (!icodecheck) {
                return { errcode: 400, errmsg: '邀请码不存在' };
            } else {
                if (icodecheck.guildid && icodecheck.guildid != info.open_guild_id) {
                    return { errcode: 400, errmsg: '邀请码不存在' };
                }
            }
        }

        let ret = await write_invitecode(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, s);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '您没有此功能的权限' };
    }
}

export async function fetchinvitecode_r(data) {
    let token = data.token;
    let p = data.p;
    let page = data.page;
    let own = data.own;
    let code = data.code;

    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let info = false;

    let icodecheck = await getinvitecodeinfo(code);
    if (!icodecheck) {
        return { errcode: 400, errmsg: '邀请码不存在' };
    }

    if (own == '1') {
        let check = await ifhas_qqapplication(token);
        if (check[0]) {
            info = check[1][0];

            if (icodecheck && icodecheck.authorid && icodecheck.authorid != info.member_userid) {
                return { errcode: 400, errmsg: '邀请码不存在' };
            }

        }
    } else {
        info = await check_permision(token, Number(p));
    }

    if (info) {

        if (icodecheck && icodecheck.guildid && icodecheck.guildid != info.open_guild_id) {
            return { errcode: 400, errmsg: '邀请码不存在' };
        }

        let ret = await getinvitecode_r(code, page);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchinvitecode_info(data) {

    let token = data.token;
    let code = data.code;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {

        let icodecheck = await getinvitecodeinfo(code);
        if (!icodecheck || !icodecheck.guildrid) {
            return { errcode: 400, errmsg: '邀请码不存在' };
        } else {
            return { errcode: 0, errmsg: 'ok', data: icodecheck }
        }

    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function decodedata_invite(data) {
    try {
        let code = data.code;
        if (!code) return { errcode: 400, errmsg: "no per..." };
        let info = await ifhas_qqapplication(data.token);
        if (info[0] && info[1][0]) {
            let sessionKey = info[1][0].session_key;
            let result = await decryptData(data.encryptedData, sessionKey, data.iv);
            if (result) {
                if (result.includes('member_userid')) {
                    let c = JSON.parse(result);
                    if (c.retcode == 0) {
                        let open_guild_id = c.data.open_guild_id;
                        let member_role = c.data.member_role;
                        let member_userid = c.data.member_userid;
                        let member_nick = c.data.member_nick;
                        let head = data.head;

                        try {
                            let sdata = await client.guildApi.guildMember(open_guild_id, member_userid);
                            if (sdata.data) head = sdata.data.user.avatar;
                        } catch (err) { }

                        let icodecheck = await getinvitecodeinfo(code);
                        if (!icodecheck || !icodecheck.guildrid || icodecheck.guildid != open_guild_id) {
                            return { errcode: 400, errmsg: '邀请码不存在' };
                        } else {
                            let hascheck = await ifhas_invitecode_r(icodecheck.guildid, member_userid);
                            
                            if (!hascheck) {
                                await write_invitecode_r(code, member_userid, member_nick, head);
                                await Run_Options_AfterEnter(code, member_userid, open_guild_id, member_nick, head, icodecheck);
                            }

                            return { errcode: 0, errmsg: "ok" };
                        }
                    }
                }
                return { errcode: 502, errmsg: "failed" };
            } else {
                return { errcode: 400, errmsg: "no per..." };
            }
        } else {
            return { errcode: 400, errmsg: "no per..." };
        }
    } catch (err) {
        return { errcode: 500, errmsg: "服务错误" };
    }
}

async function Run_Options_AfterEnter(code, userid, guildid, nick, head, icodecheck) {
    add_invitecode_su(code, icodecheck);

    try {
        let gbantime = icodecheck.gbantime;
        if (gbantime > 0) {
            await client.muteApi.muteMember(guildid, userid, { seconds: gbantime.toString() });
        }
    } catch (err) { }

    try {
        let groles = JSON.parse(icodecheck.groles);
        groles = groles.slice(0, 3);
        for (let s of groles) {
            if (s.roleid) {
                await client.memberApi.memberAddRole(guildid, s.roleid, userid);
                if (s.time && s.time > 0) {
                    await this.write_exprole_change(guildid, s.roleid, userid, s.time);
                }
            }
        }
    } catch (err) { }

    try {
        let gpoints = JSON.parse(icodecheck.gpoints);
        gpoints = gpoints.slice(0, 3);
        for (let s of gpoints) {
            if (s.point_id) {
                let addret = await user_points_change(guildid, userid, s.point_id, 1 * s.pointcnt, head, nick);
                if (addret === false) {
                    //nothing to do
                } else {
                    await addpointchangelog(guildid, userid, s.point_id, 1 * s.pointcnt, '邀请码加入奖励', global.robotid, '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                }
            }
        }
    } catch (err) { }

}

export async function fetch_guilds(data) {

    let token = data.token;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];

        let ret = await getguilds(info.member_userid);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }

    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchGpoints(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await _getGpoints(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delGpoint(data) {
    let token = data.token;
    let p = data.p;
    let id = data.id;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await _delGpoint(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '删除出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function Gpointswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await GpointUp(info.open_guild_id, s.point_id, s);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function AnswerVef(data) {
    let token = data.token;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let rc = await redis.get(`ZuCacheVef:AnswerVef:${info.open_guild_id}:${info.member_userid}`);
        if (rc) {
            await redis.del(`ZuCacheVef:AnswerVef:${info.open_guild_id}:${info.member_userid}`);
            try {
                await client.muteApi.muteMember(info.open_guild_id, info.member_userid, { seconds: '0' });
            } catch (err) { }
        }
        return { errcode: 0, errmsg: 'ok' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function slogsuop(data) {
    let token = data.token;
    let type = data.type;
    let uid = data.uid;
    let time = data.time;

    if (isNaN(time)) time = '300';
    if (Number(time) < 0) time = '0';

    let info = await check_permision(token, 40);
    if (info) {
        if (type == 'a') { //踢出
            let ret = await ext.Del_guild_member({ guild_id: info.open_guild_id, author_id: uid, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 401, errmsg: 'failed.' };
            }
        } else if (type == 'b') { //踢黑
            let ret = await ext.Del_guild_member({ guild_id: info.open_guild_id, author_id: uid, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 401, errmsg: 'failed.' };
            }
        } else if (type == 'c') { //下黑
            await upblacklist(info.open_guild_id, uid, false, '手动下黑', info.member_nick);
            return { errcode: 0, errmsg: 'ok' };
        } else if (type == 'f') { //重置警告
            await user_worningcount_reset(info.open_guild_id, uid);
            await del_worninglogs_user(info.open_guild_id, uid);
            return { errcode: 0, errmsg: 'ok' };
        } else if (type == 'd') { //禁言
            let ret = false;

            try {
                await client.muteApi.muteMember(info.open_guild_id, uid, { seconds: time });
                ret = true;
            } catch (err) { }

            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 401, errmsg: 'failed.' };
            }
        } else {
            return { errcode: 501, errmsg: '无效操作' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function geteventssets_back(data) {
    let token = data.token;
    let p = data.p;
    let name = data.name;

    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await get_EventsSets_back(info.open_guild_id, name);
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 0, errmsg: 'ok' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upeventssets_back(data) {
    let token = data.token;
    let p = data.p;
    let set = data.data;
    try {
        if (typeof set.content == 'object') set.content = JSON.stringify(set.content);
    } catch (err) { }
    set.useit = (set.useit ? 'true' : 'false');
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await write_EventsSets_back(info.open_guild_id, set.fromchannel, set.tochannel, set.name, set.useit, set.image, set.content);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 501, errmsg: '保存出错' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getGuildOfficeSets(data) {
    let token = data.token;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets_back(info.open_guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) {
                return { errcode: 407, errmsg: '未开启' };
            }
            return { errcode: 0, errmsg: 'ok', sets: ret };
        } else {
            return { errcode: 407, errmsg: '未开启' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function DisbanApply(data) {
    let token = data.token;
    let answer = data.data.answer;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets_back(info.open_guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);

            if (!ret.useit) return { errcode: 407, errmsg: '频道主未开启该功能' };
            if (!ret.content.disban.able) return { errcode: 407, errmsg: '频道主未开启该功能' };

            let check = await office_taskcheck_ifhasdisbanapply(info.open_guild_id, info.member_userid);
            if (check) {
                return { errcode: 409, errmsg: '您已提交过解除禁言申请，请勿重复提交' };
            }

            let needpoint = 0;
            let pointid = '';
            if (ret.content.disban.dep.able) {
                needpoint = ret.content.disban.dep.number;
                pointid = ret.content.disban.dep.id;
            }

            if (pointid != '' && needpoint > 0) {
                let pchange = await user_points_change(info.open_guild_id, info.member_userid, pointid, needpoint * -1, info.member_head, info.member_nick);
                if (!pchange) {
                    return { errcode: 511, errmsg: '您的积分不足，无法申请自助解禁' };
                } else {
                    await addpointchangelog(info.open_guild_id, info.member_userid, pointid, needpoint * -1, '申请自助解禁', info.member_userid, info.member_nick, info.member_head);
                }
            }

            let uinfo = false;
            try {
                let { data } = await client.guildApi.guildMember(info.open_guild_id, info.member_userid);
                if (data && data.roles && !data.user.bot) {
                    uinfo = data;
                }
            } catch (err) { }
            if (!uinfo) return { errcode: 512, errmsg: '系统错误，获取用户信息失败' };

            let author = uinfo.user;
            let member = {
                "joined_at": uinfo.joined_at,
                "nick": uinfo.nick,
                "roles": uinfo.roles
            };

            let mid = await write_HistoryMessage(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { author: author, member: member, imgs: [], text: `申请解除禁言\r\n理由：\r\n${answer}`, reason: '' } }));

            if (!mid) return { errcode: 510, errmsg: '系统错误，写入用户信息失败' };

            let result = await write_office_task(info.open_guild_id, info.member_userid, '2', mid, 0);

            if (result) {
                let users = ret.content;
                users = get_today_users(users);

                let md = get_markdown_office(`${users}新的值班任务待处理\r任务id：${result}\r任务类型：解除禁言申请\r`,
                    [
                        { before: '申请理由：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mid}` }
                    ],
                    '若同意帮助用户解除禁言，请点击[✔️同意]，若不同意，请点击[❌拒绝]'
                );
                let sendresult = await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: ret.tochannel, markdown: md, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });
                if (sendresult && sendresult.id) {
                    await HistoryMessage_addid(mid, sendresult.id);
                }

                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 510, errmsg: '系统错误，信息写入失败' };
            }
        } else {
            return { errcode: 407, errmsg: '未开启' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_officetasks(data) {
    let token = data.token;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets_back(info.open_guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) return { errcode: 407, errmsg: '频道主未开启该功能' };
            let users = ret.content;
            users = [...users.u1, ...users.u2, ...users.u3, ...users.u4, ...users.u5, ...users.u6, ...users.u7];
            users = users.map(i => { return i.id });
            if (users.includes(info.member_userid) || info.member_role == '2') {
                let list = await fetchofficetasks(info.open_guild_id, page);
                if (list) {
                    return { errcode: 0, errmsg: 'ok', ...list };
                } else {
                    return { errcode: 0, errmsg: 'ok', cnt: 0 };
                }
            } else {
                return { errcode: 403, errmsg: '无权限' };
            }
        } else {
            return { errcode: 407, errmsg: '频道主未开启该功能' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function del_officetask(data) {
    let token = data.token;
    let taskid = data.taskid;
    let close = data.close;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets_back(info.open_guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) return { errcode: 407, errmsg: '频道主未开启该功能' };
            let users = ret.content;
            users = [...users.u1, ...users.u2, ...users.u3, ...users.u4, ...users.u5, ...users.u6, ...users.u7];
            users = users.map(i => { return i.id });
            if (users.includes(info.member_userid) || info.member_role == '2') {

                let delret = await delofficetask(info.open_guild_id, taskid, close);

                if (delret === false) {
                    return { errcode: 502, errmsg: '存储错误' };
                } else {
                    if (delret != true && delret.mida) {
                        let msg;
                        if (delret.tasktype == '3') {
                            msg = await readHistoryMessage(delret.midb);
                        } else {
                            msg = await readHistoryMessage(delret.mida);
                        }
                        if (msg) {
                            if (close == '1') {
                                let m;
                                let answer = '值班人员关闭任务';
                                if (delret.tasktype == '0') {
                                    m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                        [
                                            { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                        ],
                                        `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                                    );
                                } else if (delret.tasktype == '1') {
                                    m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                        [
                                            { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                        ],
                                        `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                                    );
                                } else if (delret.tasktype == '2') {
                                    m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：解除禁言申请\r\r>${answer}\r\r`,
                                        [
                                            { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                        ],
                                        `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                                    );
                                } else if (delret.tasktype == '3') {
                                    m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报消息\r来源子频道：<#${msg.channel_id}>\r\r>${answer}\r\r`,
                                        [
                                            { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}` },
                                            { before: '\r处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.midb}?ref=${Date.now()}` }
                                        ],
                                        `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                                    );
                                }
                                let sendresult = await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: ret.tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateC}` } });
                                if (sendresult && sendresult.id) {
                                    if (delret.tasktype == '3') {
                                        try {
                                            await client.messageApi.deleteMessage(ret.tochannel, msg.tid, true);
                                        } catch (err) { }
                                        await HistoryMessage_addid(delret.midb, sendresult.id);
                                        await HistoryMessage_adddeallog(delret.midb, info.member_head, info.member_userid, info.member_nick, '关闭任务');
                                    } else {
                                        try {
                                            await client.messageApi.deleteMessage(ret.tochannel, msg.tid, true);
                                        } catch (err) { }
                                        await HistoryMessage_addid(delret.mida, sendresult.id);
                                        await HistoryMessage_adddeallog(delret.mida, info.member_head, info.member_userid, info.member_nick, '关闭任务');
                                    }
                                }
                            } else {
                                let atusers = get_today_users(ret.content);
                                let m;
                                let s2 = encodeURIComponent(`pages/functions/officetasks/officetasks?guildID=${info.open_guild_id}`);
                                if (delret.tasktype == '0') {
                                    if (!msg.id) {
                                        m = get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r\r>  该发言是对主题的评论，机器人无法撤回，请前往对应子频道手动撤回\r\r`,
                                            [
                                                { before: '发送内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` },
                                                { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                            ],
                                            `请使用第一行按钮进行处罚操作，若用户无违规，请点击[🔊解禁]或[🔒关闭任务]，更多自定义操作请进入小程序`
                                        );
                                    } else {
                                        m = get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msg.channel_id}>\r`,
                                            [
                                                { before: '发送内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` },
                                                { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                            ],
                                            `请使用第一行按钮进行处罚操作，若用户无违规，请点击[🔊解禁]或[🔒关闭任务]，更多自定义操作请进入小程序`
                                        );
                                    }
                                } else if (delret.tasktype == '1') {
                                    m = get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msg.channel_id}>\r`,
                                        [
                                            { before: '举报内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                        ],
                                        `请人工处理，若确认举报有效，请点击[✅有效]，若举报无效，请点击[❎无效]`
                                    );
                                } else if (delret.tasktype == '2') {
                                    m = get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：解除禁言申请\r`,
                                        [
                                            { before: '申请理由：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}?ref=${Date.now()}` }
                                        ],
                                        `若同意帮助用户解除禁言，请点击[✔️同意]，若不同意，请点击[❌拒绝]`
                                    );
                                } else if (delret.tasktype == '3') {
                                    m = get_markdown_office(`${atusers}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理举报消息\r来源子频道：<#${msg.channel_id}>\r`,
                                        [
                                            { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.mida}` },
                                            { before: '\r被举报消息：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${delret.midb}?ref=${Date.now()}` },
                                            { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                                        ],
                                        `请使用第一行按钮进行处罚操作，若被举报的消息无违规，请点击[📛无法确认]或[🔒关闭任务]，更多自定义操作请进入小程序`
                                    );
                                }
                                let sendresult = await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: ret.tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });
                                if (sendresult && sendresult.id) {
                                    if (delret.tasktype == '3') {
                                        try {
                                            await client.messageApi.deleteMessage(ret.tochannel, msg.tid, true);
                                        } catch (err) { }
                                        await HistoryMessage_addid(delret.midb, sendresult.id);
                                        await HistoryMessage_adddeallog(delret.midb, info.member_head, info.member_userid, info.member_nick, '重新启用任务');
                                    } else {
                                        try {
                                            await client.messageApi.deleteMessage(ret.tochannel, msg.tid, true);
                                        } catch (err) { }
                                        await HistoryMessage_addid(delret.mida, sendresult.id);
                                        await HistoryMessage_adddeallog(delret.mida, info.member_head, info.member_userid, info.member_nick, '重新启用任务');
                                    }
                                }
                            }
                        }
                        
                    }
                    return { errcode: 0, errmsg: 'ok' };
                }

            } else {
                return { errcode: 403, errmsg: '无权限' };
            }
        } else {
            return { errcode: 407, errmsg: '频道主未开启该功能' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function deal_officetasks(data) {
    let token = data.token;
    let taskid = data.taskid;
    let optype = data.optype;
    let bantime = data.bantime;
    let mida = data.data.mida;
    let midb = data.data.midb;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await get_EventsSets_back(info.open_guild_id, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);
            if (!ret.useit) return { errcode: 407, errmsg: '频道主未开启该功能' };
            let users = ret.content;
            users = [...users.u1, ...users.u2, ...users.u3, ...users.u4, ...users.u5, ...users.u6, ...users.u7];
            users = users.map(i => { return i.id });
            if (users.includes(info.member_userid) || info.member_role == '2') {

                let msga = await readHistoryMessage(mida);
                let msgb = await readHistoryMessage(midb);
                let answer = false;

                if (!msga || (midb && midb != '' && !msgb)) {
                    return { errcode: 409, errmsg: '错误，取历史任务内容失败' };
                }

                if ('|0||1||2||3||4||5|'.includes(`|${optype}|`)) { //撤回A
                    try {
                        await client.messageApi.deleteMessage(msga.channel_id, msga.id, true);
                    } catch (err) { }
                }
                if ('|0||2|'.includes(`|${optype}|`)) { //禁言A
                    try {
                        await client.muteApi.muteMember(msga.guild_id, msga.author.id, { seconds: bantime.toString() });
                    } catch (err) { }
                }
                if ('|3||4|'.includes(`|${optype}|`)) { //移除A
                    await ext.Del_guild_member({ guild_id: msga.guild_id, author_id: msga.author.id, sandbox: false, add_blacklist: optype == '4' ? true : false, delete_history_msg_days: optype == '4' ? -1 : 0 });
                }
                if ('|1||2|'.includes(`|${optype}|`)) { //警告A
                    answer = await worningOneUser(info.open_guild_id, msga.author.id, msga.author.username, msga.author.avatar, info.member_userid, optype == '2' ? bantime : false);
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
                if ('|8||10|'.includes(`|${optype}|`)) { //禁言B
                    try {
                        await client.muteApi.muteMember(msgb.guild_id, msgb.author.id, { seconds: bantime.toString() });
                    } catch (err) { }
                }
                if ('|11||12|'.includes(`|${optype}|`)) { //移除B
                    await ext.Del_guild_member({ guild_id: msgb.guild_id, author_id: msgb.author.id, sandbox: false, add_blacklist: optype == '12' ? true : false, delete_history_msg_days: optype == '12' ? -1 : 0 });
                }
                if ('|9||10|'.includes(`|${optype}|`)) { //警告B
                    answer = await worningOneUser(info.open_guild_id, msgb.author.id, msgb.author.username, msgb.author.avatar, info.member_userid, optype == '10' ? bantime : false);
                }
                ///////////////////////////////////////////////////////////////////

                if (optype == '0') answer = `<@!${msga.author.id}> 您的发言违规，值班人员给予禁言${longtime2s(bantime * 1000)}处罚，请规范发言`;
                if (optype == '3') answer = `该用户发言违规，值班人员已将发送者踢出，请各位规范发言`;
                if (optype == '4') answer = `该用户发言违规，值班人员已将发送者踢出并拉黑，请各位规范发言`;
                if (optype == '5') answer = `<@!${msga.author.id}> 您的发言违规，值班人员已将消息撤回，请规范发言`;
                if (optype == '30') answer = `<@!${msga.author.id}> 您的发言已被确认无违规，值班人员已解除您的禁言`;

                if (optype == '21') answer = `<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
                if (optype == '22') answer = `<@!${msga.author.id}> 抱歉，无法确认您提交的举报内容有效，建议提供更多证据`;

                if (optype == '6') answer = `<@!${msga.author.id}> 值班人员已同意您的解除禁言申请`;
                if (optype == '7') answer = `<@!${msga.author.id}> 抱歉，您的理由不充分，值班人员已拒绝您的解除禁言申请`;

                if (optype == '8') answer = `<@!${msgb.author.id}> 您的发言违规，值班人员给予禁言${longtime2s(bantime * 1000)}处罚，请规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
                if (optype == '11') answer = `被举报用户发言违规，值班人员已将发送者踢出，请各位规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
                if (optype == '12') answer = `被举报用户发言违规，值班人员已将发送者踢出并拉黑，请各位规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
                if (optype == '13') answer = `<@!${msgb.author.id}> 您的发言违规，值班人员已将消息撤回，请规范发言\r<@!${msga.author.id}> 您提交的举报内容已被值班人员确认有效`;
                if (optype == '14') answer = `<@!${msga.author.id}> 抱歉，无法确认您举报的用户有违规行为`;

                if ('|21||8||9||10||11||12||13|'.includes(`|${optype}|`)) { //检查是否需要加积分
                    if (ret.content.report.enp.able && !users.includes(msga.author.id)) {
                        let point_id = ret.content.report.enp.id;
                        let point_name = ret.content.report.enp.name;
                        let point_cnt = ret.content.report.enp.number;
                        if (point_id && point_name && point_cnt) {
                            let pchange = await user_points_change(info.open_guild_id, msga.author.id, point_id, point_cnt, msga.author.avatar, msga.author.username);
                            if (pchange) {
                                answer = `${answer}\r举报有效奖励 ${point_name} 【${point_cnt}】点`;
                                await addpointchangelog(info.open_guild_id, msga.author.id, point_id, point_cnt, '举报确认积分奖励', msga.author.id, msga.author.username, msga.author.avatar);
                            }
                        }
                    }
                }

                if (answer) {
                    let m;
                    if ('|0||1||2||3||4||5||30|'.includes(`|${optype}|`)) {
                        m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${msga.channel_id}>\r\r>${answer}\r\r`,
                            [
                                { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()} ` }
                            ],
                            `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                        );
                    } else if ('|21||22|'.includes(`|${optype}|`)) {
                        m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报内容\r来源子频道：<#${msga.channel_id}>\r\r>${answer}\r\r`,
                            [
                                { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()} ` }
                            ],
                            `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                        );
                    } else if ('|6||7|'.includes(`|${optype}|`)) {
                        m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：解除禁言申请\r\r>${answer}\r\r`,
                            [
                                { before: '处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}?ref=${Date.now()} ` }
                            ],
                            `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
                        );
                    } else if ('|8||9||10||11||12||13||14|'.includes(`|${optype}|`)) {
                        m = get_markdown_office(`该值班任务已被处理\r任务id：${taskid}\r任务类型：处理举报消息\r\r来源子频道：<#${msgb.channel_id}>\r\r>${answer}\r\r`,
                            [
                                { before: '举报人：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}` },
                                { before: '\r处理记录：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${midb}?ref=${Date.now()} ` }
                            ],
                            `处理人：${info.member_nick.replaceAll('@everyone', ' ')}`
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
                    let sendresult = await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: ret.tochannel, markdown: m, keyboard: { id: `${global.miniappconfig.keyboardtemplateC}` } });
                    if (sendresult && sendresult.id) {
                        if ('|8||9||10||11||12||13||14|'.includes(`|${optype}|`)) {
                            try {
                                await client.messageApi.deleteMessage(ret.tochannel, msgb.tid, true);
                            } catch (err) { }
                            await HistoryMessage_addid(midb, sendresult.id);
                            await HistoryMessage_adddeallog(midb, info.member_head, info.member_userid, info.member_nick, deal);
                        } else {
                            try {
                                await client.messageApi.deleteMessage(ret.tochannel, msga.tid, true);
                            } catch (err) { }
                            await HistoryMessage_addid(mida, sendresult.id);
                            await HistoryMessage_adddeallog(mida, info.member_head, info.member_userid, info.member_nick, deal);
                        }
                    }
                }

                await delofficetask(info.open_guild_id, taskid, '1');

                return { errcode: 0, errmsg: 'ok' };

            } else {
                return { errcode: 403, errmsg: '无权限' };
            }
        } else {
            return { errcode: 407, errmsg: '频道主未开启该功能' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchforbidenwordsdb(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if(!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let gsets = await readguildsets(info.open_guild_id);
        if (!gsets || !gsets.points) return { errcode: 0, errmsg: 'ok', cnt: 0 };
        let ret = await getforbidenwordsdb_self(gsets.points);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delforbidenwordsdb(data) {
    let token = data.token;
    let id = data.id;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let ret = await delfwordsdb(info.member_userid, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 403, errmsg: '无权限' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function forbidenwordsdbwr(data) {
    let token = data.token;
    let id = data.id;
    let s = data.data;
    if (!id) { //创建
        let info = await check_permision(token, '0');
        if (info) {
            let ret = await fwordsdbup(id, info.member_userid, s.dbdesc, info.member_nick, info.member_head, s.words);
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            }
            return { errcode: 402, errmsg: '修改出错' };
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else { //编辑
        let check = await ifhas_qqapplication(token);
        if (check[0]) {
            let info = check[1][0];
            let ret = await fwordsdbup(id, info.member_userid, s.dbdesc, info.member_nick, info.member_head, s.words);
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            }
            return { errcode: 403, errmsg: '无权限' };
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    }
    
}

export async function fetch_guildsnew(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.openid) return { errcode: 403, errmsg: '无权限' };
        let ret = await readusersguilds(info.openid);
        return { errcode: 0, errmsg: 'ok', cnt: ret.length, rows: ret };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function transport_points_guild(data) {
    let token = data.token;
    let ls = data.data;
    if (!ls.cnt || isNaN(ls.cnt)) return { errcode: 511, errmsg: '积分数量必须大于0' };
    ls.cnt = Number(ls.cnt.toFixed(0));
    if (ls.cnt <= 0) return { errcode: 511, errmsg: '积分数量必须大于0' };
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };
        let reta = await _getGpoints(ls.fromg);
        let retb = await _getGpoints(ls.tog);
        if (reta && retb) {
            let arra = reta.rows.filter(i => {
                return i.point_name == ls.name;
            });
            let arrb = retb.rows.filter(i => {
                return i.point_name == ls.name;
            })
            if (arra.length > 0 && arrb.length > 0) {
                if (arra[0].canleave != '1') return { errcode: 512, errmsg: '来源频道禁止跨频转出该类型积分' };
                if (arrb[0].canenter != '1') return { errcode: 512, errmsg: '目标频道禁止跨频转入该类型积分' };
                if (!arrb[0].guilds || !arrb[0].guilds.includes(`|${ls.fromg}|`)) return { errcode: 512, errmsg: '积分来源频道不在目标频道的跨频转入白名单内' };

                let levelneed;
                if (arra[0].leave_rate > 0) {
                    levelneed = ls.cnt * arra[0].leave_rate / 10000;
                    if (levelneed < 1) levelneed = 1;
                    levelneed = Number(levelneed.toFixed(0));
                } else {
                    levelneed = 0;
                }

                let enterneed;
                if (arrb[0].enter_rate > 0) {
                    enterneed = ls.cnt * arrb[0].enter_rate / 10000;
                    if (enterneed < 1) enterneed = 1;
                    enterneed = Number(enterneed.toFixed(0));
                } else {
                    enterneed = 0;
                }

                if (ls.cnt - enterneed <= 0) {
                    return { errcode: 513, errmsg: `转账金额过小，无法支付目标频道的跨频转入手续费${enterneed}` };
                }

                let deret = await user_points_change(ls.fromg, info.member_userid, arra[0].point_id, -1 * (ls.cnt + levelneed), info.member_head, info.member_nick);
                if (deret === false) {
                    return { errcode: 514, errmsg: `您的余额不足，无法支付跨频转出的金额${ls.cnt}及转出手续费${levelneed}` };
                } else {
                    await addpointchangelog(ls.fromg, info.member_userid, arra[0].point_id, -1 * ls.cnt, '跨频转出', info.member_userid, info.member_nick, info.member_head);
                    await addpointchangelog(ls.fromg, info.member_userid, arra[0].point_id, -1 * levelneed, '跨频转出手续费', info.member_userid, info.member_nick, info.member_head);
                }

                let addret = await user_points_change(ls.tog, info.member_userid, arrb[0].point_id, 1 * (ls.cnt - enterneed), info.member_head, info.member_nick);
                if (addret === false) {
                    return { errcode: 515, errmsg: '系统错误，目标频道接收转账失败' };
                } else {
                    await addpointchangelog(ls.tog, info.member_userid, arrb[0].point_id, ls.cnt, '跨频转入', info.member_userid, info.member_nick, info.member_head);
                    await addpointchangelog(ls.tog, info.member_userid, arrb[0].point_id, -1 * enterneed, '跨频转入手续费', info.member_userid, info.member_nick, info.member_head);
                    return { errcode: 0, errmsg: 'ok', enter: enterneed, level: levelneed };
                }

            }
        }
        return { errcode: 510, errmsg: '来源频道或目标频道无对应积分类型' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchGpoints_byid(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (data.guildid == 'self') data.guildid = info.open_guild_id;
        let ret = await _getGpoints(data.guildid);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchuserpoints(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let ret = await read_user_points(info.open_guild_id, info.member_userid);
        if (!ret) ret = [];
        return { errcode: 0, errmsg: 'ok', cnt: ret.length, rows: ret };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function transport_point_point(data) {
    let token = data.token;
    let ls = data.data;
    if (!ls.cnt || isNaN(ls.cnt)) return { errcode: 511, errmsg: '积分数量必须大于0' };
    ls.cnt = Number(ls.cnt.toFixed(0));
    if (ls.cnt <= 0) return { errcode: 511, errmsg: '积分数量必须大于0' };
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };
        let reta = await _getGpoints(info.open_guild_id);
        if (reta) {
            let arra = reta.rows.filter(i => {
                return i.point_id == ls.fromp;
            });
            let arrb = reta.rows.filter(i => {
                return i.point_id == ls.top;
            })
            if (arra.length > 0 && arrb.length > 0) {
                if (arra[0].canchangeleave != '1') return { errcode: 512, errmsg: '来源积分类型禁止被转换转出' };
                if (arrb[0].canchangeenter != '1') return { errcode: 512, errmsg: '目标积分类型禁止被转换转入' };

                let levelneed;
                if (arra[0].changeleave_rate > 0) {
                    levelneed = ls.cnt * arra[0].changeleave_rate / 10000;
                    if (levelneed < 1) levelneed = 1;
                    levelneed = Number(levelneed.toFixed(0));
                } else {
                    levelneed = 0;
                }

                let enterneed;
                if (arrb[0].changeenter_rate > 0) {
                    enterneed = ls.cnt * arrb[0].changeenter_rate / 10000;
                    if (enterneed < 1) enterneed = 1;
                    enterneed = Number(enterneed.toFixed(0));
                } else {
                    enterneed = 0;
                }

                if (ls.cnt - enterneed <= 0) {
                    return { errcode: 513, errmsg: `转账金额过小，无法支付目标积分类型的转换转入手续费${enterneed}` };
                }

                let deret = await user_points_change(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * (ls.cnt + levelneed), info.member_head, info.member_nick);
                if (deret === false) {
                    return { errcode: 514, errmsg: `您的余额不足，无法支付来源积分的转换转出金额${ls.cnt}及转换转出手续费${levelneed}` };
                } else {
                    await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * ls.cnt, '转换转出', info.member_userid, info.member_nick, info.member_head);
                    await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * levelneed, '转换转出手续费', info.member_userid, info.member_nick, info.member_head);
                }

                let addret = await user_points_change(info.open_guild_id, info.member_userid, arrb[0].point_id, 1 * (ls.cnt - enterneed), info.member_head, info.member_nick);
                if (addret === false) {
                    return { errcode: 515, errmsg: '系统错误，目标积分类型接收转账失败' };
                } else {
                    await addpointchangelog(info.open_guild_id, info.member_userid, arrb[0].point_id, ls.cnt, '转换转入', info.member_userid, info.member_nick, info.member_head);
                    await addpointchangelog(info.open_guild_id, info.member_userid, arrb[0].point_id, -1 * enterneed, '转换转入手续费', info.member_userid, info.member_nick, info.member_head);
                    return { errcode: 0, errmsg: 'ok', enter: enterneed, level: levelneed };
                }

            }
        }
        return { errcode: 510, errmsg: '当前频道无对应积分类型' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_useraddress(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.openid) return { errcode: 403, errmsg: '无权限' };
        let ret = await readusersaddress(info.openid);
        return { errcode: 0, errmsg: 'ok', cnt: ret.length, rows: ret };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upuseraddress(data) {
    let token = data.token;
    let ls = data.data;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.openid) return { errcode: 403, errmsg: '无权限' };
        let ret = await uaddressup(info.openid, JSON.stringify(ls));
        if (!ret) return { errcode: 511, errmsg: 'fail' };
        return { errcode: 0, errmsg: 'ok' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_shopinfo(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let ret = await _getshopinfo(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        }
        return { errcode: 402, errmsg: 'fail' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function Goodsinfoswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await GgoodsinfoUp(info.open_guild_id, s.id, s);
        if (ret !== false) {
            return { errcode: 0, errmsg: 'ok', id: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchchannelgoods(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getchannelgoods(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delchannelgoods(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await _delchannelgoods(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 402, errmsg: 'fail' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchgoodscards(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await getgoodscards(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function uploadgoodscards(data) {
    let token = data.token;
    let id = data.id;
    let s = data.data.rows;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await GgoodscardsUp(info.open_guild_id, id, s);
        if (ret !== false) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function editonegoodscards(data) {
    let token = data.token;
    let id = data.id;
    let op = data.op;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await Gcardssafeupone_admin(info.open_guild_id, id, op);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function editallgoodscards(data) {
    let token = data.token;
    let id = data.id;
    let op = data.op;
    let info = await check_permision(token, 44);
    if (info) {
        let ret = await Gcardssafeupall_admin(info.open_guild_id, id, op);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function editonedbcards(data) {
    let token = data.token;
    let id = data.id;
    let op = data.op;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await Gcardsdbsafeupone_admin(info.open_guild_id, id, op);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function editalldbcards(data) {
    let token = data.token;
    let id = data.id;
    let op = data.op;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await Gcardsdbsafeupall_admin(info.open_guild_id, id, op);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function historygoodslogs(data) {
    let token = data.token;
    let page = data.page;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await s_getgoodshistory(info.open_guild_id, info.member_userid, page, data.isall == '1', data.isfinish);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function hassendgoods(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 47);
    if (info) {
        let ret = await hassendgoodslog(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchguildcardsdb(data) {
    let token = data.token;
    let p = data.p;
    let info = await check_permision(token, Number(p));
    if (info) {
        let ret = await getguildcardsdb(info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delguildcardsdb(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await _delguildcardsdb(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 402, errmsg: 'fail' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function Cardsdbinfoswr(data) {
    let token = data.token;
    let p = data.p;
    let s = data.data;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await CardsdbinfoUp(info.open_guild_id, s.id, s);
        if (ret !== false) {
            return { errcode: 0, errmsg: 'ok', id: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function uploaddbcards(data) {
    let token = data.token;
    let id = data.id;
    let s = data.data.rows;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await GgoodsdbcardsUp(info.open_guild_id, id, s);
        if (ret !== false) {
            return { errcode: 0, errmsg: 'ok', cnt: ret };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchdbcards(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 45);
    if (info) {
        let ret = await getdbcards(info.open_guild_id, id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0 };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function gaingoods(data) {
    let token = data.token;
    let id = data.id;
    let s = data.data.address;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];

        let c = '';
        let finish = '0';
        let uinfo;
        try {
            let { data } = await client.guildApi.guildMember(info.open_guild_id, info.member_userid);
            if (data && data.roles && !data.user.bot) {
                uinfo = data;
            } else { }
        } catch (err) { }

        let gaincheck = await Ggoodssafegain(info.open_guild_id, id, info.member_userid, uinfo, s);
        if (gaincheck.errcode == 0) {
            let goodsinfo = gaincheck.goodsinfo;
            if (s) {
                c = `姓名：${s.name}\r\n电话：${s.phone}\r\n地址：${s.address}\r\n微信\QQ\邮箱\其他：${s.contact}`;
            }
            if (goodsinfo.type == '0') {//自定义
                //无操作
            } else if (goodsinfo.type == '1') {//身份组
                finish = '1';
                await client.memberApi.memberAddRole(info.open_guild_id, goodsinfo.roleid, info.member_userid);
                if (goodsinfo.rolesecs > 0) {
                    await write_exprole(info.open_guild_id, goodsinfo.roleid, info.member_userid, goodsinfo.rolesecs);
                } else {
                    await deltarget_exprole(info.open_guild_id, goodsinfo.roleid, info.member_userid);
                }
            } else if (goodsinfo.type == '2') {//兑换码
                c = '兑换码:' + gaincheck.errmsg + ' ' + c;
                finish = '1';
            } else if (goodsinfo.type == '3') {//补签卡
                c = '';
                finish = '1';
                await user_workcardschange(info.open_guild_id, info.member_userid, 1);
            } else {
                return { errcode: 402, errmsg: '未知类型礼品，已销毁' };
            }
            await addgoodslog(info.open_guild_id, goodsinfo.id, goodsinfo.type, goodsinfo.name, goodsinfo.image, goodsinfo.pointcnt, goodsinfo.point_name, info.member_userid, info.member_nick, info.member_role, info.member_head, finish, c);
            if (goodsinfo.type == '0') return { errcode: 0, errmsg: `兑换成功，请等待管理处理发货` };
            if (goodsinfo.type == '1') return { errcode: 0, errmsg: `兑换成功，获得身份组【${goodsinfo.rolename}】${goodsinfo.rolesecs <= 0 ? '' : longtime2s(goodsinfo.rolesecs * 1000)}` };
            if (goodsinfo.type == '2') return { errcode: 0, errmsg: `兑换成功，获得兑换码：\r\n${gaincheck.errmsg}\r\n已复制到剪贴板\r\n您也可以在 '已发礼品' 当中找到兑换码记录\r\n注意！礼品记录只会保留七天，请妥善保管兑换码`, extinfo: gaincheck.errmsg };
            if (goodsinfo.type == '3') return { errcode: 0, errmsg: `兑换成功，获得1张补签卡` };
        } else {
            return gaincheck;
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function onworklists(data) {
    let token = data.token;
    let page = data.page;
    let order = data.order;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await getonworklist(info.open_guild_id, order, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function upointslist(data) {
    let token = data.token;
    let page = data.page;
    let id = data.id;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await getupointslist(info.open_guild_id, id, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function delallpoints(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 46);
    if (info) {
        let ret = await user_points_delall(info.open_guild_id, id);
        if (ret) {
            await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, { log: `清空全员积分,id:${id}` });
            await addpointchangelog(info.open_guild_id, 0, id, -9999, '管理员手动清空全员积分', info.member_userid, info.member_nick, info.member_head);
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upointschangelogs(data) {
    let token = data.token;
    let page = data.page;
    let user = data.user;
    let id = data.id;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let canview = false;
        if (info.member_role == '2' || info.member_userid == user) {
            canview = true;
        } else {
            let permissions = await getPermissions(info.open_guild_id, info.member_userid);
            if (permissions) {
                if (hasPermission(permissions, 46)) {
                    canview = true;
                }
            }
        }
        if (!canview) return { errcode: 403, errmsg: '无权限' }
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await getupointschangelogs(info.open_guild_id, user, id, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function changeuserpoint(data) {
    let token = data.token;
    let id = data.id;
    let user = data.user;
    let amount = Math.floor(data.amount);
    if (isNaN(amount) || amount < 0) amount = 0;
    let info = await check_permision(token, 46);
    if (info) {
        let changecnt = await user_points_change_fix(info.open_guild_id, user, id, amount);
        if (changecnt === false) {
            return { errcode: 402, errmsg: '修改出错' };
        } else {
            await addpointchangelog(info.open_guild_id, user, id, changecnt, '管理手动修改积分', info.member_userid, info.member_nick, info.member_head);
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getpointtaskinfo(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 46);
    if (info) {
        let ret = await getupointstaskinfo(info.open_guild_id, id);
        return { errcode: 0, errmsg: 'ok', data: ret };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function savepointtaskinfo(data) {
    let token = data.token;
    let id = data.id;
    let s = data.data;
    let info = await check_permision(token, 46);
    if (info) {
        let ret = await writepointtask(info.open_guild_id, id, s);
        if (ret) {
            await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, { log: `修改积分定时任务,id:${id}` });
            return { errcode: 0, errmsg: 'ok' };
        } else {
            return { errcode: 402, errmsg: '错误' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchforbidenwordsdbbyid(data) {
    let token = data.token;
    let id = data.id;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '登录不成功' };
        let ret = await getforbidenwordsdbbyid(id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', ...ret };
        } else {
            return { errcode: 502, errmsg: 'empty'};
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchuserpointsbank(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        let ret = await read_user_pointsbank(info.open_guild_id, info.member_userid);
        if (!ret) ret = [];
        return { errcode: 0, errmsg: 'ok', cnt: ret.length, rows: ret };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function transport_point_bank(data) {
    let token = data.token;
    let ls = data.data;
    if (!ls.cnt || isNaN(ls.cnt)) return { errcode: 511, errmsg: '积分数量必须大于0' };
    ls.cnt = Number(ls.cnt.toFixed(0));
    if (ls.cnt <= 0) return { errcode: 511, errmsg: '积分数量必须大于0' };
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };
        let reta = await _getGpoints(info.open_guild_id);
        if (reta) {
            let arra = reta.rows.filter(i => {
                return i.point_id == ls.fromp;
            });
            if (arra.length > 0) {
                if (arra[0].bank != '1' && ls.type == 'in') return { errcode: 512, errmsg: '该积分已不再允许存入银行' };

                let levelneed;
                if (arra[0].bankleaverate > 0 && ls.type == 'out') {
                    levelneed = ls.cnt * arra[0].bankleaverate / 10000;
                    if (levelneed < 1) levelneed = 1;
                    levelneed = Number(levelneed.toFixed(0));
                } else {
                    levelneed = 0;
                }

                let enterneed;
                if (arra[0].bankenterrate > 0 && ls.type == 'in') {
                    enterneed = ls.cnt * arra[0].bankenterrate / 10000;
                    if (enterneed < 1) enterneed = 1;
                    enterneed = Number(enterneed.toFixed(0));
                } else {
                    enterneed = 0;
                }

                if (ls.type == 'out') { //取出
                    if (ls.cnt - levelneed <= 0) {
                        return { errcode: 513, errmsg: `变更金额过小，无法支付积分银行取出手续费${levelneed}` };
                    }
                }
                
                if (ls.type == 'in') {
                    let deret = await user_points_change(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * (ls.cnt + enterneed), info.member_head, info.member_nick);
                    if (deret === false) {
                        return { errcode: 514, errmsg: `您的余额不足，无法支付积分存入金额${ls.cnt}及银行存入手续费${enterneed}` };
                    } else {
                        await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * ls.cnt, '存入银行', info.member_userid, info.member_nick, info.member_head);
                        await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * enterneed, '银行存入手续费', info.member_userid, info.member_nick, info.member_head);
                        let addret = await user_pointsbank_change(info.open_guild_id, info.member_userid, arra[0].point_id, 1 * ls.cnt);
                        if (addret === false) {
                            return { errcode: 515, errmsg: '系统错误，积分转入失败' };
                        } else {
                            return { errcode: 0, errmsg: 'ok' };
                        }
                    }
                }

                if (ls.type == 'out') {
                    let deret = await user_pointsbank_change(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * ls.cnt);
                    if (deret === false) {
                        return { errcode: 514, errmsg: `您的银行余额不足，无法支付积分取出金额${ls.cnt}` };
                    } else {
                        let addret = await user_points_change(info.open_guild_id, info.member_userid, arra[0].point_id, 1 * (ls.cnt - levelneed), info.member_head, info.member_nick);
                        if (addret === false) {
                            return { errcode: 515, errmsg: '系统错误，积分转出失败' };
                        } else {
                            await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, ls.cnt, '银行取出', info.member_userid, info.member_nick, info.member_head);
                            await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * levelneed, '银行取出手续费', info.member_userid, info.member_nick, info.member_head);
                            return { errcode: 0, errmsg: 'ok' };
                        }
                    }
                }

            }
        }
        return { errcode: 510, errmsg: '当前频道无对应积分类型' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function userpointsbankgain(data) {
    let token = data.token;
    let id = data.id;
    let scheck = await ifhas_qqapplication(token);
    if (scheck[0]) {
        let info = scheck[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };
        let ret = await read_user_pointsbank(info.open_guild_id, info.member_userid);
        if (!ret || ret.length <= 0) return { errcode: 511, errmsg: '您还没有任何银行资产' };
        let check = ret.filter(i => { return i.point_id == id });
        if (!check || check.length < 1) return { errcode: 511, errmsg: '您的银行资产内还没有该积分' };
        let lasttime = check[0].lasttime;
        let points = check[0].points;
        let diff = getTimestampDiffin(lasttime);
        if (diff < 1) return { errcode: 511, errmsg: '当前还未产生收益' };
        let reta = await _getGpoints(info.open_guild_id);
        if (reta) {
            let arra = reta.rows.filter(i => {
                return i.point_id == id;
            });
            if (arra && arra.length >= 1) {
                let cnt = points * diff * arra[0].bankrate / 10000;
                if (cnt < 1) return { errcode: 511, errmsg: '当前还未产生收益' };
                cnt = Number(cnt.toFixed(0));

                let levelneed;
                if (arra[0].bankleaverate > 0) {
                    levelneed = cnt * arra[0].bankleaverate / 10000;
                    if (levelneed < 1) levelneed = 1;
                    levelneed = Number(levelneed.toFixed(0));
                } else {
                    levelneed = 0;
                }

                if (cnt - levelneed <= 0) {
                    return { errcode: 513, errmsg: `当前收益金额过小，无法支付积分银行取出手续费${levelneed}` };
                }

                let deret = await user_pointsbank_change(info.open_guild_id, info.member_userid, arra[0].point_id, 0);
                if (deret === false) {
                    return { errcode: 514, errmsg: `系统错误，收益取出失败` };
                } else {
                    let addret = await user_points_change(info.open_guild_id, info.member_userid, arra[0].point_id, 1 * (cnt - levelneed), info.member_head, info.member_nick);
                    if (addret === false) {
                        return { errcode: 515, errmsg: '系统错误，收益转出失败' };
                    } else {
                        await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, cnt, '手动领取银行收益', info.member_userid, info.member_nick, info.member_head);
                        await addpointchangelog(info.open_guild_id, info.member_userid, arra[0].point_id, -1 * levelneed, '银行取出手续费', info.member_userid, info.member_nick, info.member_head);
                        return { errcode: 0, errmsg: 'ok' };
                    }
                }

            }
        }
        return { errcode: 510, errmsg: '当前频道无对应积分类型' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function getPayProfileinfo(data) {
    let token = data.token;
    let url_slug = data.url_slug;
    let info = await check_permision(token, 50);
    if (info) {
        let ret = await global.Pay.GetProfile(url_slug);
        if (ret && ret.ec == 200) {
            return { errcode: 0, errmsg: 'ok', data: ret.data };
        }
        return { errcode: 402, errmsg: 'err'};
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetchgpaysets(data) {
    let token = data.token;
    let scheck = await ifhas_qqapplication(token);
    if (scheck[0]) {
        let info = scheck[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };

        try {
            let s1 = await get_EventsSets_back(info.open_guild_id, '用户赞助设置');
            if (!s1 || !s1[0]) return { errcode: 408, errmsg: '频道主未开启赞助功能' };
            s1 = s1[1][0];
            if (s1.useit != 'true') return { errcode: 408, errmsg: '频道主未开启赞助功能' };
            s1 = JSON.parse(s1.content);
            let s2 = await read_user_payinfo(info.open_guild_id, info.member_userid);
            if (s2) s2 = s2[0];
            return { errcode: 0, errmsg: 'ok', data: { s1: s1, s2: s2 } };
        } catch (err) {
            return { errcode: 402, errmsg: '系统错误，拉取信息失败' };
        }
       
    } else {
        return { errcode: 403, errmsg: '小程序未登录' };
    }
}

export async function willingpay(data) {
    let token = data.token;
    let ls = data.data;
    if (!ls.cnt || isNaN(ls.cnt)) return { errcode: 511, errmsg: '赞助金额必须大于0' };
    ls.cnt = Number(ls.cnt.toFixed(0));
    if (ls.cnt <= 0) return { errcode: 511, errmsg: '赞助金额必须大于0' };
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };
        if (ls.cnt < 5) return { errcode: 512, errmsg: '抱歉，由于爱发电平台限制，赞助金额至少为5' };

        let s1 = await get_EventsSets_back(info.open_guild_id, '用户赞助设置');
        if (!s1 || !s1[0]) return { errcode: 408, errmsg: '频道主未开启赞助功能' };
        s1 = s1[1][0];
        if (s1.useit != 'true') return { errcode: 408, errmsg: '频道主未开启赞助功能' };
        s1 = JSON.parse(s1.content);
        if (!s1.user_id) return { errcode: 408, errmsg: '当前频道还未正确设置收款的爱发电账号' };

        let s2 = await read_user_payinfo(info.open_guild_id, info.member_userid);
        if (s2) {
            s2 = s2[0];
            if (s2.out_trade_no && s2.out_trade_no != '') {
                return { errcode: 414, errmsg: 'not complete', data: s2 };
            }
        }

        let arra = false;
        let gainpoints = 0;
        if (ls.needp) {
            let reta = await _getGpoints(info.open_guild_id);
            if (reta) {
                arra = reta.rows.filter(i => {
                    return i.point_id == ls.id;
                });
                if (arra.length > 0) {
                    if (arra[0].sold != '1') return { errcode: 512, errmsg: '抱歉，当前频道赞助后无法获得此类型的积分回礼' };
                    if (ls.cnt < arra[0].limitamount_min || ls.cnt > arra[0].limitamount_max) return { errcode: 512, errmsg: `抱歉，当前频道设置赞助金额必须在 ${arra[0].limitamount_min}~${arra[0].limitamount_max} 范围内` };
                    gainpoints = Number((ls.cnt * arra[0].soldprice).toFixed(0));
                }
            }
            if (!arra) return { errcode: 408, errmsg: '当前频道不存在此积分类型' };
        }

        let tradeinfo = false;
        let amount = ls.cnt;
        if (s1.userpayfee) {
            amount = Number((amount / 0.94).toFixed(2));
        }

        if (ls.type == 0) {
            if (s1.alipay) {
                tradeinfo = await global.Pay.FetchAliPay(amount, '', s1.user_id);
            } else {
                return { errcode: 408, errmsg: '当前频道未开启此赞助通道' };
            }
        }

        if (ls.type == 1) {
            if (s1.alipay_web) {
                tradeinfo = await global.Pay.FetchAliPay_WEB(amount, '', s1.user_id);
            } else {
                return { errcode: 408, errmsg: '当前频道未开启此赞助通道' };
            }
        }

        if (ls.type == 2) {
            if (s1.wechat) {
                tradeinfo = await global.Pay.FetchWeChatPay(amount, '', s1.user_id);
            } else {
                return { errcode: 408, errmsg: '当前频道未开启此赞助通道' };
            }
        }

        if (tradeinfo) {
            await user_willingpayinfo_addt(info.open_guild_id, info.member_userid, tradeinfo.id, tradeinfo.url, info.member_head, info.member_nick, arra ? arra[0].point_id : '', arra ? gainpoints : 0, ls.cnt * 100);
            return { errcode: 0, errmsg: 'ok', info: tradeinfo, amount: amount };
        }

        return { errcode: 510, errmsg: '系统错误，请求赞助通路失败' };
    } else {
        return { errcode: 403, errmsg: '小程序未登录' };
    }
}

export async function willingpaycancle(data) {
    let token = data.token;
    let scheck = await ifhas_qqapplication(token);
    if (scheck[0]) {
        let info = scheck[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };

        let s2 = await read_user_payinfo(info.open_guild_id, info.member_userid);
        if (s2) {
            s2 = s2[0];
            if (s2.out_trade_no && s2.out_trade_no != '') {
                await global.Pay.CancleOrder(s2.out_trade_no);
            }
        }

        try {
            await user_willingpaycancle(info.open_guild_id, info.member_userid);
        } catch (err) { }
        return { errcode: 0, errmsg: 'ok' };

    } else {
        return { errcode: 403, errmsg: '小程序未登录' };
    }
}

export async function willingpayensure(data) {
    let token = data.token;
    let scheck = await ifhas_qqapplication(token);
    if (scheck[0]) {
        let info = scheck[1][0];
        if (!info.open_guild_id) return { errcode: 408, errmsg: '小程序未登录' };

        let s1 = await get_EventsSets_back(info.open_guild_id, '用户赞助设置');
        if (s1 && s1[0]) {
            s1 = s1[1][0];
        } else {
            s1 = false;
        }

        let s2 = await read_user_payinfo(info.open_guild_id, info.member_userid);
        if (s2) {
            s2 = s2[0];
            if (s2.out_trade_no && s2.out_trade_no != '') {
                let payret = await global.Pay.CheckOrder(s2.out_trade_no);
                if (payret.ec == 200) {
                    if (payret?.data?.order?.status == 2) {
                        if (s2.point_id && s2.point_cnt && s2.thisamount) {
                            let kret = await user_points_change(info.open_guild_id, info.member_userid, s2.point_id, s2.point_cnt, info.member_head, info.member_nick);
                            await user_willingpayensure(info.open_guild_id, info.member_userid);
                            if (s1 && s1.tochannel) {
                                await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: s1.tochannel, msg_id: await GetMid(info.open_guild_id, false), content: `感谢用户<@!${info.member_userid}> 向本频道赞助 ${(s2.thisamount / 100).toFixed(2)}￥` });
                            }
                            if (kret === false) {
                                return { errcode: 408, errmsg: '赞助频道成功，获取频道回礼失败' };
                            } else {
                                await addpointchangelog(info.open_guild_id, info.member_userid, s2.point_id, s2.point_cnt, '赞助频道回礼', info.member_userid, info.member_nick, info.member_head);
                                return { errcode: 0, errmsg: `赞助频道成功，获得频道回礼\r${s2.point_cnt}点` };
                            }
                        } else {
                            await user_willingpayensure(info.open_guild_id, info.member_userid);
                            if (s1 && s1.tochannel) {
                                await ext.SendMessage({ guild_id: info.open_guild_id, channel_id: s1.tochannel, msg_id: await GetMid(info.open_guild_id, false), content: `感谢用户<@!${info.member_userid}> 向本频道赞助 ${(s2.thisamount / 100).toFixed(2)}￥` });
                            }
                            return { errcode: 408, errmsg: '赞助频道成功，感谢您的支持' };
                        }
                    } else {
                        return { errcode: 408, errmsg: '当前赞助付款还未完成' };
                    }
                } else {
                    return { errcode: 408, errmsg: '查询当前赞助付款信息失败' };
                }
            }
        }

        return { errcode: 0, errmsg: '' };

    } else {
        return { errcode: 403, errmsg: '小程序未登录' };
    }
}

export async function changeuserpointbank(data) {
    let token = data.token;
    let id = data.id;
    let user = data.user;
    let amount = Math.floor(data.amount);
    if (isNaN(amount) || amount < 0) amount = 0;
    let info = await check_permision(token, 46);
    if (info) {
        let changecnt = await user_pointsbank_change_fix(info.open_guild_id, user, id, amount);
        if (changecnt === false) {
            return { errcode: 402, errmsg: '修改出错' };
        } else {
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function delallpointsbank(data) {
    let token = data.token;
    let id = data.id;
    let info = await check_permision(token, 46);
    if (info) {
        let ret = await user_pointsbank_delall(info.open_guild_id, id);
        if (ret) {
            await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, { log: `清空全员银行固定资产,id:${id}` });
            return { errcode: 0, errmsg: 'ok' };
        }
        return { errcode: 402, errmsg: '修改出错' };
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function upointslistbank(data) {
    let token = data.token;
    let page = data.page;
    let id = data.id;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await getupointslistbank(info.open_guild_id, id, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function uwillingpaylist(data) {
    let token = data.token;
    let page = data.page;

    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (page && !isNaN(page) && Number(page) >= 0) {
            let logs = await getuwillingpaylist(info.open_guild_id, page);
            if (logs) {
                return { errcode: 0, errmsg: 'ok', ...logs };
            }
        } else {
            return { errcode: 0, errmsg: 'ok', cnt: 0, rows: [] };
        }
        return { errcode: 402, errmsg: '拉取失败' };
    } else {
        return { errcode: 403, errmsg: '无权限' }
    }

}

export async function fetch_nowguilds(data) {
    let token = data.token;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await getnowguilds_p(page);
            if (ret) {
                return { errcode: 0, errmsg: 'ok', ...ret };
            } else {
                return { errcode: 0, errmsg: 'ok', cnt: 0 };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function op_pnowguilds(data) {
    let token = data.token;
    let op = data.op;
    let guildid = data.guildid;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 502, errmsg: '小程序未登录' };
        if (p_admins.includes(info.member_userid)) {
            let ret = await guildup_p(guildid, op);
            if (ret) {
                if (op == 'not') await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, { log: `封禁频道：${guildid}` });
                if (op == 'yes') await s_writelog(info.open_guild_id, info.member_userid, info.member_nick, info.member_head, info.member_role, { log: `解禁频道：${guildid}` });
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 502, errmsg: '存储错误' };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function fetch_pexpimgs(data) {
    let token = data.token;
    let page = data.page;
    if (isNaN(page) || page == '' || Number(page) < 0) page = '0';
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (p_admins.includes(info.member_userid)) {
            let ret = await getexpimgs_p(page);
            if (ret) {
                return { errcode: 0, errmsg: 'ok', ...ret };
            } else {
                return { errcode: 0, errmsg: 'ok', cnt: 0 };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function op_pexpimgs(data) {
    let token = data.token;
    let op = data.op;
    let hash = data.hash;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.open_guild_id) return { errcode: 502, errmsg: '小程序未登录' };
        if (p_admins.includes(info.member_userid)) {
            let ret = await expimgsup_p(hash, op, info.member_userid);
            if (ret) {
                return { errcode: 0, errmsg: 'ok' };
            } else {
                return { errcode: 502, errmsg: '存储错误' };
            }
        } else {
            return { errcode: 403, errmsg: '无权限' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}

export async function ad_gainGoods(data) {
    let token = data.token;
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (!info.openid || !info.open_guild_id) return { errcode: 403, errmsg: '无权限' };
        let days = 3;
        let ret = await gexptimeadd(days * 24 * 60 * 60 * 1000, info.open_guild_id);
        if (ret) {
            return { errcode: 0, errmsg: 'ok', days: days };
        } else {
            return { errcode: 501, errmsg: 'service err.' };
        }
    } else {
        return { errcode: 403, errmsg: '无权限' };
    }
}














































function get_template(name) {
    return path.join(dir, '..', '..', 'resource', 'template', name, `${name}.html`);
}

function getTimestampDiffin(time) {
    let givenDate = new Date(time);
    let currentDate = new Date();
    givenDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    let diffInMilliseconds = currentDate - givenDate;
    let diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    return diffInDays;
}

function Date_YMD() {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    let day = date.getDate();
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
}

function isTimeInRange(start, end) {
    let now = new Date();
    let startTime = new Date(now.toDateString() + ' ' + start);
    let endTime = new Date(now.toDateString() + ' ' + end);
    if (now >= startTime && now <= endTime) {
        return true;
    } else {
        return false;
    }
}

function longtime2s(time) {
    let ret = '';
    let d = Math.floor(time / (1000 * 60 * 60 * 24));
    if (d > 0) {
        ret += `${d.toFixed(0)}天`;
    }
    time -= d * (1000 * 60 * 60 * 24);
    let h = Math.floor(time / (1000 * 60 * 60));
    if (h > 0) {
        ret += `${h}小时`;
    }
    time -= h * (1000 * 60 * 60);
    let m = Math.floor(time / (1000 * 60));
    if (m > 0) {
        ret += `${m}分钟`;
    }
    time -= m * (1000 * 60);
    let s = Math.floor(time / 1000);
    if (s > 0) {
        ret += `${s}秒`;
    }
    time -= s * 1000;
    return ret;
}

function get_today_users(users) {
    if (!users.mention || !users.mentionusers) return '';
    /*
    let d = new Date().getDay();
    if (d == 0) return users.u7.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 1) return users.u1.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 2) return users.u2.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 3) return users.u3.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 4) return users.u4.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 5) return users.u5.map(i => { return `<@!${i.id}>` }).join(' ');
    if (d == 6) return users.u6.map(i => { return `<@!${i.id}>` }).join(' ');
    */
    return users.mentionusers.map(i => { return `<@!${i}>` }).join(' ');
}



//错误处理
async function decryptData(encryptedData, sessionKey, iv) {
    let sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    let ivBuffer = Buffer.from(iv, 'base64');
    let encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    let decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedDataBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function md5WithSalt(str, salt) {
    try {
        return new Promise((resolve, reject) => {
            crypto.scrypt(str, salt, 32, (err, key) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(key.toString('hex'));
                }
            });
        });
    } catch (err) {
        return '';
    }
}

async function read_historyMessage(mid) {
    let stmt = `SELECT content FROM HistoryMessages WHERE mid=?`;
    let rows = await new Promise((resolve, reject) => {
        global.global.pool_application.query(stmt, [mid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) {
        return false;
    } else {
        return rows[0].content;
    }
}

//错误处理

async function write_qqapplication(token, openid, session_key) {
    let stmt = 'INSERT INTO QQApplication VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE session_key=?,token=?,lastlogintime=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [token, openid, session_key, '', '', '', '', '', Date.now(), session_key, token, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function w_qqapplication_upguild(openid, open_guild_id, member_role, member_userid, member_nick, member_head) {
    let stmt = 'UPDATE QQApplication SET open_guild_id=?,member_role=?,member_userid=?,member_nick=?,member_head=?,lastlogintime=? WHERE openid=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [open_guild_id, member_role, member_userid, member_nick, member_head, Date.now(), openid], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function ref_qqapplication_logintime(openid) {
    let stmt = 'UPDATE QQApplication SET lastlogintime=? WHERE openid=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [Date.now(), openid], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

//0 普通成员 1 管理员 2 频道主
async function ifhas_qqapplication(token) {
    let stmt = 'SELECT openid,session_key,open_guild_id,member_role,member_userid,member_nick,member_head FROM QQApplication WHERE token=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [token], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) {
        return [false];
    } else {
        /*
        let guildid = rows[0].open_guild_id;
        if (guildid) {
            if (await check_isexpir(guildid)) {
                return [false];
            }
        }
        */
        return [true, rows];
    }
}

async function check_isexpir(guildid) {
    let ret = await readguildsets(guildid);
    if (guildid == global.miniappconfig.Auditguildid) return false;
    if (ret) {
        return ret.expiration_time < Date.now();
    }
    return true;
}

async function check_permision(token, pid) {
    let check = await ifhas_qqapplication(token);
    if (check[0]) {
        let info = check[1][0];
        if (info.member_role == '2') {
            return info;
        }
        if (pid == 0 || pid == 1) return false;
        let permissions = await getPermissions(info.open_guild_id, info.member_userid);
        if (permissions) {
            if (hasPermission(permissions, pid)) {
                return info;
            }
        }
        return false;
    }
    return false;
}

async function getPermissions(guildid, userid, save) {

    let check = await redis.get(`ZuCache:UPermission:${guildid}:${userid}`);
    if (check) {
        return check;
    }

    let stmt = 'SELECT permission FROM guild_users WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (rows && rows[0]) {

        if (save) {
            writePermissions(guildid, userid, '0');
        }
        await redis.set(`ZuCache:UPermission:${guildid}:${userid}`, rows[0].permission, 600);
        return rows[0].permission;
    }

    if (save) {
        writePermissions(guildid, userid, '0');
    }
    await redis.set(`ZuCache:UPermission:${guildid}:${userid}`, '0', 600);
    return '0';
}

async function writePermissions(guildid, userid, permissions) {

    let stmt = 'INSERT INTO guild_users VALUES (?,?,?) ON DUPLICATE KEY UPDATE permission=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, permissions, permissions], (err, ret) => {
            if (err) {
                reject(err);
            } else {
                resolve(ret);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret.affectedRows > 0) {
        await redis.del(`ZuCache:UPermission:${guildid}:${userid}`);
        return true;
    }

    return false;
}

async function _writePermissions(guildid, words, permissions) {
    let arr = [];
    let tarr = [];

    await redis.delBypattern(`ZuCache:UPermission:${guildid}:*`);

    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }
    
    for (let s of tarr) {
        let stmt = 'INSERT INTO guild_users (guildid,user_id,permission) VALUES ? ON DUPLICATE KEY UPDATE permission=VALUES(permission)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [s.map(i => { return [guildid, i, permissions] })], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    return true;
}

async function s_getlogs(guildid, page) {
    let stmt = 'SELECT * FROM systemlogs WHERE guildid=? ORDER BY time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function s_writelog(guildid, userid, usernick, userhead, userrole, log) {
    let stmt = 'INSERT INTO systemlogs VALUES (?,?,?,?,?,?,?)';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, usernick, userhead, userrole, Date.now(), log.log], (err, ret) => {
            if (err) {
                reject(err);
            } else {
                resolve(ret);
            }
        })
    }).catch(err => { console.error(err) });
    return ret && ret.affectedRows > 0;
}

function addPermission(p, k) {
    let binaryP = p.padStart(k + 1, '0');
    binaryP = binaryP.slice(0, binaryP.length - k - 1) + '1' + binaryP.slice(binaryP.length - k);
    return binaryP;
}

function removePermission(p, k) {
    let binaryP = p.padStart(k + 1, '0');
    binaryP = binaryP.slice(0, binaryP.length - k - 1) + '0' + binaryP.slice(binaryP.length - k);
    return binaryP;
}

function hasPermission(p, k) {
    let binaryP = p.padStart(k + 1, '0');
    return binaryP.slice(binaryP.length - k - 1, binaryP.length - k) == '1';
}

function timestamp2times(timestamp) {
    let date = new Date(parseInt(timestamp));
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function get_EventsSets(guildid, eventname) {

    let check = await redis.get(`ZuCache:EventsSetsIC:${guildid}:${eventname}`);
    if (check) {
        return JSON.parse(check);
    }

    let stmt = `SELECT fromchannel,tochannel,useit,image,content,name FROM EventsSets WHERE guildid=? AND name=?`;
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, eventname], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        await redis.set(`ZuCache:EventsSetsIC:${guildid}:${eventname}`, JSON.stringify([true, rows]), 300);
        return [true, rows];
    } else {
        await redis.set(`ZuCache:EventsSetsIC:${guildid}:${eventname}`, JSON.stringify([false]), 300);
        return [false];
    }
}

async function write_EventsSets(guildid, fromchannel, tochannel, eventname, useit, image, content) {

    if (useit == 'true') {
        let stmt = 'INSERT INTO EventsSets VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tochannel=?,useit=?,image=?,content=?,fromchannel=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, fromchannel, tochannel, eventname, useit, image, content, tochannel, useit, image, content, fromchannel], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            await redis.del(`ZuCache:EventsSetsIC:${guildid}:${eventname}`);
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'UPDATE EventsSets SET useit=? WHERE guildid=? AND name=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, ['false', guildid, eventname, fromchannel], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret.affectedRows > 0) {
            await redis.del(`ZuCache:EventsSetsIC:${guildid}:${eventname}`);
            return true;
        } else {
            return false;
        }
    }
}

async function check_ifneed_disban(guildid) {
    let sets = await get_EventsSets(guildid, '新人加入设置');
    if (sets[0]) {
        sets = sets[1][0];
        if (sets.useit == 'true') {
            if (sets.content != '') {
                let obj;
                try {
                    obj = JSON.parse(sets.content);
                } catch (err) { }
                if (obj) {
                    if (obj.autodisban) {
                        return obj.autodisban == true;
                    }
                }
            }
        }
    }
    return false;
}

async function getblacklist(guildid, page) {
    let stmt = 'SELECT * FROM blacklists WHERE guildid=?  ORDER BY last_black_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delblacklist(guildid, userids) {
    let stmt = 'DELETE FROM blacklists WHERE guildid=?  AND ? REGEXP user_id';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userids], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        await redis.del(`ZuCache:UserBlackList:${guildid}`);
        return true;
    }
    return false;
}

async function upblacklist(guildid, userids, isblack, reason, admin) {
    let stmt;
    let rows;
    if (isblack) {
        stmt = 'UPDATE blacklists SET is_black=?,black_reason=?,black_admin=?,last_black_time=? WHERE guildid=?  AND ? REGEXP user_id';
        rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [true, reason, admin, Date.now().toString(), guildid, userids], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
    } else {
        stmt = 'UPDATE blacklists SET is_black=?,deblack_reason=?,deblack_admin=? WHERE guildid=?  AND ? REGEXP user_id';
        rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [false, reason, admin, guildid, userids], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
    }
    if (rows && rows.affectedRows > 0) {
        await redis.del(`ZuCache:UserBlackList:${guildid}`);
        return true;
    }
    return false;
}

async function getforbidenwords(guildid, page) {
    let stmt = 'SELECT * FROM forbidden_words WHERE guildid=? ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delfwords(guildid, words) {

    await redis.del(`ZuCache:ForbiddenWordsSC:${guildid}`);

    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM forbidden_words WHERE guildid=?  AND keyword IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {
           
        } else {
            return false;
        }
    }

    return true;
}

async function fwordsup(keyword, guildid, enabled_channels, deal_type, op_time, editor, editornick, editorhead, notifytext, saferoles) {
    if (!saferoles) saferoles = '';
    let stmt = 'INSERT INTO forbidden_words VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE enabled_channels=?,deal_type=?,op_time=?,editor=?,edit_time=?,editornick=?,editorhead=?,notifytext=?,saferoles=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [keyword, guildid, enabled_channels, deal_type, op_time, editor, Date.now(), editornick, editorhead, notifytext, saferoles, enabled_channels, deal_type, op_time, editor, Date.now(), editornick, editorhead, notifytext, saferoles], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    await redis.del(`ZuCache:ForbiddenWordsSC:${guildid}`);

    return (ret && ret.affectedRows > 0) ? true : false;

}

async function getkeywords(guildid, page) {
    let stmt = 'SELECT * FROM reply_keywords_answers WHERE guildid=?  ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getkeywords_p(page) {
    let stmt = 'SELECT * FROM reply_keywords_answers WHERE approved=?  ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, ['on', Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delkwords(guildid, words) {

    await redis.del(`ZuCache:ReplayKeyWordsSC:${guildid}`);

    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM reply_keywords_answers WHERE guildid=?  AND id IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    await NewPPush(`以下关键词已被用户删除，id：${JSON.stringify(words)}`)
    return true;
}

async function kwordsup(keyword, guildid, enabled_channels, content, image, cd, editor, editornick, editorhead, id) {

    await redis.del(`ZuCache:ReplayKeyWordsSC:${guildid}`);

    if (id == '') {
        let rid = 0;
        let stmt = 'INSERT INTO reply_keywords_answers VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [rid, guildid, enabled_channels, keyword, content, image, cd, editor, Date.now(), editornick, editorhead, 'on'], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            await NewPPush(`有新的关键词待审核，id：${ret.insertId}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/keywords_p/keywords_p?guildID=${global.miniappconfig.officialguildid}`)
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'UPDATE reply_keywords_answers SET enabled_channels=?,keyword=?,content=?,image=?,cd=?,editor=?,edit_time=?,editornick=?,editorhead=?,approved=? WHERE guildid=? AND id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [enabled_channels, keyword, content, image, cd, editor, Date.now(), editornick, editorhead, 'on', guildid, id], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            await NewPPush(`有新的关键词待审核，id：${id}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/keywords_p/keywords_p?guildID=${global.miniappconfig.officialguildid}`)
            return true;
        } else {
            return false;
        }
    }
}

async function kwordsup_p(words, op, userid) {

    await redis.delBypattern(`ZuCache:ReplayKeyWordsSC:*`);

    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'UPDATE reply_keywords_answers SET approved=? WHERE id IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [op, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }

    await NewPPush(`下列关键词被审批为${op == 'yes' ? '通过' : '不通过'}\rid：${JSON.stringify(words)}\r审核人：${userid}`);
    return true;
}

async function readguildsets(guildid) {

    let check = await redis.get(`ZuCache:GuildSetsInfoC:${guildid}`);
    if (check) {
        return JSON.parse(check);
    }

    let stmt = 'SELECT * FROM Guilds WHERE guildid = ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, guildid, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) {
        let ret = await new Promise((resolve, reject) => {
            let stmt = 'INSERT INTO Guilds VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE expiration_time=?,sets=?,points=?';
            global.pool_application.query(stmt, [guildid, Date.now() + 604800000, JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), '', '', '', Date.now() + 604800000, JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), '[]'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            await redis.set(`ZuCache:GuildSetsInfoC:${guildid}`, JSON.stringify({ guildid: guildid, expiration_time: Date.now() + 604800000, sets: JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), head: '', name: '', points: '' }), 300);
            return { guildid: guildid, expiration_time: Date.now() + 604800000, sets: JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), head: '', name: '', points: '' };
        } else {
            return false;
        }
    }
    await redis.set(`ZuCache:GuildSetsInfoC:${guildid}`, JSON.stringify(rows[0]), 300);
    return rows[0];
}

async function check_ifhas_guild(guildid) {

    let check = await redis.get(`ZuCache:GuildSetsInfoC:${guildid}`);
    if (check) {
        return true;
    }

    let stmt = 'SELECT * FROM Guilds WHERE guildid = ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, guildid, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) {
        return false;
    }
    return true;
}

async function mqupguildsets(guildid, sets) {
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query('UPDATE Guilds SET sets=? WHERE guildid=?', [JSON.stringify(sets), guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        await redis.del(`ZuCache:GuildSetsInfoC:${guildid}`);
        return true;
    } else {
        return false;
    }
}

async function mqupguildinfo(guildid, head, name, owner) {
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query('UPDATE Guilds SET head=?,name=?,points=? WHERE guildid=?', [head, name, owner, guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        await redis.del(`ZuCache:GuildSetsInfoC:${guildid}`);
        return true;
    } else {
        return false;
    }
}

async function getupoints(guildid, user_id) {
    let stmt = 'SELECT points,warning_counts,workdays,cot_workdays FROM guild_users_points WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) return { points: 0, warning_counts: 0, workdays: 0, cot_workdays: 0 };
    return rows[0];
}

async function getforbidenwords_nick(guildid, page) {
    let stmt = 'SELECT * FROM forbidden_words_nick WHERE guildid=?  ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delfwords_nick(guildid, words) {

    await redis.del(`ZuCache:ForbiddenWordsNickSC:${guildid}`);

    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM forbidden_words_nick WHERE guildid=?  AND keyword IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    return true;
}

async function fwordsup_nick(keyword, guildid, deal_type, editor, editornick, editorhead) {

    await redis.del(`ZuCache:ForbiddenWordsNickSC:${guildid}`);

    let stmt = 'INSERT INTO forbidden_words_nick VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE deal_type=?,editor=?,edit_time=?,editornick=?,editorhead=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [keyword, guildid, deal_type, editor, Date.now(), editornick, editorhead, deal_type, editor, Date.now(), editornick, editorhead], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return (ret && ret.affectedRows > 0) ? true : false;
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
        global.global.pool_application.query(stmt, p, (err, rows) => {
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

async function NewPPush(content) {
    let id = await GetMid(global.miniappconfig.officialguildid, false);
    await ext.SendMessage({ guild_id: global.miniappconfig.officialguildid, channel_id: global.miniappconfig.channelB, msg_id: id, content: content });
}

async function NewTPush(content) {
    let id = await GetMid(global.miniappconfig.officialguildid, false);
    await ext.SendMessage({ guild_id: global.miniappconfig.officialguildid, channel_id: global.miniappconfig.channelA, msg_id: id, content: content });
}

async function NewIPush(content) {
    let id = await GetMid(global.miniappconfig.officialguildid, false);
    await ext.SendMessage({ guild_id: global.miniappconfig.officialguildid, channel_id: global.miniappconfig.channelC, msg_id: id, content: content });
}

async function fetchtask__(guildid) {
    let stmt = 'SELECT * FROM TasksListK WHERE guildid=? AND id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function fetchtask_(page) {
    let stmt = 'SELECT * FROM TasksListK WHERE task_type=? ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [1, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function _fetchtask_(guildid, page) {
    let stmt = 'SELECT * FROM TasksListK WHERE guildid=? AND id!=? ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function savetask_banspeak(guildid, data, editornick, editorhead) {
    let type = '1';
    if (!data.tochannel || data.useit == '0') type = '0';
    if (!data.image && !data.content) type = '0';
    if (!data.editor) data.editor = '21600';
    let stmt = 'INSERT INTO TasksListK VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE cron=?,tochannel=?,content=?,image=?,useit=?,editor=?,edit_time=?,editornick=?,editorhead=?,task_type=?,markdown=?,imgtextdp=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, guildid, data.cron, data.tochannel, data.content, data.image, data.useit, data.editor, Date.now(), editornick, editorhead, type, data.markdown || '0', data.imgtextdp || '0', data.cron, data.tochannel, data.content, data.image, data.useit, data.editor, Date.now(), editornick, editorhead, type, data.markdown || '0', data.imgtextdp || '0'], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        let id = `${guildid}`;
        global._messageque.add('cancelschedule', {
            id: id
        });
        if (type == '1') {
            await NewTPush(`有新的定时任务待审核，id：${id}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/pushmessageontime_p/pushmessageontime_p?guildID=${global.miniappconfig.officialguildid}`)
        } else {
            await NewTPush(`以下定时任务已被系统自动过审，id：${id}`)
            if (data.useit == '1') {
                await startOnetask({ ...data, id: id, guildid: guildid, task_type: type });
            }
        }
        return true;
    } else {
        return false;
    }
}

async function tasksup_p(words, op, userid) {
    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'UPDATE TasksListK SET task_type=? WHERE id IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [op, s.map(i => { return i.id })], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {
            for (let ss of s) {
                global._messageque.add('cancelschedule', {
                    id: ss.id
                });
                if (ss.useit == '1' && op == '0') {
                    await startOnetask({ ...ss, task_type: '0' });
                }
            }
        } else {
            return false;
        }
    }
    await NewTPush(`下列定时任务已被审批为${op == '0' ? '通过' : '不通过'}\rid：${JSON.stringify(words.map(i => { return i.id }))}\r审核人：${userid}`);
    return true;
}

async function startOnetask(s) {

    global._messageque.add('schedule', {
        id: s.id,
        rule: s.cron,
        s: s
    });

}

async function deltasks_(guildid, words) {
    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM TasksListK WHERE guildid=?  AND id IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {
            for (let ss of s) {

                global._messageque.add('cancelschedule', {
                    id: ss
                });
            }
        } else {
            return false;
        }
    }
    await NewTPush(`以下定时任务已被用户删除，id：${JSON.stringify(words)}`)
    return true;
}

async function _tasksup(guildid, data, editornick, editorhead, id) {

    let type = '1';
    if (data.useit == '0') type = '0';

    if (id == '') {
        let rid = await GetLid();
        if (rid == -1) return false;
        let stmt = 'INSERT INTO TasksListK VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [rid, guildid, data.cron, data.tochannel, data.content, data.image, data.useit, '', Date.now(), editornick, editorhead, type, data.markdown || '0', data.imgtextdp || '0'], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            if (type == '1') {
                await NewTPush(`有新的定时任务待审核，id：${rid}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/pushmessageontime_p/pushmessageontime_p?guildID=${global.miniappconfig.officialguildid}`)
            } else {
                await NewTPush(`以下定时任务已被系统自动过审，id：${rid}`)
            }
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'UPDATE TasksListK SET cron=?,tochannel=?,content=?,image=?,useit=?,editor=?,edit_time=?,editornick=?,editorhead=?,task_type=?,markdown=?,imgtextdp=? WHERE guildid=? AND id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [data.cron, data.tochannel, data.content, data.image, data.useit, data.editor, Date.now(), editornick, editorhead, type, data.markdown || '0', data.imgtextdp || '0', guildid, id], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {

            global._messageque.add('cancelschedule', {
                id: id
            });

            if (type == '1') {
                await NewTPush(`有新的定时任务待审核，id：${id}\rhttps://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=pages/functions/pushmessageontime_p/pushmessageontime_p?guildID=${global.miniappconfig.officialguildid}`)
            } else {
                await NewTPush(`以下定时任务已被系统自动过审，id：${id}`)
                if (data.useit == '1') {
                    await startOnetask({ ...data, id: id, guildid: guildid, task_type: type });
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

async function s_getlogs_my(guildid, userid, page) {
    let stmt = 'SELECT * FROM systemlogs WHERE guildid=? AND userid=? ORDER BY time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getkeywords_lc(guildid, page) {
    let stmt = 'SELECT * FROM reply_keywords ORDER BY edit_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        lightcute.query(stmt, [Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delkwords_lc(guildid, words) {
    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM reply_keywords WHERE keyword IN (?)';
        let rows = await new Promise((resolve, reject) => {
            lightcute.query(stmt, [s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    return true;
}

async function refkwords_lc(guildid, words) {
    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'UPDATE reply_keywords SET edit_time=? WHERE keyword IN (?)';
        let rows = await new Promise((resolve, reject) => {
            lightcute.query(stmt, [Date.now(), s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    return true;
}

async function getCsets_lc_(guildid) {
    let stmt = 'SELECT china_channel,abroad_channel,ka,kb FROM Guilds WHERE guildid=?';
    let rows = await new Promise((resolve, reject) => {
        lightcute.query(stmt, [guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) return { china_channel: '', abroad_channel: '' };
    return rows[0];
}

async function savesets_LC_(guildid, sets) {
    let stmt = `UPDATE Guilds SET abroad_channel=?,china_channel=?,ka=?,kb=? WHERE guildid=?`;
    let ret = await new Promise((resolve, reject) => {
        lightcute.query(stmt, [sets.abroad_channel, sets.china_channel, sets.ka, sets.kb, guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err); });

    return ret && ret.affectedRows > 0;
}

async function getimageinfo(link) {
    let sp = link;
    let check = sp.match(/\/img\/(.*)/);
    if (check && check[1]) {
        if (check[1].length < 16) {
            return { width: 1920, height: 640 }
        }
        let cache = await fetch_imginfo(check[1]);
        if (cache) {
            return cache;
        }
    }
    return false;
}

async function write_exprole(guildid, role_id, user_id, seconds) {
    let stmt = 'INSERT INTO ExpRoles VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE exp_time=IF(exp_time<?,?,exp_time+?)';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, role_id, user_id, Date.now() + seconds * 1000, Date.now(), Date.now() + seconds * 1000, seconds * 1000], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function write_exprole_change(guildid, role_id, user_id, seconds) {
    let stmt = 'INSERT INTO ExpRoles VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE exp_time=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, role_id, user_id, Date.now() + seconds * 1000, Date.now() + seconds * 1000], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function deltarget_exprole(guildid, role_id, user_id) {
    let stmt = 'DELETE FROM ExpRoles WHERE guildid=? AND role_id=? AND user_id=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, role_id, user_id], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function del_caroles(guildid, role_id, user_id) {
    let stmt = 'DELETE FROM ExpRoles WHERE guildid=? AND role_id=? AND user_id=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, role_id, user_id], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function write_expimg(hash, width, height) {
    let stmt = 'INSERT INTO ExpImgs VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE width=?,height=?,last_time=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [hash, width, height, Date.now(), '1', width, height, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function ref_expimgtime(hash) {
    let stmt = 'UPDATE ExpImgs SET last_time=? WHERE hash=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [Date.now(), hash], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function fetch_imginfo(hash) {

    let check = await redis.get(`ZuCache:ImageInfoTmpC:${hash}`);
    if (check) {
        return JSON.parse(check);
    }

    let stmt = 'SELECT height,width FROM ExpImgs WHERE hash=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [hash], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret[0]) {
        if (await ref_expimgtime(hash)) {
            await redis.set(`ZuCache:ImageInfoTmpC:${hash}`, JSON.stringify(ret[0]), 600);
            return ret[0];
        } else {
            return false;
        }
    } else {
        return false;
    }
}

async function getinvitecodes(guildid, userid, page, own) {
    let stmt;
    let params;

    if (own == '1') {
        stmt = 'SELECT * FROM InviteCodes WHERE guildid=? AND authorid=? ORDER BY invitecnt DESC LIMIT 20 OFFSET ?';
        params = [guildid, userid, Number(page) * 20];
    } else {
        stmt = 'SELECT * FROM InviteCodes WHERE guildid=? ORDER BY invitecnt DESC LIMIT 20 OFFSET ?';
        params = [guildid, Number(page) * 20];
    }

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [...params], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getinvitecodeinfo(code) {
    let stmt = 'SELECT * FROM InviteCodes WHERE code=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [code], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        return rows[0];
    }
    return false;
}

async function _delinvitecodes(guildid, words) {
    let arr = [];
    let tarr = [];
    for (let i = 0; i < words.length; i++) {
        if ((i + 1) % 10 == 0) {
            arr.push(words[i]);
            tarr.push(arr);
            arr = [];
        } else {
            arr.push(words[i]);
        }
    }

    if (arr.length > 0) {
        tarr.push(arr);
    }

    for (let s of tarr) {
        let stmt = 'DELETE FROM InviteCodes WHERE guildid=? AND code IN (?)';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, s], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {

        } else {
            return false;
        }
    }
    return true;
}

async function write_invitecode(guildid, userid, username, userhead, data) {

    if (!data.code) data.code = 0;

    let exptime = Date.now() + 60 * 60 * 24 * 30 * 1000;
    if (data.rest_time && !isNaN(data.rest_time) && data.rest_time > 0 && data.rest_time <= 60 * 60 * 24 * 30 * 2) {
        exptime = Date.now() + data.rest_time * 1000;
    }
    let stmt = 'INSERT INTO InviteCodes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE groles=?,gpoints=?,gbantime=?,exp_time=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [data.code, guildid, data.guildrid, data.guildname, data.guildhead, userid, username, userhead, '我发现了一个宝藏频道，快看看！', data.groles, data.gpoints, data.gbantime, 0, exptime, data.groles, data.gpoints, data.gbantime, exptime], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret.affectedRows > 0) {
        return ret.insertId;
    } else {
        return false;
    }
}

async function getinvitecode_r(code, page) {

    let stmt = 'SELECT * FROM InvitedUs WHERE code=? ORDER BY entertime DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [code, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function write_invitecode_r(code, userid, username, userhead) {
    
    let stmt = 'INSERT INTO InvitedUs VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE username=?,userhead=?,entertime=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [code, userid, username, userhead, Date.now(), username, userhead, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function ifhas_invitecode_r(guildid, userid) {
    let stmt = 'SELECT userid FROM invitedus JOIN invitecodes ON invitedus.code=invitecodes.code AND invitecodes.guildid=? WHERE userid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.length > 0) return true;
    return false;
}

async function add_invitecode_su(code, icodecheck) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT invitecnt FROM InviteCodes WHERE code=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [code], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {

            let stmt = 'UPDATE InviteCodes SET invitecnt=? WHERE code=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [rows[0].invitecnt + 1, code], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                await checkinvitepoints(icodecheck, rows[0].invitecnt + 1);
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function checkinvitepoints(icodecheck, nowcnt) {
    let sets = await get_EventsSets_back(icodecheck.guildid, '成员邀请奖励设置');
    if (!sets || !sets[0]) return false;
    sets = sets[1][0];
    if (sets.useit != 'true') return false;
    try {
        sets = JSON.parse(sets.content);
    } catch (err) { return false; }

    if (sets.setrolesa) {
        sets.rolesa = sets.rolesa.slice(0, 3);
        let check = sets.rolesa.filter(i => { return i.cnt == nowcnt });
        if (check.length > 0) {
            check = check[0];
            await client.memberApi.memberAddRole(icodecheck.guildid, check.roleid, icodecheck.authorid);
            if (check.time && check.time > 0) {
                await write_exprole_change(icodecheck.guildid, check.roleid, icodecheck.authorid, check.time);
            }
        }
    }
    if (sets.setpointsa) {
        let check = sets.pointsa.filter(i => { return i.cnt == nowcnt });
        if (check.length > 0) {
            check = check[0];
            let addret = await user_points_change(icodecheck.guildid, icodecheck.authorid, check.point_id, check.pointcnt, icodecheck.authorhead, icodecheck.authorname);
            if (addret) {
                await addpointchangelog(icodecheck.guildid, icodecheck.authorid, check.point_id, check.pointcnt, '邀请成员数量达成奖励', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
            }
        }
    }

}

async function _getGpoints(guildid) {

    let check = await redis.get(`ZuCache:GpointsC:${guildid}`);
    if (check) {
        if (check == 'false') return false;
        return JSON.parse(check);
    }

    let stmt = 'SELECT * FROM Guilds_Points WHERE guildid=? LIMIT 10';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        await redis.set(`ZuCache:GpointsC:${guildid}`, JSON.stringify({ cnt: cnt, rows: rows }), 600);
        return { cnt: cnt, rows: rows };
    }
    await redis.set(`ZuCache:GpointsC:${guildid}`, 'false', 600);
    return false;
}

async function _delGpoint(guildid, id) {
    let stmt = 'DELETE FROM Guilds_Points WHERE guildid=? AND point_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (rows && rows.affectedRows > 0) {
        await redis.del(`ZuCache:GpointsC:${guildid}`);
        return true;
    } else {
        return false;
    }
}

async function GpointUp(guildid, id, data) {
    await redis.del(`ZuCache:GpointsC:${guildid}`);
    let arr = Object.values(data);
    if (id == '') {
        let rid = await GetLid();
        if (rid == -1) return false;
        let stmt = 'INSERT INTO Guilds_Points VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, rid, ...arr.slice(2, arr.length)], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'UPDATE Guilds_Points SET point_name=?,point_desc=?,canenter=?,canleave=?,enter_rate=?,leave_rate=?,sold=?,soldprice=?,limitamount_min=?,limitamount_max=?,cantrans=?,transrate=?,bank=?,bankenterrate=?,bankleaverate=?,bankrate=?,exp_seconds=?,canchangeenter=?,canchangeleave=?,changeenter_rate=?,changeleave_rate=?,guilds=? WHERE guildid=? AND point_id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [...arr.slice(2, arr.length), guildid, id], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            return true;
        } else {
            return false;
        }
    }
}

async function user_worningcount_reset(guildid, user_id) {

    let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT warning_counts FROM guild_users_points WHERE guildid=? AND user_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {

            let stmt = 'UPDATE guild_users_points SET warning_counts=?,lasttime=? WHERE guildid=? AND user_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [0, Date.now(), guildid, user_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function user_workcardschange(guildid, user_id, changecnt) {

    let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT cards FROM guild_users_points WHERE guildid=? AND user_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let cnt = rows[0].cards;
            cnt = cnt + 1 * changecnt;
            if (cnt < 0) cnt = 0;
            let stmt = 'UPDATE guild_users_points SET cards=? WHERE guildid=? AND user_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [cnt, guildid, user_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function del_worninglogs_user(guildid, userid) {

    let stmt = `DELETE FROM systemlogs WHERE guildid=? AND userid=? AND (logs LIKE ? OR logs LIKE ?)`;
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, '%被警告一次%', '%被管理员警告%'], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function get_EventsSets_back(guildid, eventname) {

    let check = await redis.get(`ZuCache:EventsSetsICB:${guildid}:${eventname}`);
    if (check) {
        return JSON.parse(check);
    }

    let stmt = `SELECT fromchannel,tochannel,useit,image,content,name FROM EventsSets_back WHERE guildid=? AND name=?`;
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, eventname], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        await redis.set(`ZuCache:EventsSetsICB:${guildid}:${eventname}`, JSON.stringify([true, rows]), 300);
        return [true, rows];
    } else {
        await redis.set(`ZuCache:EventsSetsICB:${guildid}:${eventname}`, JSON.stringify([false]), 300);
        return [false];
    }
}

async function write_EventsSets_back(guildid, fromchannel, tochannel, eventname, useit, image, content) {

    if (useit == 'true') {
        let stmt = 'INSERT INTO EventsSets_back VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tochannel=?,useit=?,image=?,content=?,fromchannel=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [guildid, fromchannel, tochannel, eventname, useit, image, content, tochannel, useit, image, content, fromchannel], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            await redis.del(`ZuCache:EventsSetsICB:${guildid}:${eventname}`);
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'UPDATE EventsSets_back SET useit=? WHERE guildid=? AND name=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, ['false', guildid, eventname, fromchannel], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret.affectedRows > 0) {
            await redis.del(`ZuCache:EventsSetsICB:${guildid}:${eventname}`);
            return true;
        } else {
            return false;
        }
    }
}

async function read_user_points(guildid, userid) {
    let stmt = 'SELECT point_id,points FROM guild_users_points_new WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) return rows;
    return false;
}

async function user_points_change_fix(guildid, user_id, point_id, amount) {
    if (amount < 0) amount = 0;
    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT points FROM guild_users_points_new WHERE guildid=? AND user_id=? AND point_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id, point_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let oldpoints = rows[0].points;
            let changecnt = amount - oldpoints;
            if (changecnt == 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;

            }

            let stmt = 'UPDATE guild_users_points_new SET points=?,lasttime=? WHERE guildid=? AND user_id=? AND point_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [amount, Date.now(), guildid, user_id, point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return changecnt;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function user_points_change(guildid, user_id, point_id, changecnt, head, nick) {

    let stmt = 'INSERT IGNORE INTO guild_users_points_new VALUES (?,?,?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, point_id, 0, Date.now(), head, nick], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT points FROM guild_users_points_new WHERE guildid=? AND user_id=? AND point_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id, point_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            if (rows[0].points + changecnt < 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }

            let stmt = 'UPDATE guild_users_points_new SET points=points+?,lasttime=?,head=?,nick=? WHERE guildid=? AND user_id=? AND point_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [changecnt, Date.now(), head, nick, guildid, user_id, point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return rows[0].points + changecnt;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function user_pointsbank_change(guildid, user_id, point_id, changecnt) {

    let stmt = 'INSERT IGNORE INTO guild_users_points_bank VALUES (?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, point_id, 0, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT points,lasttime FROM guild_users_points_bank WHERE guildid=? AND user_id=? AND point_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id, point_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            if (rows[0].points + changecnt < 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }

            let stmt = 'UPDATE guild_users_points_bank SET points=points+?,lasttime=? WHERE guildid=? AND user_id=? AND point_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [changecnt, changecnt == 0 ? Date.now() : rows[0].lasttime, guildid, user_id, point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return rows[0].points + changecnt;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function user_points_delall(guildid, point_id) {
    let stmt = `DELETE FROM guild_users_points_new WHERE guildid=? AND point_id=?`;
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, point_id], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function office_taskcheck_ifhasdisbanapply(guildid, user_id) {
    let stmt = 'SELECT mida FROM Office_taskList WHERE guildid=? AND fromuser=? AND tasktype=? AND closed=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, '2', '0'], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (!rows || !rows[0]) return false;
    return true;
}

async function write_office_task(guildid, fromuser, tasktype, mida, midb) {
    let stmt = 'INSERT INTO Office_taskList VALUES (?,?,?,?,?,?,?,?)';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, fromuser, tasktype, 0, mida, midb, '0', Date.now()], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret.affectedRows > 0) {
        return ret.insertId;
    } else {
        return false;
    }
}

async function write_HistoryMessage(content) {
    let stmt = `INSERT INTO HistoryMessages VALUES (?,?,?)`;
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [0, content, Date.now()], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (rows && rows.affectedRows > 0) {
        return rows.insertId;
    } else {
        return false;
    }
}

async function fetchofficetasks(guildid, page) {
    let stmt = 'SELECT * FROM Office_taskList WHERE guildid=? ORDER BY creattime DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function delofficetask(guildid, taskid, close) {

    close = (close == '1' ? '1' : '0');

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT tasktype,mida,midb,closed FROM Office_taskList WHERE guildid=? AND taskid=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, taskid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            if (rows[0].closed == close) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return true;
            }

            let stmt = 'UPDATE Office_taskList SET closed=? WHERE guildid=? AND taskid=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [close, guildid, taskid], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return rows[0];
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function readHistoryMessage(mid) {
    let stmt = 'SELECT content FROM HistoryMessages WHERE mid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [mid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        let content = rows[0].content;
        if (!content) return false;
        try {
            content = JSON.parse(content);
            if (content.data) {
                return content.data;
            } else {
                return false;
            }
        } catch (err) { }
        return false;
    }
    return false;
}

async function user_worningcount_add(guildid, user_id, addcnt) {

    let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT warning_counts FROM guild_users_points WHERE guildid=? AND user_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt = 'UPDATE guild_users_points SET warning_counts=warning_counts+?,lasttime=? WHERE guildid=? AND user_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [addcnt, Date.now(), guildid, user_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return rows[0].warning_counts + addcnt;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function getUlogs(guildid, userid) {
    let stmt = 'SELECT time,logs FROM systemlogs WHERE guildid=? AND userid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows && rows.length > 0) {
        return rows;
    }
    return false;
}

async function get_system_worningsets(guildid) {
    let ret = await readguildsets(guildid);
    if (ret) {
        let sets = JSON.parse(ret.sets);
        return sets;
    }
    return { psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' };
}

async function check_ifhitworningsets(guildid, user_id, nowcnt) {
    let time = Date.now();
    let Ulogs = await getUlogs(guildid, user_id);
    let systemsets = await get_system_worningsets(guildid);
    let hitsets = systemsets.psets;
    let length = hitsets.length;
    if (length <= 0) return false;
    for (let i = length - 1; i >= 0; i--) {
        if (hitsets[i].type == 0) { //累计检查
            if (nowcnt >= hitsets[i].cnt) {
                return hitsets[i];
            }
        } else { //短时间检查
            let checktime = hitsets[i].checktime;
            if (checktime > 0 && Ulogs && Ulogs.length > 0) {

                let countcheck = Ulogs.filter(k => {
                    return k.time <= time && k.time >= time - checktime * 1000 && (k.logs.includes('被警告一次') || k.logs.includes('被管理员警告'));
                });

                if (countcheck.length <= 0) continue;

                if (countcheck.length >= hitsets[i].cnt) {
                    return hitsets[i];
                } else {
                    let scnt = 0;
                    for (let ss of countcheck) {
                        if (ss.logs.includes('被警告一次')) {
                            scnt++;

                            if (scnt >= hitsets[i].cnt) {
                                return hitsets[i];
                            }

                        } else {
                            let test = ss.logs.match(/被管理员警告(\d+)次/);
                            if (test && test[1]) {
                                scnt = scnt + Number(test[1]);

                                if (scnt >= hitsets[i].cnt) {
                                    return hitsets[i];
                                }

                            }
                        }
                    }

                    if (scnt >= hitsets[i].cnt) {
                        return hitsets[i];
                    }

                }
            }
        }
    }
    return false;
}

async function del_guild_users_points(guildid, user_id) {
    let stmt = 'DELETE FROM guild_users_points WHERE guildid=? AND user_id=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function worningOneUser(guild_id, _userid, _nick, _head, opuser, bantime) {
    let answer = false;
    let scnt = 1;
    await s_writelog(guild_id, _userid, _nick, _head, '0', { log: `被值班人员警告1次` });
    let cnow = await user_worningcount_add(guild_id, _userid, scnt);
    let check = await check_ifhitworningsets(guild_id, _userid, cnow);
    if (check) {
        let cop = check.ptype;
        let optime = check.ptime;
        if (cop == 0) {
            await ext.Del_guild_member({ guild_id: guild_id, author_id: _userid, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
            await user_worningcount_reset(guild_id, _userid);
            await s_writelog(guild_id, _userid, _nick, _head, '0', { log: `值班人员手动警告，对方触发警告处罚策略，被系统踢出` });
            answer = `该成员发言违规，被多次警告无果，已被系统踢出`;
        } else if (cop == 1) {
            await ext.Del_guild_member({ guild_id: guild_id, author_id: _userid, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
            await del_guild_users_points(guild_id, _userid);
            await s_writelog(guild_id, _userid, _nick, _head, '0', { log: `值班人员手动警告，对方触发警告处罚策略，被系统踢出并拉黑` });
            answer = `该成员发言违规，被多次警告无果，已被系统踢出并拉黑`;
        } else {

            try {
                await client.muteApi.muteMember(guild_id, _userid, { seconds: optime.toString() });
            } catch (err) { }

            answer = `<@!${_userid}> 您的发言违规，被值班人员警告1次，触发禁言处罚，被禁言${longtime2s(optime * 1000)}，请规范发言`;
            if (check.reset == true) {
                await user_worningcount_reset(guild_id, _userid);
                await del_worninglogs_user(guild_id, _userid);
            }
            await s_writelog(guild_id, _userid, _nick, _head, '0', { log: `值班人员手动警告，对方触发警告处罚策略，被系统禁言${longtime2s(optime * 1000)}` });
        }
    } else {
        if (bantime) {
            answer = `<@!${_userid}> 您的发言违规，被值班人员警告1次并禁言${longtime2s(bantime * 1000)}，请规范发言，多次警告可能会被禁言或移出频道`;
        } else {
            answer = `<@!${_userid}> 您的发言违规，被值班人员警告1次，请规范发言，多次警告可能会被禁言或移出频道`;
        }
    }
    return answer;
}

async function getforbidenwordsdb_self(author_id) {
    let stmt = 'SELECT * FROM ForbiddenWordsDB WHERE author_id=? ORDER BY time DESC LIMIT 10 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [author_id,  0], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getforbidenwordsdbbyid(id) {
    let stmt = 'SELECT * FROM ForbiddenWordsDB WHERE id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.length > 0) {
        return rows[0];
    }
    return false;
}

async function delfwordsdb(author_id, id) {

    let stmt = 'DELETE FROM ForbiddenWordsDB WHERE author_id=? AND id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [author_id, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        await redis.del(`ZuCache:FWordsDBSC:${id}`);
        return true;
    } else {
        return false;
    }

}

async function checkforbidenwordsdb_self(author_id) {
    let stmt = 'SELECT id,author_id FROM ForbiddenWordsDB WHERE author_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [author_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        return rows;
    }
    return false;
}

async function fwordsdbup(id, author_id, dbdesc, nick, head, words) {

    if (!author_id) return false;
    let nowlist = await checkforbidenwordsdb_self(author_id);
    if (id) {
        //修改词库
        if (nowlist && nowlist.length > 0) {
            let check = nowlist.filter(i => {
                return i.id == id && i.author_id == author_id;
            });
            if (check.length <= 0) return false;
        } else {
            return false;
        }
    } else {
        //创建新的
        if (nowlist && nowlist.length >= 10) return false;
    }

    let rid = id;
    if (!rid) rid = 0;

    let stmt = 'INSERT INTO ForbiddenWordsDB VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE dbdesc=?,nick=?,head=?,words=?,time=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [rid, author_id, dbdesc, nick, head, words, Date.now(), dbdesc, nick, head, words, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret.affectedRows > 0) {
        await redis.del(`ZuCache:FWordsDBSC:${id}`);
        return true;
    } else {
        return false;
    }

}

function get_markdown_office(before, arr, tail) {

    let m = {
        "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
        "params": []
    };

    for (let i = 0; i < 10; i++) {
        if (i + 1 == 1) {
            m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${before}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
        } else if (arr.length > i - 1) {
            m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${arr[i - 1].before}[🔗${arr[i - 1].content}](${arr[i - 1].link}`] });
        } else if (i + 1 == 10) {
            if (tail) {
                m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r>${tail}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
            } else {
                m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
            }
        } else {
            m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
        }
    }

    return m;
}

async function readusersguilds(openid) {
    let stmt = 'SELECT guilds FROM qqapplication_guilds WHERE openid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [openid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        return JSON.parse(rows[0].guilds);
    }
    return [];
}

async function addusersguilds(openid, guser_id, quser_id, guildinfo) {
    let rows = await readusersguilds(openid);
    rows = rows.filter(i => {
        return i.guildid != guildinfo.guildid;
    });
    rows = [...rows, guildinfo];
    return await writeusersguilds(openid, guser_id, quser_id, rows);
}

async function delusersguilds(openid, guildid) {
    let rows = await readusersguilds(openid);
    rows = rows.filter(i => {
        return i.guildid != guildid;
    });
    return await writeusersguilds(openid, '', '', rows);
}

async function writeusersguilds(openid, guser_id, quser_id, guilds) {
    let stmt;
    let param;
    if (typeof guilds == 'object') guilds = JSON.stringify(guilds);
    if (!guilds) guilds = [];
    if (guser_id && quser_id) {
        stmt = `INSERT INTO qqapplication_guilds VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE guser_id=?,quser_id=?,guilds=?,time=?`;
        param = [openid, guser_id, quser_id, guilds, new Date().getTime(), guser_id, quser_id, guilds, new Date().getTime()];
    } else if (guser_id) {
        stmt = `INSERT INTO qqapplication_guilds VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE guser_id=?,guilds=?,time=?`;
        param = [openid, guser_id, '', guilds, new Date().getTime(), guser_id, guilds, new Date().getTime()];
    } else if (quser_id) {
        stmt = `INSERT INTO qqapplication_guilds VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE quser_id=?,guilds=?,time=?`;
        param = [openid, '', quser_id, guilds, new Date().getTime(), quser_id, guilds, new Date().getTime()];
    } else {
        stmt = `INSERT INTO qqapplication_guilds VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE guilds=?,time=?`;
        param = [openid, '', '', guilds, new Date().getTime(), guilds, new Date().getTime()];
    }
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });

    if (rows && rows.affectedRows > 0) {
        return true;
    } else {
        return false;
    }
}

async function readusersaddress(openid) {
    let stmt = 'SELECT address FROM qqapplication_address WHERE openid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [openid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) {
        return JSON.parse(rows[0].address);
    }
    return [];
}

async function uaddressup(openid, address) {

    let stmt = 'INSERT INTO qqapplication_address VALUES (?,?,?) ON DUPLICATE KEY UPDATE address=?,time=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [openid, address, Date.now(), address, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    if (ret && ret.affectedRows > 0) {
        return true;
    } else {
        return false;
    }

}

async function _getshopinfo(guildid) {
    let result = { sets: false, goods: [] };
    let stmt = 'SELECT id,type,name,image,rest,pointcnt,point_id,point_name,groupname,goodsdesc,descimg,needaddress FROM guildsgoods WHERE guildid=? AND onsold=? ORDER BY time DESC LIMIT 100';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, '1'], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        result.goods = rows;
    }

    let set = await get_EventsSets_back(guildid, '礼品商店设置');
    if (set[0]) {
        result.sets = set[1][0];
    }

    return result;
}

async function GgoodsinfoUp(guildid, id, data) {
    let arr = Object.values(data);
    if (id < 0) {
        let stmt = 'INSERT INTO guildsgoods VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [0, guildid, ...arr.slice(2, arr.length - 1), new Date().getTime()], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            return ret.insertId;
        } else {
            return false;
        }
    } else {
        return await Ggoodssafeup_admin(guildid, id, data);
    }
}

async function Getgoodsinfo(guildid, id) {
    let stmt = 'SELECT * FROM guildsgoods WHERE guildid=? AND id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.length > 0) {
        return rows[0];
    }
    return false;
}

async function Ggoodssafegain(guildid, id, userid, uinfo, address) {

    let stmt = 'INSERT IGNORE INTO guildgoodsdaylog VALUES (?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id, 0, Date_YMD(), Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    stmt = 'INSERT IGNORE INTO guildgoodsdayuserlog VALUES (?,?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, id, 0, Date_YMD(), Date.now()], (err, msg) => {      
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    let card = '';
    let money = 0;
    let goodstodaycnt = 0;
    let goodsusertodaycnt = 0;

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT * FROM guildsgoods WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return { errcode: 402, errmsg: '该礼品不存在' };
        } else {
            let goodsinfo = rows[0];

            if (goodsinfo.onsold != '1') {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: '该礼品已下架' };
            }
            if (goodsinfo.type != '2' && goodsinfo.rest <= 0) {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: '礼品库存不足' };
            }
            if (goodsinfo.type == '2') {
                let stmt = 'SELECT card FROM guildsgood_cards WHERE guildid=? AND id=? AND onsold=? LIMIT 1 FOR UPDATE';
                let rows = await new Promise((resolve, reject) => {
                    scc.query(stmt, [guildid, goodsinfo.id, '1'], (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
                });
                if (!rows || !rows[0]) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: '礼品库存不足' };
                } else {
                    card = rows[0].card;
                    if (!card) {

                        await new Promise((resolve, reject) => {
                            scc.rollback(() => {
                                resolve();
                            });
                        });
                        scc.release();
                        return { errcode: 402, errmsg: '服务错误，兑换失败' };
                    }
                }
            }
            if (!isTimeInRange(goodsinfo.start, goodsinfo.end)) {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `非礼品可兑时间段：${goodsinfo.start} - ${goodsinfo.end}` };
            }
            if (goodsinfo.saferoles != 'all') {
                if (!uinfo || !uinfo.roles) {
                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `抱歉，您当前的身份组不被允许兑换此礼品` };
                } else {
                    let rolecheck = uinfo.roles.filter(i => {
                        return goodsinfo.saferoles.includes(`|${i}|`);
                    });
                    if (rolecheck.length <= 0) {
                        await new Promise((resolve, reject) => {
                            scc.rollback(() => {
                                resolve();
                            });
                        });
                        scc.release();
                        return { errcode: 402, errmsg: `抱歉，您当前的身份组不被允许兑换此礼品` };
                    }
                }
            }
            if (goodsinfo.needaddress == '1' && !address) {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `该礼品需要提供收货地址` };
            }

            stmt = 'SELECT points FROM guild_users_points_new WHERE guildid=? AND user_id=? AND point_id=? FOR UPDATE';
            rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, userid, goodsinfo.point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if(!rows || !rows[0]) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `资产不足` };
            } else {
                if (rows[0].points < goodsinfo.pointcnt) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `资产不足` };
                } else {
                    money = rows[0].points;
                }
            }

            stmt = 'SELECT todaycnt FROM guildgoodsdaylog WHERE guildid=? AND id=? AND texttime=? FOR UPDATE';
            rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, goodsinfo.id, Date_YMD()], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (!rows || !rows[0]) {
                /* 今天还没有兑换记录
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });

                return { errcode: 402, errmsg: `服务错误，兑换失败` };
                */
            } else {
                if (rows[0].todaycnt >= goodsinfo.daymax) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `该礼品今日兑换数量达到上限` };
                } else {
                    goodstodaycnt = rows[0].todaycnt;
                }
            }

            stmt = 'SELECT todaycnt,time FROM guildgoodsdayuserlog WHERE guildid=? AND user_id=? AND id=? AND texttime=? AND time<=? FOR UPDATE';
            rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, userid, goodsinfo.id, Date_YMD(), Date.now() - 1000 * 60 * 60 * 24 * (goodsinfo.limitpb - 1)], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (!rows || !rows[0]) {
                /* 今天还没有兑换记录
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });

                return { errcode: 402, errmsg: `服务错误，兑换失败` };
                */
            } else {
                let totalcnt = 0;
                rows.sort((a, b) => { return b.time - a.time; });
                for (let i of rows) {
                    totalcnt = totalcnt + i.todaycnt;
                }
                if (totalcnt >= goodsinfo.limitpa) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `您对该礼品的兑换数量达到上限，该礼品限制每个用户 ${goodsinfo.limitpb} 日内只能兑换 ${goodsinfo.limitpa} 个` };
                } else {
                    goodsusertodaycnt = rows[0].todaycnt;
                }
            }
            //限制全部通过

            //库存扣除
            if (goodsinfo.type != '2') {
                if (goodsinfo.reset - 1 < 0) {
                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: '礼品库存不足' };
                }
                let stmt = 'UPDATE guildsgoods SET rest=? WHERE guildid=? AND id=?';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [goodsinfo.rest - 1, guildid, id], (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
                });
                if (!ret || ret.affectedRows <= 0) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `服务错误，礼品库存扣除失败` };
                }
            } else {
                if (!card) {
                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: '礼品库存不足' };
                }
                let stmt = 'DELETE FROM guildsgood_cards WHERE guildid=? AND id=? AND card=?';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [guildid, id, card], (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
                });
                if (!ret || ret.affectedRows <= 0) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return { errcode: 402, errmsg: `服务错误，礼品库存扣除失败` };
                }
            }

            //礼品每日兑换增加
            stmt = 'UPDATE guildgoodsdaylog SET todaycnt=? WHERE guildid=? AND id=? AND texttime=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [goodstodaycnt + 1, guildid, goodsinfo.id, Date_YMD()], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (!ret || ret.affectedRows <= 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `服务错误，礼品兑换次数记录增加失败` };
            }

            //用户每日兑换增加
            stmt = 'UPDATE guildgoodsdayuserlog SET todaycnt=? WHERE guildid=? AND user_id=? AND id=? AND texttime=?';
            ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [goodsusertodaycnt + 1, guildid, userid, goodsinfo.id, Date_YMD()], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (!ret || ret.affectedRows <= 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `服务错误，用户兑换次数记录增加失败` };
            }

            //资产扣除
            money = money - goodsinfo.pointcnt;
            if (money < 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `服务错误，资产扣除失败` };
            }
            stmt = 'UPDATE guild_users_points_new SET points=? WHERE guildid=? AND user_id=? AND point_id=?';
            ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [money, guildid, userid, goodsinfo.point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (!ret || ret.affectedRows <= 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return { errcode: 402, errmsg: `服务错误，资产扣除失败` };
            } else {
                await addpointchangelog(guildid, userid, goodsinfo.point_id, -1 * goodsinfo.pointcnt, `兑换礼品【${goodsinfo.name}】`, userid, uinfo.user.username, uinfo.user.avatar);
            }

            await new Promise((resolve, reject) => {
                scc.commit(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            if (goodsinfo.type != '2') {
                scc.release();
                return { errcode: 0, errmsg: '', goodsinfo: goodsinfo };
            } else {
                scc.release();
                return { errcode: 0, errmsg: card, goodsinfo: goodsinfo };
            }

        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return { errcode: 402, errmsg: '服务错误，兑换失败' };
    }
}

async function Ggoodssafeup_admin(guildid, id, data) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT name FROM guildsgoods WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let arr = Object.values(data);
            let stmt = 'UPDATE guildsgoods SET name=?,image=?,rest=?,daymax=?,roleid=?,rolename=?,rolesecs=?,pointcnt=?,point_id=?,point_name=?,limitpa=?,limitpb=?,groupname=?,onsold=?,goodsdesc=?,descimg=?,saferoles=?,start=?,end=?,needaddress=?,time=? WHERE guildid=? AND id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [...arr.slice(3, arr.length - 2), new Date().getTime(), guildid, id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return id;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function CardsdbinfoUp(guildid, id, data) {
    let arr = Object.values(data);
    if (id < 0) {
        let stmt = 'INSERT INTO guildcardsdb VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [0, guildid, ...arr.slice(2, arr.length - 1), new Date().getTime()], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });
        if (ret && ret.affectedRows > 0) {
            return ret.insertId;
        } else {
            return false;
        }
    } else {
        return await Guildcardssafeup_admin(guildid, id, data);
    }
}

async function Guildcardssafeup_admin(guildid, id, data) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT id FROM guildcardsdb WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let arr = Object.values(data);
            let stmt = 'UPDATE guildcardsdb SET roleid=?,rolename=?,rolesecs=?,pointcnt=?,point_id=?,point_name=?,gaincnt=?,fixchannel=?,time=? WHERE guildid=? AND id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [...arr.slice(3, arr.length - 1), new Date().getTime(), guildid, id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return id;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function getchannelgoods(guildid) {
    let stmt = 'SELECT * FROM guildsgoods WHERE guildid=? ORDER BY time DESC LIMIT 100';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getguildcardsdb(guildid) {
    let stmt = 'SELECT * FROM guildcardsdb WHERE guildid=? ORDER BY time DESC LIMIT 20';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function _delchannelgoods(guildid, id) {
    let stmt = 'DELETE FROM guildsgoods WHERE guildid=? AND id=? AND onsold=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id, '0'], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        return true;
    }
    return false;
}

async function getgoodscards(guildid, id) {
    let stmt = 'SELECT * FROM guildsgood_cards WHERE guildid=? AND id=? ORDER BY time DESC LIMIT 500';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getdbcards(guildid, id) {
    let stmt = 'SELECT * FROM guildcards WHERE guildid=? AND id=? ORDER BY time DESC LIMIT 500';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function GgoodscardsUp(guildid, id, rows) {
    if (rows.length <= 0) return false;
    let arr = rows.map(i => { return [0, guildid, id, ...i]; });
    let stmt = 'INSERT IGNORE INTO guildsgood_cards VALUES ? ';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [arr], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        return ret.affectedRows;
    } else {
        return 0;
    }
}

async function GgoodsdbcardsUp(guildid, id, rows) {
    if (rows.length <= 0) return false;
    let arr = rows.map(i => { return [0, guildid, id, ...i]; });
    let stmt = 'INSERT IGNORE INTO guildcards VALUES ? ';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [arr], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        return ret.affectedRows;
    } else {
        return 0;
    }
}

async function Gcardssafeupone_admin(guildid, cardid, op) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT card FROM guildsgood_cards WHERE guildid=? AND cardid=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, cardid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt;
            let param;
            if (op == '0') {//下架
                stmt = 'UPDATE guildsgood_cards SET onsold=? WHERE guildid=? AND cardid=?';
                param = ['0', guildid, cardid];
            } else if (op == '1'){ //上架
                stmt = 'UPDATE guildsgood_cards SET onsold=? WHERE guildid=? AND cardid=?';
                param = ['1', guildid, cardid];
            }else { //删除
                stmt = 'DELETE FROM guildsgood_cards WHERE guildid=? AND cardid=?';
                param = [guildid, cardid];
            }
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, param, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function Gcardssafeupall_admin(guildid, id, op) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT id FROM guildsgood_cards WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt;
            let param;
            if (op == '0') {//下架
                stmt = 'UPDATE guildsgood_cards SET onsold=? WHERE guildid=? AND id=?';
                param = ['0', guildid, id];
            } else if (op == '1') { //上架
                stmt = 'UPDATE guildsgood_cards SET onsold=? WHERE guildid=? AND id=?';
                param = ['1', guildid, id];
            } else { //删除
                stmt = 'DELETE FROM guildsgood_cards WHERE guildid=? AND id=?';
                param = [guildid, id];
            }
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, param, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function Gcardsdbsafeupone_admin(guildid, cardid, op) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT card FROM guildcards WHERE guildid=? AND cardid=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, cardid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt;
            let param;
            if (op == '0') {//下架
                stmt = 'UPDATE guildcards SET onsold=? WHERE guildid=? AND cardid=?';
                param = ['0', guildid, cardid];
            } else if (op == '1') { //上架
                stmt = 'UPDATE guildcards SET onsold=? WHERE guildid=? AND cardid=?';
                param = ['1', guildid, cardid];
            } else { //删除
                stmt = 'DELETE FROM guildcards WHERE guildid=? AND cardid=?';
                param = [guildid, cardid];
            }
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, param, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function Gcardsdbsafeupall_admin(guildid, id, op) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT id FROM guildcards WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt;
            let param;
            if (op == '0') {//下架
                stmt = 'UPDATE guildcards SET onsold=? WHERE guildid=? AND id=?';
                param = ['0', guildid, id];
            } else if (op == '1') { //上架
                stmt = 'UPDATE guildcards SET onsold=? WHERE guildid=? AND id=?';
                param = ['1', guildid, id];
            } else { //删除
                stmt = 'DELETE FROM guildcards WHERE guildid=? AND id=?';
                param = [guildid, id];
            }
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, param, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function s_getgoodshistory(guildid, userid, page, isall, isfinish) {
    let stmt;
    let param;
    if (isall) {
        stmt = 'SELECT * FROM guildsgoodslogs WHERE guildid=? AND finish=? ORDER BY time DESC LIMIT 10 OFFSET ?';
        param = [guildid, isfinish, Number(page) * 10];
    } else {
        stmt = 'SELECT * FROM guildsgoodslogs WHERE guildid=? AND userid=? AND finish=? ORDER BY time DESC LIMIT 10 OFFSET ?';
        param = [guildid, userid, isfinish, Number(page) * 10];
    }
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function hassendgoodslog(guildid, id) {
    let stmt = 'UPDATE guildsgoodslogs SET finish=? WHERE guildid=? AND logid=?';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, ['1', guildid, id], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        return true;
    } else {
        return 0;
    }
}

async function _delguildcardsdb(guildid, id) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT id FROM guildcardsdb WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let stmt = 'DELETE FROM guildcardsdb WHERE guildid=? AND id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function setuserhasworktoday(guildid, id, changecnt, checkcnt) {

    let stmt = 'INSERT IGNORE INTO guildgoodsdaylog VALUES (?,?,?,?,?)';
    await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, id, 0, Date_YMD(), Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT todaycnt FROM guildgoodsdaylog WHERE guildid=? AND id=? AND texttime=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id, Date_YMD()], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let nowcnt = rows[0].todaycnt;
            nowcnt = nowcnt + 1 * changecnt;
            if (nowcnt < 0) nowcnt = 0;
            if (nowcnt > checkcnt) {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
            let stmt = 'UPDATE guildgoodsdaylog SET todaycnt=? WHERE guildid=? AND id=? AND texttime=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [nowcnt, guildid, id, Date_YMD()], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function changegoodsrest(guildid, id, changecnt) {

    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT rest FROM guildsgoods WHERE guildid=? AND id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let nowcnt = rows[0].rest;
            nowcnt = nowcnt + 1 * changecnt;
            if (nowcnt < 0) {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
            let stmt = 'UPDATE guildsgoods SET rest=? WHERE guildid=? AND id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [nowcnt, guildid, id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return true;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function readmymoney(guildid, userid, point_id) {
    let stmt = 'SELECT points FROM guild_users_points_new WHERE guildid=? AND user_id=? AND point_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid, point_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.length>0) {
        return rows[0].points;
    }
    return 0;
}

async function addgoodslog(guildid, id, type, name, image, pointcnt, point_name, userid, usernick, userrole, userhead, finish, content) {
    let stmt = 'INSERT INTO guildsgoodslogs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [0, guildid, id, type, name, image, pointcnt, point_name, userid, usernick, userrole, userhead, finish, content, Date.now()], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        return ret.affectedRows;
    } else {
        return 0;
    }
}

async function getonworklist(guildid, ordertype, page) {
    let stmt;
    let param;
    let begain = new Date();
    let end = new Date();
    begain.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (ordertype == '0') { //每日打卡榜
        stmt = 'SELECT usernick,userhead,time,roles,user_id FROM guild_users_points WHERE guildid=? AND time>=? AND time<=? ORDER BY time LIMIT 20 OFFSET ?';
        param = [guildid, begain.getTime(), end.getTime(), Number(page) * 20];
    } else if (ordertype == '1') { //连续打卡榜
        stmt = 'SELECT usernick,userhead,cot_workdays,roles,user_id FROM guild_users_points WHERE guildid=? AND cot_workdays>0 ORDER BY cot_workdays DESC LIMIT 20 OFFSET ?';
        param = [guildid, Number(page) * 20];
    } else if (ordertype == '2') { //累计打卡榜
        stmt = 'SELECT usernick,userhead,workdays,roles,user_id FROM guild_users_points WHERE guildid=? AND workdays>0 ORDER BY workdays DESC LIMIT 20 OFFSET ?';
        param = [guildid, Number(page) * 20];
    } else {
        return false;
    }
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getupointslist(guildid, point_id, page) {

    let stmt = 'SELECT * FROM guild_users_points_new WHERE guildid=? AND point_id=? ORDER BY points DESC LIMIT 20 OFFSET ?';
    let param = [guildid, point_id, Number(page) * 20];

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getupointschangelogs(guildid, user_id, point_id, page) {

    let stmt = 'SELECT * FROM gupointschangelogs WHERE guildid=? AND (user_id=? || user_id=?) AND point_id=? ORDER BY time DESC LIMIT 20 OFFSET ?';
    let param = [guildid, user_id, 0, point_id, Number(page) * 20];

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });

    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function addpointchangelog(guildid, userid, point_id, changepoint, reason,opuserid, opnick, ophead) {
    let stmt = 'INSERT INTO gupointschangelogs VALUES (?,?,?,?,?,?,?,?,?,?) ';
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [0, guildid, userid, point_id, changepoint, reason, Date.now(), opuserid, opnick, ophead], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });
    if (ret && ret.affectedRows > 0) {
        return ret.affectedRows;
    } else {
        return 0;
    }
}

async function getupointstaskinfo(guildid, point_id) {

    let stmt = 'SELECT * FROM gupointsresettasks WHERE guildid=? AND point_id=?';
    let param = [guildid, point_id];

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows && rows.length>0) {
        return rows[0];
    }
    return {
        useit: '0',
        guildid: '',
        point_id: '',
        resetpoint: 0,
        hours: '0',
        weekdays: '*',
        days: '27',
        moths: '2,9',
        time: 0
    };
}

async function writepointtask(guildid, point_id, info) {
    let stmt = 'INSERT INTO gupointsresettasks VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE useit=?,resetpoint=?,hours=?,weekdays=?,days=?,moths=?,time=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [info.useit, guildid, point_id, info.resetpoint, info.hours, info.weekdays, info.days, info.moths, Date.now(), info.useit, info.resetpoint, info.hours, info.weekdays, info.days, info.moths, Date.now()], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        return true;
    } else {
        return false;
    }
}

async function read_user_pointsbank(guildid, userid) {
    let stmt = 'SELECT point_id,points,lasttime FROM guild_users_points_bank WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) return rows;
    return false;
}

async function read_user_payinfo(guildid, userid) {
    let stmt = 'SELECT * FROM guserpayrecord WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, userid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows[0]) return rows;
    return false;
}

async function user_willingpayinfo_addt(guildid, user_id, out_trade_no, payurl, head, nick, point_id, point_cnt, amount) {
    let stmt = 'INSERT INTO guserpayrecord VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE out_trade_no=?,payurl=?,head=?,nick=?,point_id=?,point_cnt=?,thisamount=?,time=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, user_id, out_trade_no, payurl, head, nick, point_id, point_cnt, amount, 0, Date.now(), out_trade_no, payurl, head, nick, point_id, point_cnt, amount, Date.now()], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        return true;
    } else {
        return false;
    }
}

async function user_willingpaycancle(guildid, user_id) {
    let stmt = 'UPDATE guserpayrecord SET out_trade_no=?,payurl=?,point_id=?,point_cnt=?,thisamount=? WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, ['', '', '', 0, 0, guildid, user_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        return true;
    } else {
        return false;
    }
}

async function user_willingpayensure(guildid, user_id) {
    let stmt = 'UPDATE guserpayrecord SET out_trade_no=?,payurl=?,point_id=?,point_cnt=?,totalamount=totalamount+thisamount,time=? WHERE guildid=? AND user_id=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, ['', '', '', 0, Date.now(), guildid, user_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows && rows.affectedRows > 0) {
        return true;
    } else {
        return false;
    }
}

async function user_pointsbank_change_fix(guildid, user_id, point_id, amount) {
    if (amount < 0) amount = 0;
    let scc = await new Promise((resolve, reject) => {
        global.pool_application.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });

    try {

        await new Promise((resolve, reject) => {
            scc.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        let stmt = 'SELECT points FROM guild_users_points_bank WHERE guildid=? AND user_id=? AND point_id=? FOR UPDATE';
        let rows = await new Promise((resolve, reject) => {
            scc.query(stmt, [guildid, user_id, point_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (!rows || !rows[0]) {

            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return false;
        } else {
            let oldpoints = rows[0].points;
            let changecnt = amount - oldpoints;
            if (changecnt == 0) {

                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;

            }

            let stmt = 'UPDATE guild_users_points_bank SET points=? WHERE guildid=? AND user_id=? AND point_id=?';
            let ret = await new Promise((resolve, reject) => {
                scc.query(stmt, [amount, guildid, user_id, point_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (ret && ret.affectedRows > 0) {
                await new Promise((resolve, reject) => {
                    scc.commit(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                scc.release();
                return changecnt;
            } else {
                await new Promise((resolve, reject) => {
                    scc.rollback(() => {
                        resolve();
                    });
                });
                scc.release();
                return false;
            }
        }
    } catch (err) {
        await new Promise((resolve, reject) => {
            scc.rollback(() => {
                resolve();
            });
        });
        scc.release();
        return false;
    }
}

async function user_pointsbank_delall(guildid, point_id) {
    let stmt = `DELETE FROM guild_users_points_bank WHERE guildid=? AND point_id=?`;
    let ret = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [guildid, point_id], (err, msg) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    }).catch((err) => { console.error(err) });

    return ret && ret.affectedRows > 0;
}

async function getupointslistbank(guildid, point_id, page) {

    let stmt = 'SELECT guild_users_points_bank.user_id,guild_users_points_bank.point_id,guild_users_points_bank.points,guild_users_points_new.head,guild_users_points_new.nick FROM guild_users_points_bank JOIN guild_users_points_new ON guild_users_points_bank.guildid=guild_users_points_new.guildid AND guild_users_points_bank.point_id=guild_users_points_new.point_id AND guild_users_points_bank.user_id=guild_users_points_new.user_id WHERE guild_users_points_bank.guildid=? AND guild_users_points_bank.point_id=? ORDER BY guild_users_points_bank.points DESC LIMIT 20 OFFSET ?';
    let param = [guildid, point_id, Number(page) * 20];

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getuwillingpaylist(guildid, page) {

    let stmt = 'SELECT * FROM guserpayrecord WHERE guildid=? ORDER BY totalamount DESC LIMIT 20 OFFSET ?';
    let param = [guildid, Number(page) * 20];

    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, param, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    }).catch(err => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function getnowguilds_p(page) {
    let stmt = 'SELECT * FROM guilds LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function guildup_p(guildid, op) {
    let time = Date.now() + 15 * 24 * 60 * 60 * 1000;
    if (op == 'not') time = 0;
    let stmt = 'UPDATE guilds SET expiration_time=? WHERE guildid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [time, guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    return rows && rows.affectedRows > 0;
}

async function getexpimgs_p(page) {
    let stmt = 'SELECT * FROM expimgs WHERE needcheck=? ORDER BY last_time DESC LIMIT 20 OFFSET ?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, ['1', Number(page) * 20], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    if (rows) {
        let cnt = rows.length;
        return { cnt: cnt, rows: rows };
    }
    return false;
}

async function expimgsup_p(hash, op, userid) {
    if (op == 'yes') {
        let stmt = 'UPDATE expimgs SET needcheck=? WHERE hash=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, ['0', hash], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {
            await NewIPush(`${hash}\r该图片已被巡查为${op == 'yes' ? '通过' : '不通过'}\r审核人：${userid}`);
            return true;
        } else {
            return false;
        }
    } else {
        let stmt = 'DELETE FROM expimgs WHERE hash=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [hash], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.affectedRows > 0) {
            let filePath = path.join(dir, '..', '..', '图片', `${hash}.png`);
            try {
                await fs.promises.unlink(filePath);
            } catch (err) { }
        }
        await NewIPush(`${hash}\r该图片已被巡查为${op == 'yes' ? '通过' : '不通过'}\r审核人：${userid}`);
        return true;
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

async function HistoryMessage_addid(mid, id) {
    let c = await read_historyMessage(mid);
    if (!c) return false;
    try {
        c = JSON.parse(c);
        c.data.tid = id;
        let stmt = `UPDATE HistoryMessages SET content=? WHERE mid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [JSON.stringify(c), mid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows.affectedRows > 0) {
            return true;
        } else {
            return false;
        }
    } catch (err) { }
    return false;
}

async function HistoryMessage_adddeallog(mid, avatar, id, username, deal) {
    let c = await read_historyMessage(mid);
    if (!c) return false;
    try {
        c = JSON.parse(c);
        let nowlogs = c.data.logs;
        if (!nowlogs) nowlogs = [];
        nowlogs = [...nowlogs, { avatar: avatar, id: id, username: username, deal: deal, time: timestamp2times(Date.now()) }];
        c.data.logs = nowlogs;
        let stmt = `UPDATE HistoryMessages SET content=? WHERE mid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_application.query(stmt, [JSON.stringify(c), mid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows.affectedRows > 0) {
            return true;
        } else {
            return false;
        }
    } catch (err) { }
    return false;
}

async function gexptimeadd(addtime, guildid) {
    let stmt = 'UPDATE Guilds SET expiration_time=IF(expiration_time<?,?,expiration_time+?) WHERE guildid=?';
    let rows = await new Promise((resolve, reject) => {
        global.pool_application.query(stmt, [Date.now(), Date.now() + addtime, addtime, guildid], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }).catch((err) => { console.error(err) });
    return rows && rows.affectedRows > 0;
}