import fs from 'fs';
import buffer from "node:buffer"
import sFormData from 'form-data';
import fetch from 'node-fetch';

export default class Extends {

    constructor(Authorization, client, Config) {
        this.Authorization = Authorization;
        this.client = client;
        this.Config = Config;
    }

    formDataToJson(formData) {
        const json = {};
        for (const [key, value] of formData.entries()) {
            if (key == 'embed') {
                json.embed = JSON.parse(value);
            } else if (key == 'ark') {
                json.ark = JSON.parse(value);
            } else if (key == 'message_reference') {
                json.message_reference = JSON.parse(value);
            } else if (key == 'markdown') {
                json.markdown = JSON.parse(value);
            } else if (key == 'keyboard') {
                json.keyboard = JSON.parse(value);
            } else {
                json[key] = value;
            }
        }
        return JSON.stringify(json);
    }

    async SendMessage({ guild_id, channel_id, msg_id = '', isGroup = true, sandbox = false, content = '', embed = '', ark = '', message_reference = '', image = null, event_id = '', markdown = '', keyboard = '' }) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = isGroup ? `${host}channels/${channel_id}/messages` : `${host}dms/${guild_id}/messages`

        let data;
        if (Buffer.isBuffer(image)) {
            data = new sFormData();
        } else {
            data = new FormData();
        }

        let check = false;
        if (content) data.append('content', content);
        if (embed) data.append('embed', typeof embed == 'object' ? JSON.stringify(embed) : embed);
        if (ark) data.append('ark', typeof ark == 'object' ? JSON.stringify(ark) : ark);
        if (message_reference) data.append('message_reference', typeof message_reference == 'object' ? JSON.stringify(message_reference) : message_reference);
        if (msg_id) data.append('msg_id', msg_id);
        if (event_id) data.append('event_id', event_id);
        if (markdown) data.append('markdown', typeof markdown == 'object' ? JSON.stringify(markdown) : markdown);
        if (keyboard) data.append('keyboard', typeof keyboard == 'object' ? JSON.stringify(keyboard) : keyboard);
        if (image) {
            if (Buffer.isBuffer(image)) {
                data.append('file_image', image, { filename: image.slice(0, 3).toString() === 'GIF' ? 'image.gif' : 'image.png' });
                check = true;
            } else if (typeof image === 'string') {
                let pattern = /^https?:\/\//i;
                if (pattern.test(image)) {
                    data.append('image', image);
                }

                /* 低性能
                else if (fs.existsSync(image)) {
                    let fbin = fs.readFileSync(image);
                    if (fbin.length > 0) data.append('file_image', new Blob([fbin]));
                }
                */
            }
        }

        let headers = {
            "Authorization": this.Authorization
        };

        if (embed || ark || message_reference || markdown || keyboard || !image || !check) {
            data = this.formDataToJson(data);
            headers['Content-Type'] = 'application/json';
        } else {
            headers['Content-Type'] = data.getHeaders()['content-type'];
        }

