import fs from 'fs';
import https from 'https';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Queue from 'bull'
import * as handlers from './handlers.js'
import bodyParser from 'body-parser';
import multer from 'multer';

const host = true ? `https://${global.miniappconfig.host}/` : 'https://127.0.0.1/';

let queue = new Queue('初遇小竹Api服务队列', {
    defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: global.redisconf
});

let dir = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.static(path.join(dir, '..', '..', 'resource')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let options = {
    key: fs.readFileSync(path.join(dir, `${global.miniappconfig.host}.key`)),
    cert: fs.readFileSync(path.join(dir, `${global.miniappconfig.host}_bundle.crt`))
};

const server = https.createServer(options, app);

server.listen(443, function () {
    console.log('QQ小程序 HTTPS 服务器已启动');
});

// 配置 multer 中间件
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './plugins/初遇小竹/图片');
    },
    filename: function (req, file, cb) {
        cb(null, req.params.md5 + '.png');
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 2 }, // 限制上传文件大小为 2 MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype == 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

const jobPromiseMap = new Map();

queue.on('global:completed', (jobid, result) => {
    let promise = jobPromiseMap.get(jobid);
    if (promise) {
        jobPromiseMap.delete(jobid);
        jobPromiseMap.forEach((value, key) => {
            if (Date.now() - value.time >= 1000 * 60 * 2) {
                value.reject('time out');
                jobPromiseMap.delete(key);
            }
        });
        promise.resolve(result);
    }
});

queue.on('global:failed', (jobid, err) => {
    let promise = jobPromiseMap.get(jobid);
    if (promise) {
        jobPromiseMap.delete(jobid);
        jobPromiseMap.forEach((value, key) => {
            if (Date.now() - value.time >= 1000 * 60 * 2) {
                value.reject('time out');
                jobPromiseMap.delete(key);
            }
        });
        promise.reject(err);
    }
});

async function WaitJobFinish(job) {

    let size = jobPromiseMap.size;
    if (size >= 1000) {
        throw new Error('Reach Map Max 100');
    }

    let ret = await new Promise((resolve, reject) => {
        jobPromiseMap.set(job.id, { resolve, reject, time: Date.now() });
    });

    try {
        ret = JSON.parse(ret);
    } catch (err) { }

    if (job.failedReason) {
        throw new Error(`Task Failed ${job.failedReason}`);
    } else {
        return ret;
    }
}

async function exists(path) {
    try {
        await fs.promises.access(path);
        return true;
    } catch (err) {
        return false;
    }
}

app.get("/Api/code2session/code/:code/:token?", async (req, res) => {

    let data = {
        data: {
            code: req.params.code,
            token: req.params.token
        },
        func: 'code2session',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        res.send(result);
    }).catch((err) => {
        console.error(err);
        res.json({ errcode: 500, errmsg: 'error' });
    });

});

app.get("/Api/adminlist/:token", async (req, res) => {

    let data = {
        data: {
            token: req.params.token
        },
        func: 'adminlist',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        res.json(result);
    }).catch((err) => {
        res.json({ errcode: 500, errmsg: 'error' });
    });

});

app.get("/Api/tu_list/:token/:next/:nowgrpid/:p?", async (req, res) => {

    let data = {
        data: {...req.params},
        func: 'tu_list',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        res.json(result);
    }).catch((err) => {
        res.json({ errcode: 500, errmsg: 'error' });
    });

});

