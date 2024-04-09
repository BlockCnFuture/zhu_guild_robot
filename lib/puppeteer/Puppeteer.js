import fs from 'node:fs'
import os from 'node:os'
import lodash from 'lodash'
import puppeteer from 'puppeteer'
import path from 'path';
import md5 from 'md5'

// mac地址
let mac = '';

export default class PuppeteerRenderer {

    constructor() {
        this.config = {
            headless: 'new',
            args: [
                //'--single-process',
                //'--disable-gpu',
                //'--disable-setuid-sandbox',
                //'--no-sandbox',
                //'--no-zygote'
            ],
            executablePath: global.Puppeteer_executablePath
        };
        this.createDir(path.join(process.cwd(), 'cache'));
    }

    async createDir(dir) {
        if (!await fs.promises.access(dir).then(() => true).catch(() => false)) {
            let dirs = dir.split('/');
            for (let idx = 1; idx <= dirs.length; idx++) {
                let temp = dirs.slice(0, idx).join('/');
                if (!await fs.promises.access(temp).then(() => true).catch(() => false)) {
                    try {
                        await fs.promises.mkdir(temp);
                    } catch (e) { }
                }
            }
        }
    }

    /**
     * `chromium` 截图 带上data可检查图片是否有缓存
     * @param data.imgType  screenshot参数，生成图片类型：jpeg，png
     * @param data.quality  screenshot参数，图片质量 0-100，jpeg是可传，默认90
     * @param data.omitBackground  screenshot参数，隐藏默认的白色背景，背景透明。默认不透明
     * @param data.multiPage 是否分页截图，默认false
     * @param data.multiPageHeight 分页状态下页面高度，默认4000
     * @param data.pageGotoParams 页面goto时的参数
     * @return []img
     */
    async screenshot({ pageurl = '', pagefilepath = '', render_ret = null, data = {}, needblock = '', awaittime = 0, removes = [], clicks = [] }) {

        let browser = false;
        browser = await puppeteer.launch(this.config).catch((err, trace) => {
            let errMsg = err.toString() + (trace ? trace.toString() : '');
            if (typeof err == 'object') {
                console.log(JSON.stringify(err));
            } else {
                console.log(err.toString());
                if (errMsg.includes('Could not find Chromium')) {
                    console.log('没有正确安装Chromium，可以尝试执行安装命令：node ./node_modules/puppeteer/install.js');
                } else if (errMsg.includes('libatk-bridge')) {
                    console.log('没有正确安装Chromium，可尝试执行 sudo yum install -y chromium');
                }
            }
            console.log(err);
        })

        if (!browser) {
            console.log('puppeteer Chromium 启动失败');
            return false;
        }

        //await sleep(2000);

        let pageHeight = data.multiPageHeight || 4000;

        let buff = ''

        let ret = []

        let hash = `${Date.now()}${Math.random(100)} `;

        let savePath;
        if (render_ret) {
            savePath = path.join(process.cwd(), 'cache',`${hash}.html`);
            await fs.promises.writeFile(savePath, render_ret)
            pagefilepath = savePath;
        }

        let name = path.basename(pagefilepath) || pageurl;

        try {
            let page = await browser.newPage();
            let pageGotoParams = lodash.extend({ timeout: 120000 }, data.pageGotoParams || {});
            if (pageurl) await page.goto(pageurl, pageGotoParams);
            if (pagefilepath) await page.goto(`file://${pagefilepath}`, pageGotoParams);

            if (awaittime > 0) {
                await page.waitForTimeout(awaittime);
            }

            for (let ss of clicks) {
                await page.click(ss);
            }

            for (let ss of removes) {
                await page.evaluate((ss) => {
                    let unwantedElements = document.querySelectorAll(ss);
                    unwantedElements.forEach((element) => {
                        element.remove();
                    });
                }, ss);
            }

            let body = '';
            if (needblock != '') {
                body = await page.$(needblock);
            } else {
                body = await page.$('#container') || await page.$('.body');
            }

            if (!body) {
                await page.close();
                browser.close().catch((err) => console.log(err));
                return false;
            }

            // 计算页面高度
            let boundingBox = await body.boundingBox();

            // 分页数
            let num = 1;

            let randData = {
                type: data.imgType || 'jpeg',
                omitBackground: data.omitBackground || false,
                quality: data.quality || 90
            };

            if (data.multiPage) {
                randData.type = 'jpeg';
                num = Math.round(boundingBox.height / pageHeight) || 1;
            }

            if (data.imgType === 'png') {
                delete randData.quality;
            }

            if (!data.multiPage) {
                await page.setViewport({
                    width: parseInt(boundingBox.width) + 1,
                    height: parseInt(boundingBox.height) + 1,
                    deviceScaleFactor: 1.6 //控制分辨率
                });
                buff = await body.screenshot(randData);
                ret.push(buff);
            } else {
                // 分片截图
                if (num > 1) {
                    await page.setViewport({
                        width: boundingBox.width,
                        height: pageHeight + 100
                    });
                }
                for (let i = 1; i <= num; i++) {
                    if (i !== 1 && i === num) {
                        await page.setViewport({
                            width: boundingBox.width,
                            height: parseInt(boundingBox.height) - pageHeight * (num - 1)
                        });
                    }
                    if (i !== 1 && i <= num) {
                        await page.evaluate(pageHeight => window.scrollBy(0, pageHeight), pageHeight);
                    }
                    if (num === 1) {
                        buff = await body.screenshot(randData);
                    } else {
                        buff = await page.screenshot(randData);
                    }
                    if (num > 2) await Data.sleep(200);

                    ret.push(buff);
                }
            }
            page.close().catch((err) => console.log(err));
            if (savePath) await fs.unlink(savePath, (error) => { if (error) console.log(error); });
        } catch (error) {
            if (savePath) await fs.unlink(savePath, (error) => { if (error) console.log(error); });
            console.log(`图片生成失败:${name}:${error}`);
            /** 关闭浏览器 */
            browser.close().catch((err) => console.log(err));

            ret = [];
            return false;
        }

        if (ret.length === 0 || !ret[0]) {
            console.log(`图片生成为空:${name}`);
            return false;
        }

        browser.close().catch((err) => console.log(err));

        return data.multiPage ? ret : ret[0];
    }

}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            let curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

deleteFolderRecursive(path.join(process.cwd(), 'cache'))
global.webview = new PuppeteerRenderer();