        try {
            let res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: data
            });
            let sendret = await res.json();
            //console.log(sendret);
            //console.log(data);
            if (sendret.seq_in_channel) {
                write_Messages(sendret.guild_id, sendret.channel_id, Number(sendret.seq_in_channel), '{}');
            } else {
                console.log(sendret);
                console.log(data);
            }
            return { ...sendret, traceID: res.headers.get('X-Tps-trace-ID') };
        }catch(err){
            let ret = { code: 500, message :JSON.stringify(err)};
            return JSON.stringify(ret);
        }
    }

    async Del_guild_member({ guild_id, author_id, sandbox = false, add_blacklist = false, delete_history_msg_days = -1 }) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/members/${author_id}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        let data = { add_blacklist: add_blacklist, delete_history_msg_days: delete_history_msg_days };
        data = JSON.stringify(data);

        try {
            let res = await fetch(url, {
                method: 'DELETE',
                headers: headers,
                body: data
            });
            if (res.ok) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    }

    async Del_guild_thread(channel_id, sandbox = false, thread_id) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}channels/${channel_id}/threads/${thread_id}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        try {
            let res = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });

            return res.ok;
        } catch (err) {
            return false;
        }
    }

    async postRole(guild_id, sandbox = false, name, color) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/roles`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';
        let data = { name: name, color: parseInt(`ff${color}`, 16), hoist: '1' };
        data = JSON.stringify(data);

        let res = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data
        });
        return res.json();
    }

    async Del_Role(guild_id, sandbox = false, roleid) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/roles/${roleid}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        let res = await fetch(url, {
            method: 'DELETE',
            headers: headers
        });
        return res.status == 204;
    }

    async postRoleMember(guild_id, sandbox = false, userid, roleid, channelid) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/members/${userid}/roles/${roleid}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        try {
            let res;
            if (channelid) {
                res = await fetch(url, {
                    method: 'PUT',
                    headers: headers,
                    body: `{ "channel": { "id": "${channelid}" } }`
                });
            } else {
                res = await fetch(url, {
                    method: 'PUT',
                    headers: headers
                });
            }

            return res.status == 204;

        } catch (err) {
            return false;
        }
    }

    async Del_RoleMember(guild_id, sandbox = false, userid, roleid, channelid) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/members/${userid}/roles/${roleid}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        let ret;
        try {
            if (channelid) {
                ret = await fetch(url, {
                    method: 'DELETE',
                    headers: headers,
                    body: `{ "channel": { "id": "${channelid}" } }`
                });
            } else {
                ret = await fetch(url, {
                    method: 'DELETE',
                    headers: headers
                });
            }

            return ret.status == 204;

        } catch (err) {
            return false;
        }
        
    }

    async postEdiRole(guild_id, sandbox = false, name, color, roleid) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}guilds/${guild_id}/roles/${roleid}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';
        let data = { name: name, color: parseInt(`ff${color}`, 16), hoist: '1' };
        data = JSON.stringify(data);

        let res = await fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: data
        });
        return res.json();
    }

    async GetThreadInfo(channelid, sandbox = false, threadid) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}channels/${channelid}/threads/${threadid}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        try {
            let res = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            return await res.json();
        } catch (err) {
            let ret = { code: 500, message: JSON.stringify(err) };
            return JSON.stringify(ret);
        }
    }

    async GetQcAnswer() {

        let url, data;

        url = 'https://qczj.h5yunban.com/qczj-youth-learning/cgi-bin/common-api/course/current';
        try {
            let res = await fetch(url, {
                method: 'GET'
            });
            let ret = await res.json();
            if (ret && ret.status == 200) {
                data = ret.result;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }

        let title = `${data.type} ${data.title}`;
        let cover = data.cover;

        let id = data.uri.match(/daxuexi\/(.*?)\/index.html/);
        if (!id || !id[1]) return false;
        id = id[1];
        url = `https://h5.cyol.com/special/daxuexi/${id}/m.html?t=1&z=201`;

        try {
            let res = await fetch(url, {
                method: 'GET',
            });
            let ret = await res.text();
            if (!ret) return false;
            ret = ret.match(/< *div *class *= *\"w1 *option\" *data-a *= *\"(\d+)\".*?>< *\/div *>[\s\S]*?< *div *class *= *\"w2 *option\" *data-a *= *\"(\d+)\".*?>< *\/div *>[\s\S]*?< *div *class *= *\"w3 *option\" *data-a *= *\"(\d+)\".*?>< *\/div *>[\s\S]*?< *div *class *= *\"w4 *option\" *data-a *= *\"(\d+)\".*?>< *\/div *>/g);
            if (ret.length <= 0) return { title: title, cover: cover, msg: '本期视频没有测试' };
            ret = ret.map(i => {
                let tmp = '';
                let c = i.match(/< *div *class *= *\"w\d+ *option\" *data-a *= *\"(\d+)\".*?>< *\/div *>/g);
                c.forEach((v, ii) => {
                    if (v.match(/data-a *= *\"(\d+)\"/)[1] == '1') tmp += (ii == 0 ? 'A' : ii == 1 ? 'B' : ii == 2 ? 'C' : ii == 3 ? 'D' : '');
                });
                return tmp;
            });
            return { title: title, cover: cover, msg: ret.join('\r') };
        } catch (err) { }

        return false;
    }

    async getImageByUrl(url) {
        try {
            let res = await fetch(url);
            let buffer = await res.buffer();
            return buffer;
        } catch (err) {
            return false;
        }
    }

    async getRoleMember(guild_id, role_id, limit, next = '0', sandbox) {
        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/';
        url = `${host}guilds/${guild_id}/roles/${role_id}/members?limit=${limit}&start_index=${next}`;

        let headers = {
            'Authorization': this.Authorization
        };
        headers['Content-Type'] = 'application/json';

        try {
            let res = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            return await res.json();
        } catch (err) {
            return { code: 500, message: err };
        }
    }

    encodeProtobuf(field1, field2, field7, field9) {
        const data = { field1, field2, field7, field9 };
        const fieldNumbers = { field1: 1, field2: 2, field7: 7, field9: 9 };
        let length = 0;
        for (const fieldName in data) {
            const fieldNumber = fieldNumbers[fieldName];
            if (typeof fieldNumber !== 'number') {
                throw new Error(`Unknown field: ${fieldName}`);
            }
            const value = data[fieldName];
            if (value != null) {
                const encodedField = this.encodeField(fieldNumber, value);
                length += encodedField.length;
            }
        }
        const buffer = Buffer.alloc(length);
        let offset = 0;
        for (const fieldName in data) {
            const fieldNumber = fieldNumbers[fieldName];
            if (typeof fieldNumber !== 'number') {
                throw new Error(`Unknown field: ${fieldName}`);
            }
            const value = data[fieldName];
            if (value != null) {
                const encodedField = this.encodeField(fieldNumber, value);
                encodedField.copy(buffer, offset);
                offset += encodedField.length;
            }
        }
        return buffer;
    }

    encodeField(fieldNumber, value) {
        let fieldHeader;
        let fieldValue;
        if (typeof value === 'bigint') {
            // 将整数分解成多个 Varint 编码的部分进行编码
            const parts = [];
            while (value > 0) {
                parts.push(Number(value & BigInt(0x7f)));
                value >>= BigInt(7);
            }
            for (let i = 0; i < parts.length - 1; i++) {
                parts[i] |= 0x80;
            }
            fieldHeader = this.encodeVarint((fieldNumber << 3) | 0); // field type = 0 (varint)
            fieldValue = Buffer.from(parts);
        } else {
            // 使用 Varint 编码
            fieldHeader = this.encodeVarint((fieldNumber << 3) | 0); // field type = 0 (varint)
            fieldValue = this.encodeVarint(value);
        }
        return Buffer.concat([fieldHeader, fieldValue]);
    }

    encodeVarint(value) {
        const buffer = [];
        while (value > 0x7f) {
            buffer.push((value & 0x7f) | 0x80);
            value >>>= 7;
        }
        buffer.push(value);
        return Buffer.from(buffer);
    }

    packmsgid(guildid, channelid, seq_in_channel, stime) {
        //let time = Math.floor(new Date(stime).getTime() / 1000);
        let time = Math.floor(Date.now() / 1000);
        const field1 = BigInt(guildid);
        const buffer = this.encodeProtobuf(field1, Number(channelid), Number(seq_in_channel), time);
        const hexString = buffer.toString('hex');
        return hexString;
    }

    decodeVarint(buffer, startIndex, endIndex) {
        let value = 0n;
        let i = startIndex;
        let shift = 0n;
        let valueLength = 0;
        while (i < endIndex) {
            const byte = buffer[i];
            value |= BigInt(byte & 0x7f) << shift;
            shift += 7n;
            valueLength++;
            if ((byte & 0x80) === 0) {
                return [value, valueLength];
            }
            i++;
        }
        throw new Error('Invalid varint');
    }

    decodeString(buffer, startIndex, endIndex) {
        const [length, lengthLength] = this.decodeVarint(buffer, startIndex, endIndex);
        const value = buffer.slice(startIndex + lengthLength, startIndex + lengthLength + Number(length)).toString('utf8');
        return [value, lengthLength + Number(length)];
    }

    decodeField(buffer, startIndex, endIndex, targetfieldNumber) {
        let i = startIndex;

        while (i < endIndex) {

            let tag = buffer[i];
            let fieldNumber = tag >> 3;
            let wireType = tag & 0x7;

            let value;
            let valueLength;

            switch (fieldNumber) {
                case 1:
                case 2:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                    [value, valueLength] = this.decodeVarint(buffer, i + 1, endIndex);
                    i += 1 + valueLength;
                    if (targetfieldNumber == fieldNumber) return value;
                    break;
                case 3:
                    [value, valueLength] = this.decodeString(buffer, i + 1, endIndex);
                    i += 1 + valueLength;
                    if (targetfieldNumber == fieldNumber) return value;
                    break;
                default:
                    return false;
            }
        }
        return false;
    }

    depackmsgid(msgid) {
        let buffer = Buffer.from(msgid, 'hex');
        return this.decodeField(buffer, 0, buffer.length, 7);
    }

    depackuserid(msgid) {
        let buffer = Buffer.from(msgid, 'hex');
        return this.decodeField(buffer, 0, buffer.length, 3);
    }

    getRandomInteger(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getlink_location(url) {
        return `https://${global.miniappconfig.host}/s/L${encodeURIComponent(url)}`;
    }

    getlink_refresh(url) {
        return `https://${global.miniappconfig.host}/s/G${encodeURIComponent(url)}`;
    }

    async searchmusic_QQ(keyword) {

        let url, result;

        url = `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?_=1697126393202&format=json&inCharset=utf-8&outCharset=utf-80&platform=yqq.json&is_xml=0&key=${encodeURIComponent(keyword)}`;
        try {
            let res = await fetch(url, {
                method: 'GET'
            });
            let ret = await res.json();
            if (ret && ret.code == 0) {
                result = ret?.data?.song?.itemlist;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }

        if (!result || result.length <= 0) return false;
        let _check = result.filter(i => {
            return keyword.includes(i.name) &&
                i.singer.split('/').filter(ii => { return keyword.includes(ii); }).length > 0;
        });
        if (_check.length > 0) {
            result = _check[this.getRandomInteger(0, _check.length - 1)];
        } else {
            result = result[this.getRandomInteger(0, result.length - 1)];
        }

        url = `https://y.qq.com/n/ryqq/songDetail/${result.mid}`;
        result = '';

        try {
            let res = await fetch(url, {
                method: 'GET'
            });
            let ret = await res.text();
            let check = ret.match(/window\.__INITIAL_DATA__ =(.*?)\<\/script\>/);
            ret = '';
            if (check && check[1]) {
                check[1] = check[1].replaceAll('undefined', 'false');
                check = JSON.parse(check[1]);
                if (!check || !check?.detail?.title) return false;
                return { title: check.detail.title, cover: this.getlink_location('https:' + check.detail.picurl), singer: check.detail.singer.map(i => { return i.name }).join(' '), url: this.getlink_refresh(url) };
            } else {
                return false;
            }
        } catch (err) { }

        return false;
    }

    async searchmusic_163(keyword) {

        let url, result;

        url = `https://music.163.com/api/search/get/web?csrf_token=hlpretag=&hlposttag=&s=${encodeURIComponent(keyword)}&type=1&offset=0&total=true&limit=20`;
        try {
            let res = await fetch(url, {
                method: 'GET'
            });
            let ret = await res.json();
            if (ret && ret.code == 200) {
                result = ret?.result?.songs;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }

        if (!result || result.length <= 0) return false;
        let _check = result.filter(i => {
            return keyword.includes(i.name) &&
                i.artists.filter(ii => { return keyword.includes(ii.name) }).length > 0;
        });
        if (_check.length > 0) {
            result = _check[this.getRandomInteger(0, _check.length - 1)];
        } else {
            result = result[this.getRandomInteger(0, result.length - 1)];
        }

        url = `https://music.163.com/#/song?id=${result.id}`;

        try {
            let res = await fetch(`https://music.163.com/api/song/detail/?id=${result.id}&ids=%5B${result.id}%5D`, {
                method: 'GET'
            });
            let ret = await res.json();
            if (ret && ret.code == 200) {
                ret = ret?.songs;
                if (ret.length > 0) {
                    ret = ret[0]?.album?.blurPicUrl;
                    if (ret) {
                        return { title: result.name, cover: this.getlink_location(ret), singer: result.artists.map(i => { return i.name }).join(' '), url: this.getlink_refresh(url) };
                    }
                }
            }
        } catch (err) { }

        return false;
    }

    async OilPriceGet(cityname) {

        let url, result;

        url = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPTA_WEB_YJ_JH&columns=ALL&sortColumns=DIM_DATE&sortTypes=-1&filter=(CITYNAME%3D%22${encodeURIComponent(cityname)}%22)&pageNumber=1&pageSize=1&source=WEB&_=${Date.now()}`;
        try {
            let res = await fetch(url, {
                method: 'GET'
            });
            let ret = await res.json();
            result = ret?.result?.data;
        } catch (err) {
            return false;
        }
        if (!result || result.length <= 0) return false;
        result = result[0];
        if (!result.V89) return false;
        return result;
    }

    async GetAccess_token() {
        let check = await redis.get(`Access_tokenC:${this.Config.appID}`);
        if (check) {
            return check;
        }

        try {
            let res = await fetch('https://bots.qq.com/app/getAppAccessToken', {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    appId: this.Config.appID,
                    clientSecret: this.Config.secret || ''
                })
            });
            let ret = await res.json();
            if (ret.access_token) {
                await redis.set(`Access_tokenC:${this.Config.appID}`, ret.access_token, ret.expires_in);
                return ret.access_token;
            } else {
                return '';
            }
        } catch (err) {
            return '';
        }
    }

    async UpGroupFiles({ sandbox = false, groupid, file_type = 1, file = '', srv_send_msg = false, usecache = false }) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}v2/groups/${groupid}/files`;

        let data = JSON.stringify({
            url: file,
            file_type: file_type,
            srv_send_msg: srv_send_msg
        });

        let headers = {
            'Authorization': `QQBot ${await this.GetAccess_token()}`,
            'X-Union-Appid': this.Config.appID,
            'Content-Type': 'application/json'
        };

        try {
            let res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: data
            });
            let sendret = await res.json();
            return sendret.file_info;
        } catch (err) {
            return false;
        }
    }

    async SendGroupMessage({ sandbox = false, groupid, msg_id = '', msg_type = 0, content = ' ', msg_seq = 1, media = false }) {

        let host, url;
        host = sandbox ? 'https://sandbox.api.sgroup.qq.com/' : 'https://api.sgroup.qq.com/'
        url = `${host}v2/groups/${groupid}/messages`;

        let data = {
            content: content,
            msg_type: msg_type,
            msg_id: msg_id,
            msg_seq: msg_seq
        };
        if (media) data = { ...data, media: { file_info: media } };

        data = JSON.stringify(data);

        let headers = {
            'Authorization': `QQBot ${await this.GetAccess_token()}`,
            'X-Union-Appid': this.Config.appID,
            'Content-Type': 'application/json'
        };

        try {
            let res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: data
            });
            let sendret = await res.json();
            return sendret.ret == 0;
        } catch (err) {
            return false;
        }
    }

}


async function write_Messages(guildid, channel, seq, msg) {
    await redis.set(`ZuCMG:${guildid}:${channel}:${seq}`, msg, 300);
}