app.get("/Api/permissions/:userid/:token", async (req, res) => {
    let data = {
        data: {
            userid: req.params.userid,
            token:req.params.token
        },
        func: 'getpermissions'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/setpermission/:userid/:p/:token", async (req, res) => {
    let data = {
        data: {
            userid: req.params.userid,
            p:req.params.p,
            token: req.params.token
        },
        func: 'setpermission'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/setpermission/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'setpermission_'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/logs/:token/post", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
            log: req.body
        },
        func: 'postlog'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/logs/:token/get/:page", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
            page: req.params.page
        },
        func: 'getlogs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/channellist/:token", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
        },
        func: 'channellist'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/rolelist/:token/:p", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
            p: req.params.p
        },
        func: 'rolelist'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/uploadimage/:token/:p/:md5/:height/:width", async (req, res) => {
    let data = {
        data: { ...req.params},
        func: 'uploadimage'
    }
    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(async result => {
        job.progress(100);
        if (result) {
            let s = path.join(dir, '..', '..', '图片', req.params.md5 + '.png');
            try {
                await fs.promises.access(s);
                res.json({ errcode: 0, errmsg: 'ok', url: `${host}img/${req.params.md5}` });
                return;
            } catch (err) { }
            upload.single('image')(req, res, function (err) {
                if (err instanceof multer.MulterError) {
                    res.json({ errcode: 501, errmsg: 'err' });
                } else if (err) {
                    res.json({ errcode: 501, errmsg: 'err' });
                } else {
                    res.json({ errcode: 0, errmsg: 'ok', url: `${host}img/${req.file.filename.slice(0, req.file.filename.length - 4)}` });
                }
            });
        } else {
            res.json({ errcode: 403, errmsg: '无权限' });
        }
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/newrole/:token/:p", async (req, res) => {
    let data = {
        data: {
            ...req.params,
            data: req.body
        },
        func: 'newrole'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/decodedata", async (req, res) => {

    let data = {
        data: req.body,
        func: 'decodedata',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        res.json(result);
    }).catch((err) => {
        console.error(err);
        res.json({ errcode: 500, errmsg: 'error' });
    });

});

app.get("/102045949.json", (req, res) => {
    res.json({ bot_appid: 102045949 });
});

app.get("/102049250.json", (req, res) => {
    res.json({ bot_appid: 102049250 });
});

app.get('/s/:id', async (req, res) => {
    try {
        let id = req.params.id;
        if (id) id = id.trim();
        let data = {
            data: {
                id: id
            },
            func: 'link_jmp',
        }

        let job = await queue.add('deal_application_ops', data);

        WaitJobFinish(job).then(async (result) => {
            job.progress(100);
            if (result) {

                if (result.startsWith('<html>')) {
                    res.send(result);
                    return;
                }

                try {
                    let obj = JSON.parse(result);
                    if (obj) {
                        if (obj.errmsg && obj.data) {
                            res.json(obj);
                        } else {
                            res.redirect(302, result);
                        }
                    }
                } catch (err) {
                    res.redirect(302, result);
                }
            } else {
                res.json({ errcode: 503, errmsg: '该条记录已过期，下次记得早点来哦~' });
            }
        }).catch((err) => {
            res.status(500).send('');
        });
    } catch (err) {
        res.status(500).send('');
    }
});

app.get('/img/:name', async (req, res) => {

    if (req.params.name) req.params.name = req.params.name.trim();

    let data = {
        data: { ...req.params },
        func: 'outimages',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        if (result) {
            let name = req.params.name;
            let filePath = path.join(dir, '..', '..', '图片', `${name}.png`)
            const readStream = fs.createReadStream(filePath); // 创建可读流
            readStream.on('error', err => {
                res.type('json');
                res.json({ errcode: 404, errmsg: 'exp img' });
            });
            res.type('gif');
            readStream.pipe(res);
        } else {
            //res.json({ errcode: 404, errmsg: 'exp img' });
            let filePath = path.join(dir, '..', '..', '图片', `404.png`)
            const readStream = fs.createReadStream(filePath); // 创建可读流
            readStream.on('error', err => {
                res.type('json');
                res.json({ errcode: 404, errmsg: 'exp img' });
            });
            res.type('gif');
            readStream.pipe(res);
        }
    }).catch((err) => {
        console.error(err);
        res.json({ errcode: 500, errmsg: 'error' });
    });
});

app.get('/faces', async (req, res) => {

    try {

        let filePath = path.join(dir, '..', '..', 'faces.zip');

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', err => {
            res.status(500).send('');
        });
        res.type('zip');
        readStream.pipe(res);
    } catch (err) {
        res.json({ errcode: 500, errmsg: 'error' });
    }

});

