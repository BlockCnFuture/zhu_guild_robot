本项目为《初遇小竹》机器人源代码，包括小程序后端，开发本项目时本人刚学习JavaScript两个月，代码非常混乱，中英混合，酌情观看

网页制图部分参考了yunzaibot，建议使用低版本chromium，而非谷歌，这样内存占用更低点

本项目使用 **Apache 2.0** 协议进行分发，二次修改需要注明原始版权

小程序后端在 [plugins/初遇小竹/lib/qqApplication](https://github.com/BlockCnFuture/zhu_guild_robot/tree/main/plugins/%E5%88%9D%E9%81%87%E5%B0%8F%E7%AB%B9/lib/qqApplication) 需要更改https证书为自己的证书

配套QQ小程序源代码：[https://github.com/BlockCnFuture/zhu_guild_robot_miniapp](https://github.com/BlockCnFuture/zhu_guild_robot_miniapp)

**注意：** 本程序在高并发下，bull或mysql查询存在死锁问题（还没具体排查是谁的问题），个人使用没问题，商用的话不支持太高的并发，给出的建议：升级bull队列库，或者改成更高效的[bee-queue](https://github.com/bee-queue/bee-queue)、检查使用了`SELECT ... FOR UPDATE`语句或使用了事务的查询函数，检查在获取连接后，是否主动释放了连接，将连接回放至连接池

运行前准备环境：

nodejs、pm2、redis、mysql8.0(或以上)、chromium浏览器

运行前修改文件：`app.js`、`Redis键过期生产者.js`、`频道事件生产者.js`，修改redis、mysql、小程序、QQ机器人(私域) 的信息。如果对bull不够熟悉，请不要修改任务队列名(如：初遇小竹消息队列），以防无法接收事件

安装依赖：`npm install`

安装pm2：`npm i pm2`

运行：

`npx pm2 start app.js --name 消费者`

`npx pm2 start Redis键过期生产者.js --name 键事件`

`npx pm2 start 频道事件生产者.js --name 生产者`

故障重启：

`npx pm2 restart app.js --name 消费者`

停机维护：

先：`npx pm2 stop 生产者`、`npx pm2 stop 键事件`，再：`npx pm2 stop 消费者`，防止堆积大量任务

查看log：

`npx pm2 log`

程序提供了bull队列库的网页控制台，默认地址：http://127.0.0.1:5225/

网页控制台可查看任务队列状态、重启失败任务等

部署建议给服务器套上CDN，并开启请求合并和qps限制，以防大量无效/重复任务堆积在任务队列
