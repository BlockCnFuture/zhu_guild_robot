import path from 'path';
import fs from 'node:fs'
import { fileURLToPath } from 'url';
import './lib/mysql/mysql.js'
import './lib/qqApplication/application.js'
import crypto from 'crypto';
import fetch from 'node-fetch';

let dir = path.dirname(fileURLToPath(import.meta.url));

export default class tools {
    constructor() {

    }

    get_template(name) {
        return path.join(dir, 'resource', 'template', name, `${name}.html`);
    }

    get_template_obj(name) {
        let obj = [];
        let s = path.join(dir, 'config', 'template', `${name}.json`);
        if (fs.existsSync(s)) {
            try {
                obj = JSON.parse(fs.readFileSync(s, 'utf8'));
                obj.resourcepath = path.join(dir, 'resource');
                return obj;
            } catch (err) {
                obj.resourcepath = path.join(dir, 'resource');
                return obj;
            }
        } else {
            obj.resourcepath = path.join(dir, 'resource');
            return obj;
        }
    }

    get_markdown_t1(width, height, imgurl, before, headurl, content) {
        let m = {
            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
            "params": []
        };

        for (let i = 0; i < 10; i++) {
            if (i + 1 == 1) {
                m.params.push({ key: `c${i + 1}`, values: [`img #${width}px #${height}px](${imgurl}) \r${before}![图片Holder #20px#20px](${headurl}`] });
            } else if (i + 1 == 2) {
                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${content}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
            }else if (i + 1 == 10) {
                m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
            } else {
                m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
            }

        }

        return m;
    }