app.get("/Api/geteventssets/:token/:p/:name", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'geteventssets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/upeventssets/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'upeventssets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/geteventssets_back/:token/:p/:name", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'geteventssets_back'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/upeventssets_back/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'upeventssets_back'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchblacklist/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchblacklist'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchuserinfo/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchuserinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delblack/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delblack'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/editblack/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'editblack'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delforbidenwords/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delforbidenwords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/forbidenwordswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'forbidenwordswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchforbidenkeywords/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchforbidenkeywords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delkeywords/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delkeywords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/keywordswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'keywordswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchkeywords/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchkeywords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getrolesets/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'getrolesets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchuinfo/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchuinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/changerole/:token/:roleid/:op/:time/:fromzero?", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'changerole'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_pkeywords/:token/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_pkeywords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_nowguilds/:token/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_nowguilds'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/op_pkeywords/:token/:op", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'op_pkeywords'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getguildsets/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'getguildsets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/upguildsets/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'upguildsets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delforbidenwords_nick/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delforbidenwords_nick'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/forbidenwordswr_nick/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'forbidenwordswr_nick'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchforbidenkeywords_nick/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchforbidenkeywords_nick'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchtask_banspeaking/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchtask_banspeaking'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/savetask_banspeaking/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'savetask_banspeaking'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_ptasks/:token/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_ptasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/op_ptasks/:token/:op", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'op_ptasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/deltasks/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'deltasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/taskswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'taskswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchtasks/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchtasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/mylogs/:token/get/:page", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
            page: req.params.page
        },
        func: 'getmylogs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchkeywords_lc/:token/:p/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchkeywords_lc'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delkeywords_lc/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delkeywords_lc'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/refkeywords_lc/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'refkeywords_lc'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/channellist_lc/:token", async (req, res) => {
    let data = {
        data: {
            token: req.params.token,
        },
        func: 'channellist_lc'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getCsets_lc/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'getCsets_lc'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/savesets_LC/:token", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'savesets_LC'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/sendmd/:token/:index/:channel", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'sendmd'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/delinvitecodes/:token/:p/:own", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'delinvitecodes'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/invitecodeswr/:token/:p/:own", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'invitecodeswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchinvitecodes/:token/:p/:page/:own", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchinvitecodes'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchinvitecode_r/:token/:p/:page/:own/:code", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchinvitecode_r'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchinvitecode_info/:token/:code", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchinvitecode_info'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/decodedata_invite", async (req, res) => {

    let data = {
        data: req.body,
        func: 'decodedata_invite',
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then((result) => {
        job.progress(100);
        res.json(result);
    }).catch((err) => {
        console.error(err);
        res.json({ errcode: 500, errmsg: 'error' });
    });

});

