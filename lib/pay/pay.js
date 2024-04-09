//import qr from 'qrcode';

export default class Pay {
    constructor() {
        this.notifyurl = '';
        this.account = global.miniappconfig.afdaccount;
        this.password = global.miniappconfig.afdpassword;
        this.UpDateNotifyUrl();
    }

    async UpDateNotifyUrl() {
        if (!this.notifyurl) return false;

        let p = { url: this.notifyurl };

        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
            },
            body: JSON.stringify(p)
        };

        try {
            let response = await fetch('https://afdian.net/api/creator/update-open-webhook', options);
            let data = await response.text();
            let r = JSON.parse(data);
            if (r.ec == 0) return true;
        } catch (err) {
            console.error(err);
        }

        return false;
    }

    async LoginAccount() {

        let p = { account: this.account, password: this.password, mp_token: -1 };

        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(p)
        };

        try {
            let response = await fetch('https://afdian.net/api/passport/login', options);
            let data = await response.text();
            let r = JSON.parse(data);
            let auth_token = r.data.auth_token;
            if (auth_token) {
                await redis.set(`Afdian:${this.account}:Cookie`, `auth_token=${auth_token};`);
                redis.expire(`Afdian:${this.account}:Cookie`, 60 * 60 * 24 * 30);
                response = await fetch('https://afdian.net/api/my/profile', {
                    method: 'GET', headers: {
                        'Content-Type': 'application/json',
                        'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
                    }
                });
                data = await response.text();;
                r = JSON.parse(data);
                let id = r.data.user.user_id;
                if (id) {
                    await redis.set('Afdian:Uid', id);
                    redis.expire('Afdian:Uid', 60 * 60 * 24 * 30);
                    console.log(`爱发电重登录：${r.data.user.name},token：${auth_token}`);
                    this.UpDateNotifyUrl();
                    return true;
                }
            }
        } catch (err) {
            console.error(err);
        }

        return false;
    }

    async FetchPay(amount, order_id, platform, notrylogin = false, user_id = '') {
        if (typeof amount != 'number' || typeof order_id != 'string' || amount < 5) return false;

        let p = {
            plan_id: '',
            month: 1,
            total_amount: '',
            out_trade_no: '',
            pay_type: '',
            code: '',
            user_id: '',
            per_month: '',
            remark: '',
            mp_token: -1,
            show_amount: '',
            addr_name: '',
            addr_phone: '',
            addr_address: '',
            sku_detail: [],
            plan_invite_code: '',
            custom_order_id: '',
            cmid: '',
            card_id_list: [],
            ticket_round_id: '',
            agreement: ''
        };

        let oldplatform = platform;

        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
                'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
            },
            body: ''
        };

        if (platform == 'alipay_web') {
            options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
            platform = 'alipay';
        }

        p.show_amount = p.per_month = p.total_amount = amount.toFixed(2);
        p.custom_order_id = order_id;
        [p.pay_type, p.user_id] = [platform, user_id || await redis.get('Afdian:Uid')];
        options.body = JSON.stringify(p);

        try {
            let response = await fetch('https://afdian.net/api/order/create-order', options);
            let data = await response.text();

            let r = JSON.parse(data);
            if (r.ec == 40100 && notrylogin == false) {
                if (! await this.LoginAccount()) return false;
                return await this.FetchPay(amount, order_id, oldplatform, true, user_id);
            }
            let direct = r.data.redirect_url;
            let rid = r.data.out_trade_no;
            if (direct) {
                return { id: rid, url: direct };
                //return { id: rid, url: direct.includes('weixin://') ? 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(direct) : direct };
                /*
                if (platform == 'alipay') {

                }
                options = {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    scale: 10,
                    margin: 2,
                };

                return new Promise((resove, reject) => {
                    qr.toBuffer(direct, options, (err, buffer) => {
                        if (err) {
                            reject(err);
                        } else {
                            resove(buffer);
                        }
                    });
                });
                */
            }
        } catch (err) {
        }

        return false;
    }

    async CheckOrder(out_trade_no) {

        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
                'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
            }
        };

        try {
            let response = await fetch(`https://afdian.net/api/order/check?out_trade_no=${out_trade_no}`, options);
            let data = await response.json();
            return data;
        } catch (err) {
        }

        return false;
    }

    async CancleOrder(out_trade_no) {
        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
                'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
            },
            body: JSON.stringify({ out_trade_no: out_trade_no })
        };

        try {
            let response = await fetch(`https://afdian.net/api/order/cancel-order`, options);
            let data = await response.json();
            return data;
        } catch (err) {
        }

        return false;
    }

    async GetProfile(url_slug) {

        let options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
                'Cookie': await redis.get(`Afdian:${this.account}:Cookie`)
            }
        };

        try {
            let response = await fetch(`https://afdian.net/api/user/get-profile-by-slug?url_slug=${url_slug}`, options);
            let data = await response.json();
            return data;
        } catch (err) {
        }

        return false;
    }

    async FetchAliPay(amount = 5.00, order_id = '', user_id = '') {
        return await this.FetchPay(amount, order_id, 'alipay', false, user_id);
    }

    async FetchAliPay_WEB(amount = 5.00, order_id = '', user_id = '') {
        return await this.FetchPay(amount, order_id, 'alipay_web', false, user_id);
    }

    async FetchWeChatPay(amount = 5.00, order_id = '', user_id = '') {
        return await this.FetchPay(amount, order_id, 'wxpay_qr', false, user_id);
    }



}

global.Pay = new Pay();