    get_markdown_t4(imgsize, imgurl, headurl, arr) {

        let m = {
            "custom_template_id": `${global.miniappconfig.markdowntemplateA}`,
            "params": []
        };

        if (arr.length <= 0) return {};
        if (arr[0].key == 'content') {
            for (let i = 0; i < 10; i++) {
                if (i + 1 == 1) {
                    m.params.push({ key: `c${i + 1}`, values: [`${imgsize}](${imgurl}) \r![图片Holder #20px#20px](${headurl}`] });
                } else if (i + 1 == 2) {
                    m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) ${arr[0].values[0]}\r***\r${arr[1].values[0]}\r\r>${arr[2].values[0]}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                } else if (i + 1 == 3) {
                    m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r***\r${arr[3].values[0]}\r\r>${arr[4].values[0]}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                } else if (i + 1 == 4) {
                    m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r***\r>${arr[5].values[0]}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                } else if (i + 1 == 5) {
                    m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/) \r\r***\r${arr[6].values[0]}![img #-1px #1px](https://m.q.qq.com/a/p/`] });
                } else if (i + 1 == 10) {
                    m.params.push({ key: `c0`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                } else {
                    m.params.push({ key: `c${i + 1}`, values: [`img #-1px #1px](https://m.q.qq.com/a/p/`] });
                }
            }
        }

        return m;
    }

    get_markdown_office(before, arr, tail) {

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

    Date_YMD(timestamp) {
        let date;
        if (timestamp) {
            date = new Date(parseInt(timestamp));
        } else {
            date = new Date();
        }
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        month = month < 10 ? `0${month}` : month;
        let day = date.getDate();
        day = day < 10 ? `0${day}` : day;
        return `${year}-${month}-${day}`;
    }

    getFixedTimestamp_OneDay() {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // 将时间设置为当天的凌晨 00:00:00
        let timestamp = currentDate.getTime(); // 获取时间戳（以毫秒为单位）
        return timestamp;
    }

    get_today_users(users) {
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

    get_imghash(attachments) {
        if (!attachments) return [];
        let imgs = [];
        for (let s of attachments) {
            if (s.content_type.startsWith('image')) {
                let ihash = s.filename;
                if (ihash) {
                    if (ihash.startsWith('{')) {
                        imgs.push(ihash.slice(0, 38));
                    } else {
                        imgs.push('{' + ihash.slice(0, 8) + '-' + ihash.slice(8, 12) + '-' + ihash.slice(12, 16) + '-' + ihash.slice(16, 20) + '-' + ihash.slice(20, 32) + '}');
                    }
                }
            }
        }
        return imgs;
    }

    isTimeInRange(start, end) {
        let now = new Date();
        let startTime = new Date(now.toDateString() + ' ' + start);
        let endTime = new Date(now.toDateString() + ' ' + end);
        if (now >= startTime && now <= endTime) {
            return true;
        } else {
            return false;
        }
    }

    isTimestampYesterday(time, todayfine) {
        let givenDate = new Date(time);
        let currentDate = new Date();
        givenDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        let diffInMilliseconds = currentDate - givenDate;
        let diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
        if (todayfine) {
            return diffInDays === 1 || diffInDays < 1;
        } else {
            return diffInDays === 1;
        }
    }

    getTimestampDiffin(time) {
        let givenDate = new Date(time);
        let currentDate = new Date();
        givenDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        let diffInMilliseconds = currentDate - givenDate;
        let diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
        return diffInDays;
    }

    getTodayRestSecs() {
        let givenDate = new Date();
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        let diffInMilliseconds = endDate - givenDate;
        let diffInSecs = Math.floor(diffInMilliseconds / 1000);
        return diffInSecs;
    }

    async addPermission(p, k) {
        let binaryP = p.padStart(k + 1, '0');
        binaryP = binaryP.slice(0, binaryP.length - k - 1) + '1' + binaryP.slice(binaryP.length - k);
        return binaryP;
    }

    async removePermission(p, k) {
        let binaryP = p.padStart(k + 1, '0');
        binaryP = binaryP.slice(0, binaryP.length - k - 1) + '0' + binaryP.slice(binaryP.length - k);
        return binaryP;
    }

    async hasPermission(p, k) {
        let binaryP = p.padStart(k + 1, '0');
        return binaryP.slice(binaryP.length - k - 1, binaryP.length - k) == '1';
    }

    async saveimg(buffer, salt) {
        let path = `${dir}\\图片\\`
        if (!await this.exists(path)) await this.createDirectory(path);
        let md5 = await this.md5WithSalt(buffer, salt);
        path = `${path}${md5}.png`
        if (await this.writeToFile(buffer, path)) {
            return path;
        }
        return false;
    }

    async exists(path) {
        try {
            await fs.promises.access(path);
            return true;
        } catch (err) {
            return false;
        }
    }

    async deleteFile(path) {
        try {
            await fs.promises.unlink(path);
            return true;
        } catch (err) {
            return false;
        }
    }

    async createDirectory(path) {
        try {
            await fs.promises.mkdir(path, { recursive: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    async writeToFile(buffer, filePath) {
        try {
            await fs.promises.writeFile(filePath, buffer);
            return true;
        } catch (err) {
            return false;
        }
    }

    async readFileToBuffer(filePath) {
        let sp = filePath;
        let check = sp.match(/\/img\/(.*?)(\?|$)/);
        if (check && check[1]) {
            check[1] = check[1].trim();
            sp = `${dir}\\图片\\${check[1]}.png`;

            let cache = await this.fetch_imginfo(check[1]);
            if (cache) {
                //
            } else {
                try {
                    await fs.promises.unlink(sp);
                } catch (err) { }
                return null;
            }
        }

        //主服务器尝试
        try {
            let buffer = await fs.promises.readFile(sp);
            return buffer;
        } catch (err) { }

        //不是主服务器
        try {
            let request = await fetch(filePath);
            let buffer = await request.arrayBuffer();
            return Buffer.from(buffer);
        } catch (err) {
            return null;
        }
    }

    async getimageinfo(link) {
        let sp = link;
        let check = sp.match(/\/img\/(.*?)(\?|$)/);
        if (check && check[1]) {
            check[1] = check[1].trim();
            if (check[1].length < 16) {
                return { width: 1920, height: 640 }
            }
            let cache = await this.fetch_imginfo(check[1]);
            if (cache) {
                return cache;
            }
        }
        return false;
    }

    async md5WithSalt(str, salt) {
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

    get_resourcepath() {
        return path.join(dir, 'resource');
    }

    timestamp2times(timestamp) {
        let date = new Date(parseInt(timestamp));
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    longtime2s(time) {
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

    extractStringsFromJson(json) {
        let string = '';
        let extract = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    string += obj[key];
                } else if (typeof obj[key] === 'object') {
                    extract(obj[key]);
                }
            }
        };
        extract(json);
        return string;
    }

    check_level(roles) {
        for (let role of roles) {
            let n = Number(role);
            if (!isNaN(n) && n >= 11 && n <= 35) {
                return n - 10;
            }
        }
        return 0;
    }

    rp_linkasn(content) {
        let tmp = content;
        tmp = tmp.replace(/(http|https|ftp)?:?\/?\/?([A-Za-z0-9]+ *(\.|点|。)+ *)+[a-zA-Z]{2,}/g, '[链接]');
        let list = ['扣', '群号', '加群', '深夜', '裙', '微信', '涩', '色', '瑟', '塞', '灌', '插', '射', '蛇',
            '姐姐', '哥哥', '坤', '鸡', '寄吧', '硬', '点击', '官方', '腾讯', '内幕', '马化腾', '中国', '政府', '共产党', '腐败',
            '国家', '广告', '死', '屎', '扫码', '美女', '炮', '中共', '网址', '网站', '网页', '尼玛', '你妈', '你吗', '逼', '傻',
            '狗', '蠢', '加我', '黄', '皇', '赌', '毒', '面粉', '垃圾', '屁', '瞎', '脑', '残', '神经', '病', '有冰', '焯', '炒', '潮',
            '操你', '草', '懦夫', '鬼', '滚', '蛋', '口交', '坚挺', '奸', '歼', '男人', '女人', '寂寞', '难耐', '都懂', '孤独', '孤单',
            '刺激', '毒', '我日', '日本', '嘎', '@everyone'];
        for (let s of list) {
            tmp = tmp.replaceAll(s, ' ');
        }
        list = ['qq', 'vx', 'se', 'cpdd', 'fuck', 'shit', 'r18', 'nm', 'sl', 'sb', 'gov', 'cao', 'porn', 'jian'];
        for (let s of list) {
            tmp = tmp.replaceAll(new RegExp(s, 'ig'), ' ');
        }
        return tmp;
    }

    getheadlink(avatar) {
        let hid = avatar.match(/com\/(.*)\?t=/);
        if (hid && hid[0] && hid[1]) {
            hid = `h${hid[1]}`
        } else {
            hid = avatar.match(/&k=(.*)&t=/);
            if (hid && hid[0] && hid[1]) {
                hid = `k${encodeURIComponent(hid[1])}`
            } else {
                hid = 'h0';
            }
        }
        return `https://${global.miniappconfig.host}/s/${hid} `;
    }

    getRandomInteger(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    SecsToHour(secs) {
        let ret = 0;
        ret = secs / 60 / 60;
        return Math.floor(ret);
    }

    async addactiverecord(guildid, userid, statictype, clen, onlyimage, atrobot, phead, pnick) {
        let sets = await this.get_EventsSets_back(guildid, statictype);
        if (!sets || !sets[0]) return false;
        sets = sets[1][0];
        if (sets.useit != 'true') return false;
        try {
            sets = JSON.parse(sets.content);
        } catch (err) { return false; }
        if (statictype == '成员主题奖励设置' || statictype == '成员评论奖励设置') {
            if (clen < sets.needlength) return false;
        } else {
            if (atrobot && !sets.countatrobot) return false;
            if (onlyimage) {
                if (!sets.countimage) return false;
            } else {
                if (clen < sets.needlength) return false;
            }
        }

        let ret = await redis.incr(`ZuActiveDataRc:${statictype}:${guildid}:${userid}`);

        if (ret == 1) {
            await redis.expire(`ZuActiveDataRc:${statictype}:${guildid}:${userid}`, this.getTodayRestSecs());
            let count = await redis.incr(`ZuActiveContiDataRc:${statictype}:${guildid}:${userid}`, this.getTodayRestSecs() + 60 * 60 * 24);
            if (sets.setrolesb) {
                let check = sets.rolesb.filter(i => { return i.cnt == count });
                if (check.length > 0) {
                    check = check[0];
                    await client.memberApi.memberAddRole(guildid, check.roleid, userid);
                    if (check.time && check.time > 0) {
                        await this.write_exprole_change(guildid, check.roleid, userid, check.time);
                    }
                }
            }
            if (sets.setpointsb) {
                let check = sets.pointsb.filter(i => { return i.cnt == count });
                if (check.length > 0) {
                    check = check[0];

                    let head = 'https://q2.qlogo.cn/headimg_dl?dst_uin=10000&spec=100';
                    let nick = '待刷新';

                    if (phead && pnick) {
                        head = phead;
                        nick = pnick;
                    } else {
                        try {
                            let { data } = await client.guildApi.guildMember(guildid, userid);
                            if (data && data.roles && !data.user.bot) {
                                head = data.user.avatar;
                                nick = data.user.username;
                            } else {
                                return;
                            }
                        } catch (err) { }
                    }

                    let addret = await this.user_points_change(guildid, userid, check.point_id, check.pointcnt, head, nick);
                    if (addret) {
                        await this.addpointchangelog(guildid, userid, check.point_id, check.pointcnt, '活跃任务达成奖励', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                    }
                }
            }
        }

        if (sets.setrolesa) {
            sets.rolesa = sets.rolesa.slice(0, 3);
            let check = sets.rolesa.filter(i => { return i.cnt == ret });
            if (check.length > 0) {
                check = check[0];
                await client.memberApi.memberAddRole(guildid, check.roleid, userid);
                if (check.time && check.time > 0) {
                    await this.write_exprole_change(guildid, check.roleid, userid, check.time);
                }
            }
        }
        if (sets.setpointsa) {
            let check = sets.pointsa.filter(i => { return i.cnt == ret });
            if (check.length > 0) {
                check = check[0];

                let head = 'https://q2.qlogo.cn/headimg_dl?dst_uin=10000&spec=100';
                let nick = '待刷新';

                if (phead && pnick) {
                    head = phead;
                    nick = pnick;
                } else {
                    try {
                        let { data } = await client.guildApi.guildMember(guildid, userid);
                        if (data && data.roles && !data.user.bot) {
                            head = data.user.avatar;
                            nick = data.user.username;
                        } else {
                            return;
                        }
                    } catch (err) { }
                }

                let addret = await this.user_points_change(guildid, userid, check.point_id, check.pointcnt, head, nick);
                if (addret) {
                    await this.addpointchangelog(guildid, userid, check.point_id, check.pointcnt, '活跃任务达成奖励', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                }
            }
        }

    }

    async addAorVactiverecord(guildid, userid, statictype, secs) {
        let sets = await this.get_EventsSets_back(guildid, statictype);
        if (!sets || !sets[0]) return false;
        sets = sets[1][0];
        if (sets.useit != 'true') return false;
        try {
            sets = JSON.parse(sets.content);
        } catch (err) { return false; }

        let oldsecs = await redis.get(`ZuActiveDataRc:${statictype}:${guildid}:${userid}`);
        if (!oldsecs) {
            oldsecs = 0;
        }

        let ret = await redis.incrby(`ZuActiveDataRc:${statictype}:${guildid}:${userid}`, secs);

        if (ret == secs) {
            await redis.expire(`ZuActiveDataRc:${statictype}:${guildid}:${userid}`, this.getTodayRestSecs());
            let count = await redis.incr(`ZuActiveContiDataRc:${statictype}:${guildid}:${userid}`, this.getTodayRestSecs() + 60 * 60 * 24);
            if (sets.setrolesb) {
                let check = sets.rolesb.filter(i => { return i.cnt == count });
                if (check.length > 0) {
                    check = check[0];
                    await client.memberApi.memberAddRole(guildid, check.roleid, userid);
                    if (check.time && check.time > 0) {
                        await this.write_exprole_change(guildid, check.roleid, userid, check.time);
                    }
                }
            }
            if (sets.setpointsb) {
                let check = sets.pointsb.filter(i => { return i.cnt == count });
                if (check.length > 0) {
                    check = check[0];

                    let head = 'https://q2.qlogo.cn/headimg_dl?dst_uin=10000&spec=100';
                    let nick = '待刷新';
                    try {
                        let { data } = await client.guildApi.guildMember(guildid, userid);
                        if (data && data.roles && !data.user.bot) {
                            head = data.user.avatar;
                            nick = data.user.username;
                        } else {
                            return;
                        }
                    } catch (err) { }

                    let addret = await this.user_points_change(guildid, userid, check.point_id, check.pointcnt, head, nick);
                    if (addret) {
                        await this.addpointchangelog(guildid, userid, check.point_id, check.pointcnt, '活跃任务达成奖励', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                    }
                }
            }
        }
        let oldhour = this.SecsToHour(oldsecs);
        let nowhour = this.SecsToHour(ret);
        if (oldhour == nowhour) return false;
        if (nowhour <= 0) return false;

        if (sets.setrolesa) {
            sets.rolesa = sets.rolesa.slice(0, 3);
            let check = sets.rolesa.filter(i => { return i.cnt == nowhour });
            if (check.length > 0) {
                check = check[0];
                await client.memberApi.memberAddRole(guildid, check.roleid, userid);
                if (check.time && check.time > 0) {
                    await this.write_exprole_change(guildid, check.roleid, userid, check.time);
                }
            }
        }
        if (sets.setpointsa) {
            let check = sets.pointsa.filter(i => { return i.cnt == nowhour });
            if (check.length > 0) {
                check = check[0];

                let head = 'https://q2.qlogo.cn/headimg_dl?dst_uin=10000&spec=100';
                let nick = '待刷新';
                try {
                    let { data } = await client.guildApi.guildMember(guildid, userid);
                    if (data && data.roles && !data.user.bot) {
                        head = data.user.avatar;
                        nick = data.user.username;
                    } else {
                        return;
                    }
                } catch (err) { }

                let addret = await this.user_points_change(guildid, userid, check.point_id, check.pointcnt, head, nick);
                if (addret) {
                    await this.addpointchangelog(guildid, userid, check.point_id, check.pointcnt, '活跃任务达成奖励', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
                }
            }
        }

    }

    async AorVrecordStart(guildid, userid, statictype, time) {

        let sets = await this.get_EventsSets_back(guildid, statictype);
        if (!sets || !sets[0]) return false;
        sets = sets[1][0];
        if (sets.useit != 'true') return false;
        try {
            sets = JSON.parse(sets.content);
        } catch (err) { return false; }

        if (!sets.setrolesa && !sets.setpointsa) return false;

        await redis.set(`AorVrecordSS:${statictype}:${guildid}:${userid}`, time, 60 * 60 * 24);
    }

    async AorVrecordEnd(guildid, userid, statictype, time) {

        let lasttime = await redis.get(`AorVrecordSS:${statictype}:${guildid}:${userid}`);
        if (!lasttime) return false;
        await redis.del(`AorVrecordSS:${statictype}:${guildid}:${userid}`);
        let diffsec = Math.floor((time - lasttime) / 1000);
        if (diffsec > 10) {
            await this.addAorVactiverecord(guildid, userid, statictype, diffsec);
        }
    }

    async SAorVrecordStart(guildid, channelid, userid, eventname, enter, time) {

        let sets = await this.get_EventsSets_(guildid, channelid, eventname, enter);
        if (!sets || !sets[0]) return false;
        sets = sets[1][0];
        if (sets.useit != 'true') return false;
        if (!sets.tochannel || !sets.content) return false;

        await redis.set(`SAorVrecordSS:${eventname}:${guildid}:${userid}`, time, 60 * 60 * 24);

        return sets;
    }

    async SAorVrecordEnd(guildid, channelid, userid, eventname, enter, time) {
        let lasttime = await redis.get(`SAorVrecordSS:${eventname}:${guildid}:${userid}`);
        if (!lasttime) return false;
        await redis.del(`SAorVrecordSS:${eventname}:${guildid}:${userid}`);
        let diffsec = Math.floor((time - lasttime) / 1000);
        if (diffsec > 10) {
            let sets = await this.get_EventsSets_(guildid, channelid, eventname, enter);
            if (!sets || !sets[0]) return false;
            sets = sets[1][0];
            if (sets.useit != 'true') return false;
            if (!sets.tochannel || !sets.content) return false;
            return [diffsec, sets];
        }
        return false;
    }

    async checkifhitfdbrule(id, message, imgs, nick) {
        if (id.length < 13) return '';
        let check = await this.gdata_forbidden_wordsdb(id);
        let content = `${imgs}|${message}|${nick}`;
        if (check && check[0]) {
            let words = check[0].words;
            if (words) {
                let arr = words.split('|').filter(i => { return i != '' });
                for (let s of arr) {
                    if (content.includes(s)) {
                        return s;
                    }
                }
            }
        }
        return '';
    }

    async imgs2img(imgs,text) {
        if (imgs.length > 1 || text) {
            let answer = { Groups: [] };
            let index = -1;
            if (text) {
                index++;
                answer.Groups[index] = { text: '' };
                answer.Groups[index].text = text;
            }
            for (let s of imgs) {
                index++;
                answer.Groups[index] = { url: '' };
                answer.Groups[index].url = s;
            }
            answer.resourcepath = this.get_resourcepath();
            let html = await render(this.get_template('image'), answer);
            let img = await webview.screenshot({ render_ret: html, data: answer, nocache: true });
            return img;
        } else if (imgs.length == 1) {
            let link = imgs[0];
            let img = await ext.getImageByUrl(link);
            return img;
        }
        return false;
    }

    async check_cpermission(roles, guildid, command) {
        if (roles.includes('4')) return true;
        if (roles.includes('2') && guildid == global.miniappconfig.Auditguildid) return true;
        let s = await this.get_EventsSets(guildid, '管理指令权限设置');
        if (s[0]) {
            try {
                let ls = JSON.parse(s[1][0].content).filter(i => { return i.c == command });
                if (ls.length == 1) {
                    let r = ls[0].p;
                    let check = roles.filter(i => {
                        return r.includes(`|${i}|`);
                    })
                    return check.length > 0;
                }
            } catch (err) { return false; }
        }
        return false;
    }

    async check_cpermission_safe(roles, guildid, command, channel) {
        if (roles.includes('4')) return '';
        if (roles.includes('2') && guildid == global.miniappconfig.Auditguildid) return '';
        let s = await this.get_EventsSets_back(guildid, '非危险指令权限设置');
        if (s[0]) {
            try {
                let ls = JSON.parse(s[1][0].content).filter(i => { return i.c == command });
                if (ls.length == 1) {
                    let r = ls[0].p;
                    let check = roles.filter(i => {
                        return r.includes(`|${i}|`);
                    })
                    if (check.length > 0) {
                        if (ls[0]?.fixchannel) {
                            if (ls[0].fixchannel != '' && ls[0].fixchannel != channel) {
                                return `当前子频道不支持此指令，请前往<#${ls[0].fixchannel}>使用`;
                            }
                        }
                        return '';
                    } else {
                        return '抱歉，您所在身份组无法使用该指令';
                    }
                }
            } catch (err) { return '抱歉，您所在身份组无法使用该指令'; }
        }
        return '抱歉，您所在身份组无法使用该指令';
    }

    async check_cpermission_tools(guildid, command, channel) {
        let s = await this.get_EventsSets_back(guildid, '便民指令设置');
        if (s[0]) {
            try {
                let ls = JSON.parse(s[1][0].content).filter(i => { return i.c == command });
                if (ls.length == 1) {

                    if (!ls[0].on) return { code: 403, points: false, msg: '本频道未开启此指令' };

                    if (ls[0]?.fixchannel) {
                        if (ls[0].fixchannel != '' && ls[0].fixchannel != channel) {
                            return { code: 403, points: false, msg: `当前子频道不支持此指令，请前往<#${ls[0].fixchannel}>使用` };
                        }
                    }

                    if (ls[0].points.on && ls[0].points.point_id && ls[0].points.point_cnt) {
                        return { code: 0, points: ls[0].points, msg: '' };
                    } else {
                        return { code: 0, points: false, msg: '' };
                    }
                }
            } catch (err) {
                return { code: 403, points: false, msg: '本频道未开启此指令' };
            }
        }
        return { code: 403, points: false, msg: '本频道未开启此指令' };
    }

    async clearMysqldatas() {

        let stmt = 'DELETE FROM systemlogs WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (3 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guildsgoodslogs WHERE time<? AND finish=?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (7 - 1)), '1'], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guildsgoodslogs WHERE time<? AND finish=?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (30 - 1)), '0'], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM blacklists WHERE last_black_time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (7 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guild_users_points WHERE lasttime<? AND workdays<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (30 - 1)), 1], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guild_users_points WHERE lasttime<? AND time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (30 - 1)), (Date.now() - 1000 * 60 * 60 * 24 * (180 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guserpayrecord WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (180 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM QQApplication WHERE lastlogintime<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24)], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guild_users_reaction WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (3 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM gupointschangelogs WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (3 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM Office_taskList WHERE creattime<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24)], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guildgoodsdaylog WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (1 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM guildgoodsdayuserlog WHERE time<?';
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24 * (7 - 1))], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

    }

    async readguildsets(guildid) {

        let check = await redis.get(`ZuCache:GuildSetsInfoC:${guildid}`);
        if (check) {
            return JSON.parse(check);
        }

        let stmt = 'SELECT * FROM Guilds WHERE guildid = ?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, guildid, (err, rows) => {
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
                global.pool_message.query(stmt, [guildid, Date.now() + 604800000, JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), '', '', '', Date.now() + 604800000, JSON.stringify({ psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' }), ''], (err, rows) => {
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

    async mqupguildinfo(guildid, head, name, owner) {

        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query('UPDATE Guilds SET head=?,name=?,points=? WHERE guildid=?', [head, name, owner, guildid], (err, rows) => {
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

    async check_isexpir(guildid) {
        let ret = await this.readguildsets(guildid);
        if (guildid == global.miniappconfig.Auditguildid) return false;
        if (ret) {
            return ret.expiration_time < Date.now();
        }
        return true;
    }

    async punish_notify(guildid, content, msgid) {
        let ret = await this.readguildsets(guildid);
        if (ret) {
            try {
                let obj = JSON.parse(ret.sets);
                if (obj.notifyid) {
                    await ext.SendMessage({ guild_id: guildid, channel_id: obj.notifyid, msg_id: msgid, content: content });
                }
            } catch (err) { }
        }
    }

    async gdata_forbidden_words(guildid) {

        let check = await redis.get(`ZuCache:ForbiddenWordsSC:${guildid}`);
        if (check) {
            if (check == 'false') return false;
            return JSON.parse(check);
        }

        let stmt = `SELECT keyword,enabled_channels,deal_type,op_time,notifytext,saferoles FROM forbidden_words WHERE guildid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (!rows || !rows[0]) {
            await redis.set(`ZuCache:ForbiddenWordsSC:${guildid}`, 'false', 120);
            return false;
        } else {
            await redis.set(`ZuCache:ForbiddenWordsSC:${guildid}`, JSON.stringify(rows), 120);
            return rows;
        }
    }

    async gdata_forbidden_words_nick(guildid) {

        let check = await redis.get(`ZuCache:ForbiddenWordsNickSC:${guildid}`);
        if (check) {
            if (check == 'false') return false;
            return JSON.parse(check);
        }

        let stmt = `SELECT keyword,deal_type FROM forbidden_words_nick WHERE guildid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (!rows || !rows[0]) {
            await redis.set(`ZuCache:ForbiddenWordsNickSC:${guildid}`, 'false', 120);
            return false;
        } else {
            await redis.set(`ZuCache:ForbiddenWordsNickSC:${guildid}`, JSON.stringify(rows), 120);
            return rows;
        }
    }

    async gdata_reply_keywords(guildid) {

        let check = await redis.get(`ZuCache:ReplayKeyWordsSC:${guildid}`);
        if (check) {
            if (check == 'false') return false;
            return JSON.parse(check);
        }

        let stmt = `SELECT enabled_channels,keyword,content,image,cd,approved FROM reply_keywords_answers WHERE guildid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (!rows || !rows[0]) {
            await redis.set(`ZuCache:ReplayKeyWordsSC:${guildid}`, 'false', 120);
            return false;
        } else {
            await redis.set(`ZuCache:ReplayKeyWordsSC:${guildid}`, JSON.stringify(rows), 120);
            return rows;
        }
    }

    async gdata_forbidden_wordsdb(id) {

        let check = await redis.get(`ZuCache:FWordsDBSC:${id}`);
        if (check) {
            if (check == 'false') return false;
            return JSON.parse(check);
        }

        let stmt = `SELECT words FROM ForbiddenWordsDB WHERE id=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (!rows || !rows[0]) {
            await redis.set(`ZuCache:FWordsDBSC:${id}`, 'false', 120);
            return false;
        } else {
            await redis.set(`ZuCache:FWordsDBSC:${id}`, JSON.stringify(rows), 120);
            return rows;
        }
    }

    async match_forbidden_words(message, guildid, attachments, nick) {
        if (message && message != '') {
            let arr = await this.gdata_forbidden_words(guildid);
            try {
                if (arr && arr.length > 0) {
                    let farr = arr.filter(i => {
                        let reg = new RegExp(i.keyword, 'gi');
                        return reg.test(message);
                    });
                    if (farr && farr.length > 0) {
                        return [true, farr];
                    }
                }
            } catch (err) { }
        }

        if (!message && !attachments && !nick) return [false];

        let esets = await this.get_EventsSets_back(guildid, '敏感词库处罚策略');
        if (esets && esets[0]) {
            let arr = esets[1][0].content;
            let imgs = this.get_imghash(attachments).join('|');
            try {
                arr = JSON.parse(arr);
                if (arr && arr.length > 0) {
                    let farr = [];
                    for (let ss of arr) {
                        let keyword = await this.checkifhitfdbrule(ss.id, message, imgs, nick);
                        if (keyword && keyword != '') {
                            farr.push({ ...ss, keyword: keyword });
                        }
                    }
                    if (farr && farr.length > 0) {
                        return [true, farr];
                    }
                }
            } catch (err) { }
        }
        return [false];
    }

    async getcoworksets(guildid) {
        let esets = await this.get_EventsSets_back(guildid, '成员打卡设置');
        if (esets && esets[0]) {
            let ret = esets[1][0];
            if (ret.useit != 'true') {
                return false;
            }
            try {
                ret.content = JSON.parse(ret.content);
                return ret;
            } catch (err) {
                return false;
            }
        }
        return false;
    }

    async getofficetasksets(guildid) {
        let esets = await this.get_EventsSets_back(guildid, '值班室设置');
        if (esets && esets[0]) {
            let ret = esets[1][0];
            if (ret.useit != 'true') {
                return false;
            }
            try {
                ret.content = JSON.parse(ret.content);
                return ret;
            } catch (err) {
                return false;
            }
        }
        return false;
    }

    async officetaskssetsref(guildid, content) {

        let stmt = `UPDATE EventsSets_back SET content=? WHERE guildid=? AND name=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [JSON.stringify(content), guildid, '值班室设置'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows.affectedRows>0) {
            await redis.del(`ZuCache:EventsSetsICB:${guildid}:值班室设置`);
            return true;
        } else {
            return false;
        }
    }

    async match_forbidden_words_nick(nick, guildid) {
        let arr = await this.gdata_forbidden_words_nick(guildid);
        try {
            if (arr && arr.length > 0) {
                let farr = arr.filter(i => {
                    let reg = new RegExp(i.keyword, 'gi');
                    return reg.test(nick);
                });
                if (farr && farr.length > 0) {
                    return [true, farr];
                }
            }
        } catch (err) { }
        return [false];
    }

    async match_reply_keywords(message, guildid) {
        let arr = await this.gdata_reply_keywords(guildid);
        try {
            if (arr && arr.length > 0) {
                let farr = arr.filter(i => {
                    let reg = new RegExp(i.keyword, 'gi');
                    return reg.test(message);
                });
                if (farr && farr.length > 0) {
                    return [true, farr];
                }
            }
        } catch (err) { }
        return [false];
    }

    async get_EventsSets(guildid, eventname) {      

        let check = await redis.get(`ZuCache:EventsSetsIC:${guildid}:${eventname}`);
        if (check) {
            return JSON.parse(check);
        }

        let stmt = `SELECT fromchannel,tochannel,useit,image,content,name FROM EventsSets WHERE guildid=? AND name=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt,[guildid, eventname], (err, rows) => {
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

    async get_EventsSets_(guildid, fromchannel, eventname, enter) {
        let check = await this.get_EventsSets(guildid, eventname);
        if (check[0]) {
            try {
                let data = {};
                data.useit = check[1][0].useit;
                let obj = JSON.parse(check[1][0].content);
                data.content = enter ? obj?.ca : obj?.cb;
                let s = obj.ls.filter(i => {
                    return i.fromcs.filter(ii => {
                        return (ii.id == fromchannel || ii.id == '2002');
                    }).length > 0;
                })

                if (s.length > 0) {
                    data.tochannel = enter ? s[0]?.toca : s[0]?.tocb;
                    if (s[0].ca && enter) data.content = s[0].ca;
                    if (s[0].cb && !enter) data.content = s[0].cb;
                    return [true, [data]];
                }
                
            } catch (err) { }
            return [false];
        } else {
            return [false];
        }
    }

    async get_EventsSets_back(guildid, eventname) {

        let check = await redis.get(`ZuCache:EventsSetsICB:${guildid}:${eventname}`);
        if (check) {
            return JSON.parse(check);
        }

        let stmt = `SELECT fromchannel,tochannel,useit,image,content,name FROM EventsSets_back WHERE guildid=? AND name=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, eventname], (err, rows) => {
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

    async get_EventsSets_back_(guildid, fromchannel, eventname, enter) {
        let check = await this.get_EventsSets_back(guildid, eventname);
        if (check[0]) {
            try {
                let data = {};
                data.useit = check[1][0].useit;
                let obj = JSON.parse(check[1][0].content);
                data.content = enter ? obj?.ca : obj?.cb;
                let s = obj.ls.filter(i => {
                    return i.fromcs.filter(ii => {
                        return (ii.id == fromchannel || ii.id == '2002');
                    }).length > 0;
                })

                if (s.length > 0) {
                    data.tochannel = enter ? s[0]?.toca : s[0]?.tocb;
                    if (s[0].ca && enter) data.content = s[0].ca;
                    if (s[0].cb && !enter) data.content = s[0].cb;
                    return [true, [data]];
                }

            } catch (err) { }
            return [false];
        } else {
            return [false];
        }
    }

    async check_ifhitrule(guildid, fromchannel, content, hasimage) {
        let check = await this.get_EventsSets(guildid, '子频道发言格式限制');
        if (check[0]) {
            if (check[1][0].useit == 'true') {

                try {
                    let obj = JSON.parse(check[1][0].content);
                    let s = obj.ls.filter(i => {
                        return i.fromcs.filter(ii => {
                            return (ii.id == fromchannel || ii.id == '2002');
                        }).length > 0;
                    })
                    if (s.length > 0) {

                        if (hasimage) return true;
                        if (content == '<文件>') return true;
                        if (content == '<第三方卡片>') return true;
                        if (content == '<分享>') return true;
                        if (content == '<QQ小世界>') return true;
                        if (content == '<QQ小程序>') return true;
                        if (content == '<QQ红包>') return true;

                        return !(new RegExp(s[0].ca, 'g').test(content));
                    }
                } catch (err) { }
            }
        }
        return false;
    }

    async check_ifhitlevellimit(msg) {
        let check = await this.get_EventsSets(msg.guild_id, '各等级成员发言限制');
        if (check[0]) {
            if (check[1][0].useit == 'true') {
                let level = this.check_level(msg.member.roles);
                try {
                    let obj = JSON.parse(check[1][0].content);
                    let s = obj.ls.filter(i => {
                        return level <= i.level && !i?.channels?.includes(`|${msg.channel_id}|`);
                    });
                    if (s.length > 0) {
                        let arr = [];
                        s.map(i => {
                            arr.push(...i.bdtypes);
                        })
                        let t = msg.content;
                        if (t) {
                            if (t == '当前版本不支持查看，请升级QQ版本') {
                                if (arr.includes('文件')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') {
                                if (arr.includes('第三方卡片')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[分享]')) {
                                if (arr.includes('分享')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ小世界]')) {
                                if (arr.includes('QQ小世界')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ小程序]')) {
                                if (arr.includes('QQ小程序')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ红包]')) {
                                if (arr.includes('QQ红包')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('<不支持的消息>')) {
                                if (arr.includes('<不支持的消息>')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.replaceAll(/<(@!?|#|emoji:)\d+>/g, '').match(/\d+/) && arr.includes('数字')) return true;
                            if (t.match(/(http|https|ftp)?:?\/?\/?(\b\S+ *(\.|点|。) *)+\w{2,}\b/g) && arr.includes('链接')) return true;
                            if (t.match(/<@!?\d+>/g) && arr.includes('艾特消息')) return true;
                            if (arr.includes('文本消息') && t != '[分享]' && t != '[QQ小世界]' && t != '[QQ小程序]' && t != '[QQ红包]' && t != '<不支持的消息>') return true;
                        }
                        let imgs = msg?.attachments?.filter(i => {
                            return i.content_type.startsWith('image');
                        })
                        if (imgs && imgs.length > 0 && arr.includes('图片消息')) return true;
                        
                    }
                } catch (err) { }
            }
        }
        return false;
    }

    async check_ifhitlevellimit_thread(guildid) {
        let check = await this.get_EventsSets(guildid, '各等级成员发言限制');
        if (check[0]) {
            if (check[1][0].useit == 'true') {
                try {
                    let obj = JSON.parse(check[1][0].content);
                    let s = obj.ls.filter(i => {
                        return i.bdtypes.includes('主题');
                    });
                    if (s.length > 0) {
                        return s;
                    }
                } catch (err) { }
            }
        }
        return false;
    }

    async check_ifhitchannellimit(msg) {
        let check = await this.get_EventsSets(msg.guild_id, '子频道发言类型限制');
        if (check[0]) {
            if (check[1][0].useit == 'true') {
                try {
                    let obj = JSON.parse(check[1][0].content);

                    let s = obj.ls.filter(i => {
                        for (let sss of i.fromcs) {
                            if (sss.id == msg.channel_id || sss.id == '2002') {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (s.length > 0) {
                        let arr = [];
                        s.map(i => {
                            arr.push(...i.bdtypes);
                        })
                        let t = msg.content;
                        if (t) {
                            if (t == '当前版本不支持查看，请升级QQ版本') {
                                if (arr.includes('文件')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t == '当前版本不支持该消息类型，请使用最新版本手机QQ查看') {
                                if (arr.includes('第三方卡片')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[分享]')) {
                                if (arr.includes('分享')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ小世界]')) {
                                if (arr.includes('QQ小世界')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ小程序]')) {
                                if (arr.includes('QQ小程序')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('[QQ红包]')) {
                                if (arr.includes('QQ红包')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.includes('<不支持的消息>')) {
                                if (arr.includes('<不支持的消息>')) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            if (t.replaceAll(/<(@!?|#|emoji:)\d+>/g, '').match(/\d+/) && arr.includes('数字')) return true;
                            if (t.match(/(http|https|ftp)?:?\/?\/?(\b\S+ *(\.|点|。) *)+\w{2,}\b/g) && arr.includes('链接')) return true;
                            if (t.match(/<@!?\d+>/g) && arr.includes('艾特消息')) return true;
                            if (arr.includes('文本消息')) return true;
                        }
                        let imgs = msg?.attachments?.filter(i => {
                            return i.content_type.startsWith('image');
                        })
                        if (imgs && imgs.length > 0 && arr.includes('图片消息')) return true;

                    }
                } catch (err) { }
            }
        }
        return false;
    }

    async s_writelog(guildid, userid, usernick, userhead, userrole, log) {

        let msg = log;
        msg = msg.replaceAll('\r\n', '\r');
        msg = msg.replaceAll('\n', '\r');
        msg = msg.replaceAll('\r', '\r\n');

        let stmt = 'INSERT INTO systemlogs VALUES (?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, userid, usernick, userhead, userrole, Date.now(), msg], (err, ret) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(ret);
                }
            })
        }).catch(err => { console.error(err) });
        return ret && ret.affectedRows > 0;
    }

    async get_TasksList_all() {
        let stmt = `SELECT * FROM TasksListK`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt,[], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows[0]) {
            return [true, rows];
        } else {
            return [false];
        }
    }

    async write_blacklists(guildid, user_id, is_black, black_reason, black_admin, deblack_reason, deblack_admin, usernick, userhead) {
        let stmt;
        let ret;

        let blktime;

        if (is_black) {
            blktime = Date.now();
        } else {
            blktime = 0;
        }


        if (is_black) {
            stmt = 'INSERT INTO blacklists VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE is_black=?,last_black_time=?,black_reason=?,black_admin=?,usernick=?,userhead=?';
            ret = await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [guildid, user_id, usernick, userhead, is_black, blktime, black_reason, black_admin, deblack_reason, deblack_admin, true, Date.now(), black_reason, black_admin, usernick, userhead], (err, msg) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(msg);
                    }
                });
            }).catch((err) => { console.error(err) });
        } else {
            stmt = 'INSERT INTO blacklists VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE is_black=?,deblack_reason=?,deblack_admin=?';
            ret = await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [guildid, user_id, usernick, userhead, is_black, blktime, black_reason, black_admin, deblack_reason, deblack_admin, false, deblack_reason, deblack_admin], (err, msg) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(msg);
                    }
                });
            }).catch((err) => { console.error(err) });
        }

        if (ret && ret.affectedRows > 0) {
            await redis.del(`ZuCache:UserBlackList:${guildid}`);
            return true;
        } else {
            return false;
        }

    }

    async gdata_userblack(guildid) {

        let check = await redis.get(`ZuCache:UserBlackList:${guildid}`);
        if (check) {
            if (check == 'false') return false;
            return JSON.parse(check);
        }

        let stmt = `SELECT is_black,user_id FROM blacklists WHERE guildid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (!rows || !rows[0]) {
            await redis.set(`ZuCache:UserBlackList:${guildid}`, 'false', 120);
            return false;
        } else {
            await redis.set(`ZuCache:UserBlackList:${guildid}`, JSON.stringify(rows), 120);
            return rows;
        }
    }

    async ifhas_black(guildid, user_id) {
        let arr = await this.gdata_userblack(guildid);
        if (arr) {
            for (let s of arr) {
                if (s.user_id == user_id) {
                    return [true, [s]];
                }
            }
        }
        return [false];
    }

    async del_guild_users_points(guildid, user_id) {
        let stmt = 'DELETE FROM guild_users_points WHERE guildid=? AND user_id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret.affectedRows > 0) {
            await this.clearupointsandlogs(guildid, user_id);
            return true;
        } else {
            return false;
        }
    }
   
    async ifhas_guild_users_points(guildid, user_id) {
        let stmt = 'SELECT points,warning_counts,workdays,cot_workdays FROM guild_users_points WHERE guildid=? AND user_id=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt,[guildid, user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (!rows || !rows[0]) return [false];
        return [true, rows];
    }

    async user_worningcount_add(guildid, user_id, addcnt) {

        let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        });

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

    async user_worningcount_reset(guildid, user_id) {

        let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        });

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

    async user_worningcount_reset_alluser(guildid) {

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT warning_counts FROM guild_users_points WHERE guildid=? FOR UPDATE';
            let rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid], (err, rows) => {
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
                return true;
            } else {

                let stmt = 'UPDATE guild_users_points SET warning_counts=?,lasttime=? WHERE guildid=?';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [0, Date.now(), guildid], (err, rows) => {
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
                    return true;
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

    async check_ifhitworningsets(guildid, user_id, nowcnt) {
        let time = Date.now();
        let Ulogs = await this.getUlogs(guildid, user_id);
        let systemsets = await this.get_system_worningsets(guildid);
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

    async getUlogs(guildid, userid) {
        let stmt = 'SELECT time,logs FROM systemlogs WHERE guildid=? AND userid=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, userid], (err, rows) => {
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

    async getThreadShortLink(guildid, channelid, threadid) {
        return `https://${global.miniappconfig.host}/s/t${threadid}`;
    }

    async get_system_worningsets(guildid) {
        let ret = await this.readguildsets(guildid);
        if (ret) {
            let sets = JSON.parse(ret.sets);
            return sets;
        }
        return { psets: [{ cnt: 3, type: 0, checktime: 10, ptype: 0, ptime: 300, reset: false }], notifyid: '' };
    }

    async write_exprole(guildid, role_id,user_id, seconds) {
        let stmt = 'INSERT INTO ExpRoles VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE exp_time=IF(exp_time<?,?,exp_time+?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, role_id, user_id, Date.now() + seconds * 1000, Date.now(), Date.now() + seconds * 1000, seconds * 1000], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async write_exprole_change(guildid, role_id, user_id, seconds) {
        let stmt = 'INSERT INTO ExpRoles VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE exp_time=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, role_id, user_id, Date.now() + seconds * 1000, Date.now() + seconds * 1000], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async deltarget_exprole(guildid, role_id, user_id) {
        let stmt = 'DELETE FROM ExpRoles WHERE guildid=? AND role_id=? AND user_id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, role_id, user_id], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async del_exproles(nowtime) {
        let stmt = 'DELETE FROM ExpRoles WHERE exp_time<=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [nowtime], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async fetch_exproles(nowtime) {
        let stmt = 'SELECT guildid,role_id,user_id FROM ExpRoles WHERE exp_time<=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [nowtime], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret[0]) {
            if (await this.del_exproles(nowtime)) {
                return ret;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    async del_caroles(guildid, role_id, user_id) {
        let stmt = 'DELETE FROM ExpRoles WHERE guildid=? AND role_id=? AND user_id=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, role_id, user_id], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async write_expimg(hash, width, height) {
        let stmt = 'INSERT INTO ExpImgs VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE width=?,height=?,last_time=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [hash, width, height, Date.now(), '1', width, height, Date.now()], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async del_expimgs(nowtime) {
        let stmt = 'DELETE FROM ExpImgs WHERE last_time<=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(nowtime - 1000 * 60 * 60 * 24 * 60)], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async check_expimgs(nowtime) {
        return true;

        let stmt = 'SELECT hash FROM ExpImgs WHERE last_time<=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(nowtime - 1000 * 60 * 60 * 24 * 60)], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret[0]) {
            if (await this.del_expimgs(nowtime)) {
                for (let ss of ret) {
                    let sp = `${dir}\\图片\\${ss.hash}.png`;
                    try {
                        await fs.promises.unlink(sp);
                    } catch (err) { }
                }
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    async ref_expimgtime(hash) {
        let stmt = 'UPDATE ExpImgs SET last_time=? WHERE hash=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [Date.now(), hash], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async check_upointtasks() {
        let stmt = 'SELECT * FROM gupointsresettasks WHERE useit=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, ['1'], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret.length > 0) {

            let date = new Date();
            let month = date.getMonth() + 1;
            let weekday = date.getDay();
            if (weekday == 0) weekday = 7;
            let day = date.getDate();
            let hour = date.getHours();

            for (let ss of ret) {
                if (!(ss.hours.trim() == '*' || ss.hours.split(',').includes(hour.toString()))) {
                    continue;
                }
                if (!(ss.weekdays.trim() == '*' || ss.weekdays.split(',').includes(weekday.toString()))) {
                    continue;
                }
                if (!(ss.days.trim() == '*' || ss.days.split(',').includes(day.toString()))) {
                    continue;
                }
                if (!(ss.moths.trim() == '*' || ss.moths.split(',').includes(month.toString()))) {
                    continue;
                }
                await this.upoints_reset(ss.guildid, ss.point_id, ss.resetpoint);
                await this.addpointchangelog(ss.guildid, 0, ss.point_id, ss.resetpoint, '系统定时重置积分', '14753227080502839767', '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
            }

            return true;
        } else {
            return false;
        }
    }

    async fetch_imginfo(hash) {

        let check = await redis.get(`ZuCache:ImageInfoTmpC:${hash}`);
        if (check) {
            return JSON.parse(check);
        }

        let stmt = 'SELECT height,width FROM ExpImgs WHERE hash=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [hash], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        if (ret && ret[0]) {
            if (await this.ref_expimgtime(hash)) {
                await redis.set(`ZuCache:ImageInfoTmpC:${hash}`, JSON.stringify(ret[0]), 600);
                return ret[0];
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    async clear_expinvitecodes(nowtime) {
        let stmt = 'DELETE FROM InviteCodes WHERE exp_time<=?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [nowtime], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async check_Messages(guildid, channel, seq) {

        let check = await redis.get(`ZuCMG:${guildid}:${channel}:${seq}`);
        if (!check) return [false];
        return [true, check];

    }

    async write_Messages(guildid, channel, seq, msg) {

        await redis.set(`ZuCMG:${guildid}:${channel}:${seq}`, msg, 300);
        return true;

    }

    async check_notSupportMessages(guildid, channel, seq) {
        let check = await redis.mget([`ZuCMG:${guildid}:${channel}:${seq - 1}`, `ZuCMG:${guildid}:${channel}:${seq - 2}`]);
        if (!check[0] && check[1]) {
            let arr = [seq - 1];
            await this.write_Messages(guildid, channel, seq - 1, '{}');
            return arr;
        } else {
            return false;
        }
    }

    async write_HistoryMessage(content) {
        let stmt = `INSERT INTO HistoryMessages VALUES (?,?,?)`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [0, content, Date.now()], (err, rows) => {
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

    async clear_Messages() {

        let stmt = `DELETE FROM HistoryMessages WHERE time<?`;
        await new Promise((resolve, reject) => {
            global.pool_tasks.query(stmt, [(Date.now() - 1000 * 60 * 60 * 24)], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

    }

    async GetMid(guildid, ifevent) {

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

    async write_MessagesId(guildid, type, msgid) {
        let stmt = `INSERT INTO MessagesId VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=?,time=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, type, msgid, Date.now(), msgid, Date.now()], (err, rows) => {
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

    async check_User_Reaction(guildid, user_id, action_id) {
        let stmt = `SELECT user_id FROM guild_users_reaction WHERE guildid=? AND user_id=? AND actionid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, action_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows[0]) {
            return true;
        } else {
            return false;
        }
    }

    async write_User_Reaction(guildid, user_id, action_id) {
        let stmt = `INSERT IGNORE INTO guild_users_reaction VALUES (?,?,?,?)`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, action_id, Date.now()], (err, rows) => {
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

    async del_User_Reaction(guildid, user_id, action_id) {
        let stmt = `DELETE FROM guild_users_reaction WHERE guildid=? AND user_id=? AND actionid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, action_id], (err, rows) => {
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

    async check_User_Reactions(guildid, user_id) {
        let stmt = `SELECT actionid FROM guild_users_reaction WHERE guildid=? AND user_id=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });

        if (rows && rows[0]) {
            return rows.length;
        } else {
            return false;
        }
    }

    async del_worninglogs_user(guildid, userid) {

        let stmt = `DELETE FROM systemlogs WHERE guildid=? AND userid=? AND (logs LIKE ? OR logs LIKE ?)`;
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, userid, '%被警告一次%','%被管理员警告%'], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async del_worninglogs_guild(guildid) {

        let stmt = `DELETE FROM systemlogs WHERE guildid=? AND (logs LIKE ? OR logs LIKE ?)`;
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, '%被警告一次%', '%被管理员警告%'], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        return ret && ret.affectedRows > 0;
    }

    async user_points_change(guildid, user_id, point_id, changecnt, head, nick) {

        if (changecnt > 0) {
            let stmt = 'INSERT IGNORE INTO guild_users_points_new VALUES (?,?,?,?,?,?,?)';
            await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [guildid, user_id, point_id, 0, Date.now(), head, nick], (err, msg) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(msg);
                    }
                });
            });
        }

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

    async users_points_change(guildid, users, point_id, changecnt, opreason, opuserid, opusernick, opuserhead, reset) {

        let parr = users.map(i => {
            return [guildid, i.id, point_id, 0, Date.now(), i.avatar, i.username];
        });

        let stmt = 'INSERT IGNORE INTO guild_users_points_new VALUES ?';
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [parr], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        });

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT * FROM guild_users_points_new WHERE guildid=? AND user_id IN (?) AND point_id=? FOR UPDATE';
            let rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, users.map(i => { return i.id }), point_id], (err, rows) => {
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

                let nowtime = Date.now();
                let retarr = [];
                if (reset && changecnt < 0) changecnt = 0;
                rows = rows.map(i => {
                    let camount = 0;
                    if (reset) {
                        camount = changecnt - i.points;
                        i.points = changecnt;
                    } else {
                        if (i.points + changecnt < 0) {
                            camount = -1 * i.points;
                            i.points = 0;
                        } else {
                            camount = changecnt;
                            i.points = i.points + changecnt;
                        }
                    }
                    i.lasttime = nowtime;
                    retarr.push([0, guildid, i.user_id, point_id, camount, opreason || '管理手动变更', nowtime, opuserid, opusernick, opuserhead]);
                    return [i.guildid, i.user_id, i.point_id, i.points, i.lasttime, i.head, i.nick];
                });
                let stmt = `INSERT INTO guild_users_points_new VALUES ? ON DUPLICATE KEY UPDATE points=values(points),lasttime=values(lasttime)`;
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [rows], (err, rows) => {
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
                    await this.addpointchangelogs(retarr);
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

    async write_office_task(guildid, fromuser, tasktype, mida, midb) {
        let stmt = 'INSERT INTO Office_taskList VALUES (?,?,?,?,?,?,?,?)';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, fromuser, tasktype, 0, mida, midb, '0', Date.now()], (err, rows) => {
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

    async punish_office_forbiddenword(guildid, mida, taskid, msgid, channel, isreplay) {

        let ret = await this.get_EventsSets_back(guildid, '值班室设置');
        if (ret[0]) {
            ret = ret[1][0];
            try {
                ret.content = JSON.parse(ret.content);
            } catch (err) { }
            ret.useit = (ret.useit == 'true' ? true : false);

            if (!ret.useit) return;
            if (!ret.tochannel) return;

            let users = ret.content;
            users = this.get_today_users(users);
            let s2 = encodeURIComponent(`pages/functions/officetasks/officetasks?guildID=${guildid}`);
            let content = '';
            if (isreplay == true) {
                content = `${users}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${channel}>\r\r> 该发言是对主题的评论，机器人无法撤回，请前往对应子频道手动撤回\r\r`
            } else {
                content = `${users}新的值班任务待处理\r任务id：${taskid}\r任务类型：处理违禁词\r来源子频道：<#${channel}>\r`;
            }
            let md = this.get_markdown_office(content,
                [
                    { before: '发送内容：', content: '点击查看', link: `https://${global.miniappconfig.host}/s/m${mida}` },
                    { before: '\r高度自定义处理入口：', content: '点击处理', link: `https://m.q.qq.com/a/p/${global.miniappconfig.appid}?s=${s2}` }
                ],
                '请使用第一行按钮进行处罚操作，若用户无违规，请点击[🔊解禁]或[🔒关闭任务]，更多自定义操作请进入小程序'
            );
            let sendresult = await ext.SendMessage({ guild_id: guildid, channel_id: ret.tochannel, markdown: md, keyboard: { id: `${global.miniappconfig.keyboardtemplateB}` } });
            if (sendresult && sendresult.id) {
                await this.HistoryMessage_addid(mida, sendresult.id);
            }
        }
    }

    async HistoryMessage_addid(mid, id) {
        let c = await this.read_historyMessage(mid);
        if (!c) return false;
        try {
            c = JSON.parse(c);
            c.data.tid = id;
            let stmt = `UPDATE HistoryMessages SET content=? WHERE mid=?`;
            let rows = await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [JSON.stringify(c), mid], (err, rows) => {
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

    async HistoryMessage_adddeallog(mid, avatar, id, username, deal) {
        let c = await this.read_historyMessage(mid);
        if (!c) return false;
        try {
            c = JSON.parse(c);
            let nowlogs = c.data.logs;
            if (!nowlogs) nowlogs = [];
            nowlogs = [...nowlogs, { avatar: avatar, id: id, username: username, deal: deal, time: this.timestamp2times(Date.now()) }];
            c.data.logs = nowlogs;
            let stmt = `UPDATE HistoryMessages SET content=? WHERE mid=?`;
            let rows = await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [JSON.stringify(c), mid], (err, rows) => {
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

    async fetch_eventid(guildid) {

        let eventid = await redis.get(`ZuCacheGEventId:${guildid}`);
        if (eventid) {
            return eventid;
        } else {
            let ginfo = await this.readguildsets(guildid);
            if (ginfo.points) {
                let owner = ginfo.points;
                let id = await redis.get(`ZuCacheGuildsChid:${guildid}`);
                if (id) {
                    await redis.set(`ZuCacheGuildsChid:${guildid}`, id, 300);
                    await ext.postRoleMember(guildid, false, owner, '5', id);
                    await ext.Del_RoleMember(guildid, false, owner, '5', id);
                } else {
                    try {
                        let Cs = await client.channelApi.channels(guildid);
                        if (Cs.data) {
                            let Csf = Cs.data.filter(i => {
                                return i.id != 1 && i.id != 3 && i.id != 4;
                            });
                            if (Csf.length >= 1) {
                                await redis.set(`ZuCacheGuildsChid:${guildid}`, Csf[0].id, 300);
                                await ext.postRoleMember(guildid, false, owner, '5', Csf[0].id);
                                await ext.Del_RoleMember(guildid, false, owner, '5', Csf[0].id);
                            }
                        }
                    } catch (err) { }
                }

                eventid = '';
                let cnt = 0;
                while (!eventid) {
                    await redis.sleep(100);
                    eventid = await redis.get(`ZuCacheGEventId:${guildid}`);
                    if (eventid) {
                        return eventid;
                    }
                    cnt++;
                    if (cnt * 100 >= 3000) {
                        break;
                    }
                }
                return eventid;
                
            }
        }

        return '';
    }

    async _getGpoints(guildid) {
        let stmt = 'SELECT * FROM Guilds_Points WHERE guildid=? LIMIT 10';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows[0]) {
            return rows;
        }
        return false;
    }

    async clear_exp_points() {
        let stmt = 'DELETE guild_users_points_new FROM guild_users_points_new INNER JOIN Guilds_Points ON Guilds_Points.guildid=guild_users_points_new.guildid AND Guilds_Points.point_id=guild_users_points_new.point_id AND guild_users_points_new.lasttime<UNIX_TIMESTAMP()*1000-Guilds_Points.exp_seconds*1000';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [], (err, rows) => {
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

    async read_user_points(guildid, userid) {
        let stmt = 'SELECT point_id,points FROM guild_users_points_new WHERE guildid=? AND user_id=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, userid], (err, rows) => {
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

    async fetchuser_cotwork_orderbytime(guildid) {
        let stmt = 'SELECT cot_workdays,usernick,userhead FROM guild_users_points WHERE guildid=? ORDER BY cot_workdays DESC LIMIT 10';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.length > 0) {
            return rows.filter(i => {
                return i.cot_workdays > 0;
            }).map(i => {
                i.userhead = this.getheadlink(i.userhead);
                i.usernick = i.usernick.replaceAll('-', '');
                i.usernick = i.usernick.replaceAll('*', '');
                i.usernick = i.usernick.replaceAll('#', '');
                i.usernick = i.usernick.replaceAll('\n', '');
                i.usernick = i.usernick.replaceAll('`', '');
                i.usernick = i.usernick.replaceAll('[', '');
                i.usernick = i.usernick.replaceAll('<', '');
                i.usernick = i.usernick.replaceAll('!', '');
                return i;
            });
        }
        return false;
    }

    async fetchuser_willingpay_orderbytotal(guildid) {
        let stmt = 'SELECT totalamount,nick,head FROM guserpayrecord WHERE guildid=? ORDER BY totalamount DESC LIMIT 10';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.length > 0) {
            return rows.filter(i => {
                return i.totalamount > 0;
            }).map(i => {
                i.totalamount = (i.totalamount / 100).toFixed(0);
                i.head = this.getheadlink(i.head);
                i.nick = i.nick.replaceAll('-', '');
                i.nick = i.nick.replaceAll('*', '');
                i.nick = i.nick.replaceAll('#', '');
                i.nick = i.nick.replaceAll('\n', '');
                i.nick = i.nick.replaceAll('`', '');
                i.nick = i.nick.replaceAll('[', '');
                i.nick = i.nick.replaceAll('<', '');
                i.nick = i.nick.replaceAll('!', '');
                return i;
            });
        }
        return false;
    }

    async fetchmypoints(guildid, userid) {
        let stmt;
        let rows;
        let ret = false;

        stmt = 'SELECT point_id,point_name FROM guilds_points WHERE guildid=?';
        rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.length > 0) {
            ret = rows;
            stmt = 'SELECT point_id,points FROM guild_users_points_new WHERE guildid=? AND user_id=?';
            rows = await new Promise((resolve, reject) => {
                global.pool_message.query(stmt, [guildid, userid], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            }).catch((err) => { console.error(err) });
            if (rows && rows.length > 0) {
                rows = rows.map(ii => {
                    let name = ret.filter(i => {
                        return i.point_id == ii.point_id;
                    });
                    if (!name || name.length != 1) {
                        return { ...ii, points: -1 };
                    } else {
                        return { ...ii, name: name[0].point_name };
                    }
                });
                let check = rows.filter(i => { return i.points >= 0 });
                if (check.length <= 0) return false;
                return check;
            } else {
                return false;
            }
        }
        return false;
    }

    async adduserworkdays(guildid, user_id, usernick, userhead, roles) {
        let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, roles], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        });

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT workdays,cot_workdays,points,time FROM guild_users_points WHERE guildid=? AND user_id=? FOR UPDATE';
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
                let param;
                let diffine = this.getTimestampDiffin(rows[0].time);

                if (diffine < 1) { //今日已打卡

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return false;

                }

                if (diffine === 1 || rows[0].time == 0) { //上次打卡在昨天或者从来没打卡
                    param = [rows[0].workdays + 1, rows[0].cot_workdays + 1, rows[0].points, usernick, userhead, Date.now(), roles, guildid, user_id];
                } else {
                    param = [rows[0].workdays + 1, 1, rows[0].points + diffine - 1, usernick, userhead, Date.now(), roles, guildid, user_id];
                }
                let stmt = 'UPDATE guild_users_points SET workdays=?,cot_workdays=?,points=?,usernick=?,userhead=?,time=?,roles=? WHERE guildid=? AND user_id=?';
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

    async readuserTodayCoworkIndex(guildid, user_id) {
        let begain = new Date();
        let end = new Date();
        begain.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        let stmt = 'SELECT user_id FROM guild_users_points WHERE guildid=? AND time>=? AND time<=? ORDER BY time ASC';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, begain.getTime(), end.getTime()], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.length > 0) {
            return rows.findIndex(i => { return i.user_id == user_id; }) + 1;
        }
        return 1;
    }

    async readuserWorkDays(guildid, user_id) {
        let stmt = 'SELECT * FROM guild_users_points WHERE guildid=? AND user_id=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id], (err, rows) => {
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

    async fetchGcardsdb(guildid) {
        let stmt = 'SELECT * FROM guildcardsdb WHERE guildid=? ORDER BY time DESC LIMIT 10';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        if (rows && rows.length > 0) {
            return rows;
        }
        return false;
    }

    async useonecard(guildid, card) {

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT id FROM guildcards WHERE guildid=? AND card=? AND onsold=? FOR UPDATE';
            let rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, card, '1'], (err, rows) => {
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

                let stmt = 'DELETE FROM guildcards WHERE guildid=? AND card=?';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [guildid, card], (err, rows) => {
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
                    return rows[0].id;
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

    async adduserworkcards(guildid, user_id, changecnt) {
        let stmt = 'INSERT IGNORE INTO guild_users_points VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, user_id, 0, 0, 0, 0, '', '', 0, Date.now(), 0, ''], (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        });

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

    async clearupointsandlogs(guildid, user_id) {

        let stmt;
        let param;

        stmt = 'DELETE FROM guild_users_points_new WHERE guildid=? AND user_id=?';
        param = [guildid, user_id];
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, param, (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });

        stmt = 'DELETE FROM gupointschangelogs WHERE guildid=? AND user_id=?';
        param = [guildid, user_id];
        await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, param, (err, msg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(msg);
                }
            });
        }).catch((err) => { console.error(err) });


    }

    async upoints_reset(guildid, point_id, amount) {

        let stmt;
        let param;

        if (amount <= 0) {
            stmt = 'DELETE FROM guild_users_points_new WHERE guildid=? AND point_id=?';
            param = [guildid, point_id];
        } else {
            stmt = 'UPDATE guild_users_points_new SET points=? WHERE guildid=? AND point_id=?';
            param = [amount, guildid, point_id];
        }

        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, param, (err, msg) => {
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

    async addpointchangelog(guildid, userid, point_id, changepoint, reason, opuserid, opnick, ophead) {
        let stmt = 'INSERT INTO gupointschangelogs VALUES (?,?,?,?,?,?,?,?,?,?) ';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [0, guildid, userid, point_id, changepoint, reason, Date.now(), opuserid, opnick, ophead], (err, msg) => {
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

    async addpointchangelogs(arr) {
        let stmt = 'INSERT INTO gupointschangelogs VALUES ?';
        let ret = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [arr], (err, msg) => {
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

    async userscoworkdaysrestore(guildid, users) {

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT workdays FROM guild_users_points WHERE guildid=? AND user_id IN (?) FOR UPDATE';
            let rows = await new Promise((resolve, reject) => {
                scc.query(stmt, [guildid, users], (err, rows) => {
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
                let stmt = 'UPDATE guild_users_points SET cot_workdays=workdays,points=? WHERE guildid=? AND user_id IN (?)';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [0, guildid, users], (err, rows) => {
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

    async transport_upoint_upoint(guildid, point, fromuser, touser, cnt, reason) {

        if (!cnt || isNaN(cnt)) return '积分数量必须大于0';
        cnt = Number(cnt.toFixed(0));
        if (cnt <= 0) return '积分数量必须大于0';
        if (point.cantrans != '1') return '该积分不允许相互转账' ;

        let levelneed;
        if (point.transrate > 0) {
            levelneed = cnt * point.transrate / 10000;
            if (levelneed < 1) levelneed = 1;
            levelneed = Number(levelneed.toFixed(0));
        } else {
            levelneed = 0;
        }

        if (cnt - levelneed <= 0) {
            return `转账金额过小，无法支付转账手续费${levelneed}` ;
        }

        let deret = await this.user_points_change(guildid, fromuser.id, point.point_id, -1 * cnt, fromuser.avatar, fromuser.username);
        if (deret === false) {
            return `您的余额不足，无法支付转出金额${cnt}`;
        } else {
            await this.addpointchangelog(guildid, fromuser.id, point.point_id, -1 * (cnt - levelneed), `手动转账 ${reason || ''}`, fromuser.id, fromuser.username, fromuser.avatar);
            await this.addpointchangelog(guildid, fromuser.id, point.point_id, -1 * levelneed, `转账手续费`, fromuser.id, fromuser.username, fromuser.avatar);
        }

        let addret = await this.user_points_change(guildid, touser.id, point.point_id, 1 * (cnt - levelneed), touser.avatar, touser.username);
        if (addret === false) {
            return '系统错误，目标用户接收转账失败';
        } else {
            await this.addpointchangelog(guildid, touser.id, point.point_id, 1 * (cnt - levelneed), `手动转账 ${reason || ''}`, fromuser.id, fromuser.username, fromuser.avatar);
        }
        return `执行成功，扣除转账手续费 ${levelneed} 点，实际到账 ${cnt - levelneed} 点`;
    }

    async usercoworkdaysrepair(guildid, user_id, cnt, bycard, head, nick) {
        let sets = await this.getcoworksets(guildid);
        if (!sets) {
            return '抱歉，当前频道不允许补签';
        }
        sets = sets.content;
        if (!sets.gpc.on) {
            return '抱歉，当前频道不允许补签';
        }

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

            let stmt = 'SELECT workdays,cot_workdays,points,cards FROM guild_users_points WHERE guildid=? AND user_id=? FOR UPDATE';
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
                return '您还从未打卡过，无需补签';
            } else {

                let workdays = rows[0].workdays;
                let cot_workdays = rows[0].cot_workdays;
                let points = rows[0].points;
                let cards = rows[0].cards;

                if (points <= 0) {

                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return '您无需补签';
                }

                if (cnt > points) cnt = points;
                let need = '';

                if (bycard) { //补签卡补签

                    if (cards < cnt) {

                        await new Promise((resolve, reject) => {
                            scc.rollback(() => {
                                resolve();
                            });
                        });
                        scc.release();
                        return `补签卡不足，当前有补签卡 ${rows[0].cards} 张，需要补签卡 ${cnt} 张`;
                    } else {
                        cards = cards - cnt;
                        need = ` ${cnt} 张补签卡`;
                    }

                } else {
                    let check = await this.user_points_change(guildid, user_id, sets.gpc.point_id, -1 * sets.gpc.point_cnt * cnt, head, nick);
                    if (check === false) {

                        await new Promise((resolve, reject) => {
                            scc.rollback(() => {
                                resolve();
                            });
                        });
                        scc.release();
                        return `资产不足，当前补签需要 ${sets.gpc.point_name} ${sets.gpc.point_cnt * cnt}点`;
                    } else {
                        await this.addpointchangelog(guildid, user_id, sets.gpc.point_id, -1 * sets.gpc.point_cnt * cnt, `补签${cnt}天消耗`, user_id, nick, head);
                        need = ` ${sets.gpc.point_cnt * cnt} 点${sets.gpc.point_name}`;
                    }
                }

                points = points - cnt;
                if (points <= 0) {
                    points = 0;
                    cot_workdays = workdays;
                } else {
                    cot_workdays = cot_workdays + cnt;
                }

                let stmt = 'UPDATE guild_users_points SET workdays=?,cot_workdays=?,points=?,cards=? WHERE guildid=? AND user_id=?';
                let ret = await new Promise((resolve, reject) => {
                    scc.query(stmt, [workdays, cot_workdays, points, cards, guildid, user_id], (err, rows) => {
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
                    return `消耗${need}补签 ${cnt} 天 成功`;
                } else {
                    await new Promise((resolve, reject) => {
                        scc.rollback(() => {
                            resolve();
                        });
                    });
                    scc.release();
                    return '系统错误，补签失败';
                }
            }
        } catch (err) {
            await new Promise((resolve, reject) => {
                scc.rollback(() => {
                    resolve();
                });
            });
            scc.release();
            return '系统错误，补签失败';
        }
    }

    async ifhas_guildrecord(guildid) {
        let stmt = 'SELECT * FROM Guilds WHERE guildid = ?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, guildid, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        return rows && rows.length > 0;
    }

    async gexptimeadd(addtime, guildid) {
        let stmt = 'UPDATE Guilds SET expiration_time=IF(expiration_time<?,?,expiration_time+?) WHERE guildid=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [Date.now(), Date.now() + addtime, addtime, guildid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }).catch((err) => { console.error(err) });
        return rows && rows.affectedRows > 0;
    }

    async guildaddtime(guildid, userid, pointid, cnt, addtimes) {

        if (!cnt || isNaN(cnt) || cnt <= 0) return '积分数量定义错误';
        if (!addtimes || isNaN(addtimes) || addtimes <= 0) return '续期时长定义错误';

        let gcheck = await this.ifhas_guildrecord(guildid);
        if (!gcheck) return '无此频道记录，请确认频道id是否正确';

        let deret = await this.user_points_change(global.miniappconfig.officialguildid, userid, pointid, -1 * cnt, '', '');
        if (deret === false) {
            return `您在官方频道内的资产不足\r无法支付所需资产 ${cnt}点\r请前往官方频道获取资产`;
        } else {
            await this.addpointchangelog(global.miniappconfig.officialguildid, userid, pointid, -1 * cnt, `频道续期消耗`, global.robotid, '系统', 'https://q2.qlogo.cn/headimg_dl?dst_uin=2854203016&spec=100');
        }

        let addret = await this.gexptimeadd(addtimes, guildid);
        if (!addret) {
            return '系统错误，目标频道续期失败';
        } else {
            return '续期成功';
        }
    }

    async read_historyMessage(mid) {
        let stmt = `SELECT content FROM HistoryMessages WHERE mid=?`;
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [mid], (err, rows) => {
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

    async readHistoryMessage(mid) {
        let stmt = 'SELECT content FROM HistoryMessages WHERE mid=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [mid], (err, rows) => {
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

    async readofficetaskinfo(guildid, taskid) {
        let stmt = 'SELECT tasktype,mida,midb,closed FROM Office_taskList WHERE guildid=? AND taskid=?';
        let rows = await new Promise((resolve, reject) => {
            global.pool_message.query(stmt, [guildid, taskid], (err, rows) => {
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

    async worningOneUser(guild_id, _userid, _nick, _head, opuser, bantime) {
        let answer = false;
        let scnt = 1;
        await this.s_writelog(guild_id, _userid, _nick, _head, '0', `被值班人员警告1次`);
        let cnow = await this.user_worningcount_add(guild_id, _userid, scnt);
        let check = await this.check_ifhitworningsets(guild_id, _userid, cnow);
        if (check) {
            let cop = check.ptype;
            let optime = check.ptime;
            if (cop == 0) {
                await ext.Del_guild_member({ guild_id: guild_id, author_id: _userid, sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
                await this.user_worningcount_reset(guild_id, _userid);
                await this.s_writelog(guild_id, _userid, _nick, _head, '0', `值班人员手动警告，对方触发警告处罚策略，被系统踢出`);
                answer = `该成员发言违规，被多次警告无果，已被系统踢出`;
            } else if (cop == 1) {
                await ext.Del_guild_member({ guild_id: guild_id, author_id: _userid, sandbox: false, add_blacklist: true, delete_history_msg_days: -1 });
                await this.del_guild_users_points(guild_id, _userid);
                await this.s_writelog(guild_id, _userid, _nick, _head, '0', `值班人员手动警告，对方触发警告处罚策略，被系统踢出并拉黑`);
                answer = `该成员发言违规，被多次警告无果，已被系统踢出并拉黑`;
            } else {

                try {
                    await client.muteApi.muteMember(guild_id, _userid, { seconds: optime.toString() });
                } catch (err) { }

                answer = `<@!${_userid}> 您的发言违规，被值班人员警告1次，触发禁言处罚，被禁言${longtime2s(optime * 1000)}，请规范发言`;
                if (check.reset == true) {
                    await this.user_worningcount_reset(guild_id, _userid);
                    await this.del_worninglogs_user(guild_id, _userid);
                }
                await this.s_writelog(guild_id, _userid, _nick, _head, '0', `值班人员手动警告，对方触发警告处罚策略，被系统禁言${longtime2s(optime * 1000)}`);
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

    async delofficetask(guildid, taskid, close) {

        close = (close == '1' ? '1' : '0');

        let scc = await new Promise((resolve, reject) => {
            global.pool_message.getConnection((err, connection) => {
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

}