app.get("/Api/delGpoint/:token/:p/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'delGpoint'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/Gpointswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'Gpointswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchGpoints/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchGpoints'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getGuildVefSets/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'getGuildVefSets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/AnswerVef/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'AnswerVef'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/slogsuop/:token/:type/:uid/:time", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'slogsuop'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getGuildOfficeSets/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'getGuildOfficeSets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/DisbanApply/:token", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'DisbanApply'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_officetasks/:token/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_officetasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/del_officetask/:token/:taskid/:close", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'del_officetask'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/deal_officetasks/:token/:taskid/:optype/:bantime", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'deal_officetasks'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/delforbidenwordsdb/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'delforbidenwordsdb'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_guildsnew/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_guildsnew'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/forbidenwordsdbwr/:token/:id?", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'forbidenwordsdbwr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/transport_points_guild/:token/:id?", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'transport_points_guild'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchforbidenwordsdb/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchforbidenwordsdb'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchGpoints_byid/:token/:guildid", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchGpoints_byid'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchuserpoints/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchuserpoints'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/transport_point_point/:token/:id?", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'transport_point_point'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_useraddress/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_useraddress'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/upuseraddress/:token", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'upuseraddress'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_shopinfo/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_shopinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/Goodsinfoswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'Goodsinfoswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchchannelgoods/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchchannelgoods'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/delchannelgoods/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'delchannelgoods'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchgoodscards/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchgoodscards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/uploadgoodscards/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'uploadgoodscards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/editonegoodscards/:token/:id/:op", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'editonegoodscards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/editallgoodscards/:token/:id/:op", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'editallgoodscards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/gaingoods/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'gaingoods'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/historygoodslogs/:token/:isall/:isfinish/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'historygoodslogs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/hassendgoods/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'hassendgoods'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/delguildcardsdb/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'delguildcardsdb'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchguildcardsdb/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchguildcardsdb'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/Cardsdbinfoswr/:token/:p", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'Cardsdbinfoswr'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/editonedbcards/:token/:id/:op", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'editonedbcards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/editalldbcards/:token/:id/:op", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'editalldbcards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/uploaddbcards/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'uploaddbcards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchdbcards/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchdbcards'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/onworklists/:token/:order/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'onworklists'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/upointslist/:token/:id/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'upointslist'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/delallpoints/:token/:id", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'delallpoints'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/upointschangelogs/:token/:user/:id/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'upointschangelogs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/changeuserpoint/:token/:id/:user/:amount", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'changeuserpoint'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getpointtaskinfo/:token/:id", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'getpointtaskinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/savepointtaskinfo/:token/:id", async (req, res) => {
    let data = {
        data: {
            ...req.params,
            data: req.body
        },
        func: 'savepointtaskinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchforbidenwordsdbbyid/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchforbidenwordsdbbyid'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchuserpointsbank/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchuserpointsbank'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/transport_point_bank/:token", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'transport_point_bank'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/userpointsbankgain/:token/:id", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'userpointsbankgain'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/getPayProfileinfo/:token/:url_slug", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'getPayProfileinfo'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetchgpaysets/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetchgpaysets'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/willingpaycancle/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'willingpaycancle'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/willingpayensure/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'willingpayensure'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.post("/Api/willingpay/:token", async (req, res) => {
    let data = {
        data: { ...req.params, data: req.body },
        func: 'willingpay'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/changeuserpointbank/:token/:id/:user/:amount", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'changeuserpointbank'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/delallpointsbank/:token/:id", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'delallpointsbank'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/upointslistbank/:token/:id/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'upointslistbank'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/uwillingpaylist/:token/:page", async (req, res) => {
    let data = {
        data: {
            ...req.params
        },
        func: 'uwillingpaylist'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/op_pnowguilds/:token/:op/:guildid", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'op_pnowguilds'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/fetch_pexpimgs/:token/:page", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'fetch_pexpimgs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/op_pexpimgs/:token/:op/:hash", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'op_pexpimgs'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.get("/Api/ad_gainGoods/:token", async (req, res) => {
    let data = {
        data: { ...req.params },
        func: 'ad_gainGoods'
    }

    let job = await queue.add('deal_application_ops', data);
    WaitJobFinish(job).then(result => {
        job.progress(100);
        res.json(result);
    }).catch(err => {
        res.json({ errcode: 500, errmsg: 'error' });
    })
});

app.all('*', (req, res) => { res.status(500).send(''); });

let qua = new Queue('初遇小竹Api服务队列', {
    limiter: {
        max: 100,//限制并发每1s 100条
        duration: 1000,
    }, defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: global.redisconf
});
qua.process('deal_application_ops', 50, async (job) => {
    let { data, func } = job.data;
    return await handlers[func](data);
});

process.on('exit', function () {
    server.close();
});

async function imgs2img_html(imgs, text) {
    if (imgs.length > 0 || text) {
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
        answer.resourcepath = '';
        let html = await render(path.join(dir, '..', '..', 'resource', 'template', 'image', `image.html`), answer);
        return html;
    }
    return false;
}

let rqueue = new Queue('初遇小竹Redis键过期队列', {
    limiter: {
        max: 100,//限制并发每1s 100条
        duration: 1000,
    }, defaultJobOptions: {
        removeOnComplete: 1000, //最多保存1000条记录
        removeOnFail: 1000,
    }, redis: global.redisconf
});

rqueue.process('键过期事件', 10, async (job) => {
    let name = job.data;
    let head = '';

    head = 'ZuCacheVef:AnswerVef:';
    if (name.startsWith(head)) {
        let info = name.slice(head.length);
        let arr = info.split(':');
        if (arr.length == 2) {
            try {
                await ext.Del_guild_member({ guild_id: arr[0], author_id: arr[1], sandbox: false, add_blacklist: false, delete_history_msg_days: 0 });
            } catch (err) { }
        }
    }

});