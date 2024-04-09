import mysql from 'mysql';
import cluster from 'cluster';

const mysqlconfig = global.__mysqlconfig;

global.pool_tasks = mysql.createPool({

    connectionLimit: 10, // 设置最大连接数为10
    waitForConnections: false, // 设置为 false，无可用连接时立即抛出错误
    queueLimit: 0, // 设置为 0，队列已满时拒绝请求并抛出错误
    acquireTimeout: 2000, //获取连接耗时允许最长
    ...mysqlconfig,
    charset: 'utf8mb4',
    collation: 'utf8mb4_0900_ai_ci'

});

global.pool_application = mysql.createPool({

    connectionLimit: 60, // 设置最大连接数为60
    waitForConnections: false, // 设置为 false，无可用连接时立即抛出错误
    queueLimit: 0, // 设置为 0，队列已满时拒绝请求并抛出错误
    acquireTimeout: 2000, //获取连接耗时允许最长
    ...mysqlconfig,
    charset: 'utf8mb4',
    collation: 'utf8mb4_0900_ai_ci'

});

global.pool_message = mysql.createPool({

    connectionLimit: 60, // 设置最大连接数为60
    waitForConnections: false, // 设置为 false，无可用连接时立即抛出错误
    queueLimit: 0, // 设置为 0，队列已满时拒绝请求并抛出错误
    acquireTimeout: 2000, //获取连接耗时允许最长
    ...mysqlconfig,
    charset: 'utf8mb4',
    collation: 'utf8mb4_0900_ai_ci'

});

global.pool_message.on('error', (error) => {
    console.error(`数据库消息连接池启动失败：${error}`);
});

global.pool_application.on('error', (error) => {
    console.error(`数据库小程序连接池启动失败：${error}`);
});

global.pool_tasks.on('error', (error) => {
    console.error(`数据库定时任务连接池启动失败：${error}`);
});

process.on("exit", () => {
    global.pool_application.end();
    global.pool_message.end();
    global.pool_tasks.end();
});

if (cluster.isMaster) { //主进程才负责更新数据库

    async function TableInit(creat, index) {
        await new Promise((resolve, reject) => {
            global.pool_message.query(creat, err => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }).catch((err) => { console.log(err) });

        await new Promise((resolve, reject) => {
            global.pool_message.query(index, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }).catch((err) => { });
    }

    async function RunInit() {
        // 频道表
        await TableInit(`
CREATE TABLE IF NOT EXISTS Guilds (
  guildid VARCHAR(30) NOT NULL PRIMARY KEY,
  expiration_time BIGINT NOT NULL,
  sets TEXT,
  head TEXT,
  name TEXT,
  points TEXT
)
`, 'CREATE INDEX index_Guilds ON Guilds(guildid)');

        // 新事件设置表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS EventsSets (
  guildid VARCHAR(30) NOT NULL,
  fromchannel VARCHAR(30),
  tochannel VARCHAR(30),
  name VARCHAR(160) NOT NULL,
  useit VARCHAR(12),
  image TEXT,
  content LONGTEXT,
  PRIMARY KEY(guildid,name),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_EventsSets ON EventsSets(guildid,name)');

        // 新事件设置表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS EventsSets_back (
  guildid VARCHAR(30) NOT NULL,
  fromchannel VARCHAR(30),
  tochannel VARCHAR(30),
  name VARCHAR(160) NOT NULL,
  useit VARCHAR(12),
  image TEXT,
  content LONGTEXT,
  PRIMARY KEY(guildid,name),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_EventsSets_back ON EventsSets_back(guildid,name)');

        // 值班室任务列表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS Office_taskList (
  guildid VARCHAR(30) NOT NULL,
  fromuser VARCHAR(30) NOT NULL,
  tasktype VARCHAR(1) NOT NULL,
  taskid BIGINT AUTO_INCREMENT,
  mida BIGINT,
  midb BIGINT,
  closed VARCHAR(1),
  creattime BIGINT NOT NULL,
  PRIMARY KEY(taskid),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_Office_taskList ON Office_taskList(guildid,fromuser,tasktype,taskid,creattime,closed)');

        await TableInit(`
  CREATE TABLE IF NOT EXISTS TasksListK (
  id VARCHAR(30) NOT NULL,
  guildid VARCHAR(30) NOT NULL,
  cron TEXT NOT NULL,
  tochannel VARCHAR(30),
  content TEXT NOT NULL,
  image TEXT,
  useit VARCHAR(1) NOT NULL,
  editor TEXT NOT NULL,
  edit_time BIGINT NOT NULL,
  editornick TEXT,
  editorhead TEXT,
  task_type VARCHAR(1) NOT NULL,
  markdown VARCHAR(1),
  imgtextdp VARCHAR(1),
  PRIMARY KEY(id,guildid),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_TasksListK ON TasksListK(id,guildid,task_type)');

        // 频道用户权限表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guild_users (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY(guildid,user_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guild_users ON guild_users(guildid,user_id)');

        // 频道用户积分,警告
        await TableInit(`
CREATE TABLE IF NOT EXISTS guild_users_points (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  points BIGINT NOT NULL,
  warning_counts BIGINT NOT NULL,
  workdays BIGINT NOT NULL,
  cot_workdays BIGINT NOT NULL,
  usernick TEXT,
  userhead TEXT,
  cards BIGINT,
  lasttime BIGINT NOT NULL,
  time BIGINT,
  roles TEXT,
  PRIMARY KEY(guildid,user_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guild_users_points ON guild_users_points(guildid,user_id,lasttime,time)');

        // 频道用户黑名单列表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS blacklists (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  usernick TEXT,
  userhead TEXT,
  is_black BOOLEAN NOT NULL,
  last_black_time BIGINT,
  black_reason TEXT,
  black_admin TEXT,
  deblack_reason TEXT,
  deblack_admin TEXT,
  PRIMARY KEY(guildid,user_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_blacklists ON blacklists(guildid,user_id,last_black_time)');

        // 违禁词列表 默认必须撤回
        await TableInit(`
  CREATE TABLE IF NOT EXISTS forbidden_words (
  keyword VARCHAR(225) NOT NULL,
  guildid VARCHAR(30) NOT NULL,
  enabled_channels TEXT NOT NULL,
  deal_type VARCHAR(1) NOT NULL,
  op_time VARCHAR(7) NOT NULL,
  editor TEXT NOT NULL,
  edit_time BIGINT NOT NULL,
  editornick TEXT,
  editorhead TEXT,
  notifytext TEXT,
  saferoles TEXT,
  PRIMARY KEY(guildid,keyword),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_forbidden_words ON forbidden_words(guildid,keyword)');

        // 关键词列表新表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS reply_keywords_answers (
  id BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  enabled_channels TEXT NOT NULL,
  keyword VARCHAR(225) NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  cd VARCHAR(2) NOT NULL,
  editor TEXT NOT NULL,
  edit_time BIGINT NOT NULL,
  editornick TEXT,
  editorhead TEXT,
  approved VARCHAR(3) NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_reply_keywords_answers ON reply_keywords_answers(id,guildid,approved)');

        // 小程序登录态表
        await TableInit(`
CREATE TABLE IF NOT EXISTS QQApplication (
  token VARCHAR(96) NOT NULL,
  openid VARCHAR(64) NOT NULL,
  session_key TEXT NOT NULL,
  open_guild_id TEXT,
  member_role TEXT,
  member_userid TEXT,
  member_nick TEXT,
  member_head TEXT,
  lastlogintime BIGINT,
  PRIMARY KEY(openid)
)
`, 'CREATE INDEX index_QQApplication ON QQApplication(token,lastlogintime,openid)');

        // 日志系统
        await TableInit(`
  CREATE TABLE IF NOT EXISTS systemlogs (
  guildid VARCHAR(30) NOT NULL,
  userid VARCHAR(30) NOT NULL,
  usernick TEXT NOT NULL,
  userhead TEXT NOT NULL,
  userrole TEXT NOT NULL,
  time BIGINT NOT NULL,
  logs TEXT NOT NULL
)
`, 'CREATE INDEX index_systemlogs ON systemlogs(guildid,time,userid)');

        // 昵称违禁词列表 默认必须踢出
        await TableInit(`
  CREATE TABLE IF NOT EXISTS forbidden_words_nick (
  keyword VARCHAR(225) NOT NULL,
  guildid VARCHAR(30) NOT NULL,
  deal_type VARCHAR(1) NOT NULL,
  editor TEXT NOT NULL,
  edit_time BIGINT NOT NULL,
  editornick TEXT,
  editorhead TEXT,
  PRIMARY KEY(guildid,keyword),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_forbidden_words_nick ON forbidden_words_nick(guildid,keyword)');

        // 身份组过期表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS ExpRoles (
  guildid VARCHAR(30) NOT NULL,
  role_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  exp_time BIGINT NOT NULL,
  PRIMARY KEY(guildid,role_id,user_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_ExpRoles ON ExpRoles(guildid,role_id,user_id,exp_time)');

        // 图片过期表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS ExpImgs (
  hash VARCHAR(32) NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  last_time BIGINT NOT NULL,
  needcheck VARCHAR(1),
  PRIMARY KEY(hash)
)
`, 'CREATE INDEX index_ExpImgs ON ExpImgs(hash,last_time,needcheck)');

        // 邀请码表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS InviteCodes (
  code BIGINT NOT NULL AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  guildrid VARCHAR(30) NOT NULL,
  guildname TEXT,
  guildhead TEXT,
  authorid VARCHAR(30) NOT NULL,
  authorname TEXT,
  authorhead TEXT,
  idesc TEXT,
  groles TEXT,
  gpoints TEXT,
  gbantime INT,
  invitecnt INT,
  exp_time BIGINT NOT NULL,
  PRIMARY KEY(code),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_InviteCodes ON InviteCodes(code,guildid,authorid,exp_time)');

        // 被邀请用户表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS InvitedUs (
  code BIGINT NOT NULL,
  userid VARCHAR(30) NOT NULL,
  username TEXT,
  userhead TEXT,
  entertime BIGINT,
  PRIMARY KEY(code,userid),
  FOREIGN KEY(code) REFERENCES InviteCodes(code) ON DELETE CASCADE
)
`, 'CREATE INDEX index_InvitedUs ON InvitedUs(code,userid)');

        // 频道积分类型表
        await TableInit(`
CREATE TABLE IF NOT EXISTS Guilds_Points (
  guildid VARCHAR(30) NOT NULL,
  point_id VARCHAR(30) NOT NULL,
  point_name VARCHAR(40) NOT NULL,
  point_desc TEXT,
  canenter VARCHAR(1),
  canleave VARCHAR(1),
  enter_rate INT,
  leave_rate INT,
  sold VARCHAR(1),
  soldprice INT,
  limitamount_min INT,
  limitamount_max INT,
  cantrans VARCHAR(1),
  transrate INT,
  bank VARCHAR(1),
  bankenterrate INT,
  bankleaverate INT,
  bankrate INT,
  exp_seconds INT,
  canchangeenter VARCHAR(1),
  canchangeleave VARCHAR(1),
  changeenter_rate INT,
  changeleave_rate INT,
  guilds TEXT,
  PRIMARY KEY(guildid,point_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_Guilds_Points ON Guilds_Points(guildid,point_id,point_name)');

        // 频道用户积分表新表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guild_users_points_new (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  point_id VARCHAR(30) NOT NULL,
  points BIGINT UNSIGNED NOT NULL,
  lasttime BIGINT NOT NULL,
  head TEXT,
  nick TEXT,
  PRIMARY KEY(guildid,user_id,point_id),
  FOREIGN KEY(guildid,point_id) REFERENCES Guilds_Points(guildid,point_id) ON DELETE CASCADE,
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guild_users_points_new ON guild_users_points_new(guildid,user_id,point_id,lasttime)');

        // 频道用户积分银行表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guild_users_points_bank (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  point_id VARCHAR(30) NOT NULL,
  points BIGINT UNSIGNED NOT NULL,
  lasttime BIGINT NOT NULL,
  PRIMARY KEY(guildid,user_id,point_id),
  FOREIGN KEY(guildid,user_id,point_id) REFERENCES guild_users_points_new(guildid,user_id,point_id) ON DELETE CASCADE,
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guild_users_points_bank ON guild_users_points_bank(guildid,user_id,point_id,lasttime)');

        // 频道用户积分变动日志表
        await TableInit(`
CREATE TABLE IF NOT EXISTS gupointschangelogs (
  id BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  point_id VARCHAR(30) NOT NULL,
  changepoint BIGINT NOT NULL,
  reason TEXT,
  time BIGINT NOT NULL,
  opuserid VARCHAR(30),
  opnick TEXT,
  ophead TEXT,
  PRIMARY KEY(id),
  FOREIGN KEY(guildid,point_id) REFERENCES Guilds_Points(guildid,point_id) ON DELETE CASCADE,
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_gupointschangelogs ON gupointschangelogs(guildid,user_id,point_id,time)');

        // 频道撤回消息表
        await TableInit(`
CREATE TABLE IF NOT EXISTS HistoryMessages (
  mid BIGINT AUTO_INCREMENT,
  content LONGTEXT,
  time BIGINT,
  PRIMARY KEY(mid)
)
`, 'CREATE INDEX index_HistoryMessages ON HistoryMessages(mid,time)');

        // 频道消息id表
        await TableInit(`
CREATE TABLE IF NOT EXISTS MessagesId (
  guildid VARCHAR(30) NOT NULL,
  type VARCHAR(1) NOT NULL,
  id TEXT NOT NULL,
  time BIGINT,
  PRIMARY KEY(guildid,type),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_MessagesId ON MessagesId(guildid,type,time)');

        // 频道用户表情表态记录
        await TableInit(`
CREATE TABLE IF NOT EXISTS guild_users_reaction (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  actionid VARCHAR(60) NOT NULL,
  time BIGINT,
  PRIMARY KEY(guildid,user_id,actionid),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guild_users_reaction ON guild_users_reaction(guildid,user_id,actionid,time)');

        // 敏感词词库列表
        await TableInit(`
CREATE TABLE IF NOT EXISTS ForbiddenWordsDB (
  id BIGINT AUTO_INCREMENT,
  author_id VARCHAR(30) NOT NULL,
  dbdesc TEXT,
  nick TEXT,
  head TEXT,
  words TEXT,
  time BIGINT,
  PRIMARY KEY(id)
)
`, 'CREATE INDEX index_ForbiddenWordsDB ON ForbiddenWordsDB(id,author_id,time)');

        // 用户频道列表
        await TableInit(`
CREATE TABLE IF NOT EXISTS qqapplication_guilds (
  openid VARCHAR(64) NOT NULL,
  guser_id VARCHAR(64),
  quser_id VARCHAR(64),
  guilds TEXT,
  time BIGINT,
  PRIMARY KEY(openid)
)
`, 'CREATE INDEX index_qqapplication_guilds ON qqapplication_guilds(openid,guser_id,quser_id)');

        // 用户地址列表
        await TableInit(`
CREATE TABLE IF NOT EXISTS qqapplication_address (
  openid VARCHAR(64) NOT NULL,
  address TEXT,
  time BIGINT,
  PRIMARY KEY(openid)
)
`, 'CREATE INDEX index_qqapplication_address ON qqapplication_address(openid)');

        // 频道礼品列表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guildsgoods (
  id BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  type VARCHAR(1),
  name TEXT,
  image TEXT,
  rest BIGINT,
  daymax BIGINT,
  roleid TEXT,
  rolename TEXT,
  rolesecs BIGINT,
  pointcnt BIGINT,
  point_id VARCHAR(30),
  point_name TEXT,
  limitpa BIGINT,
  limitpb BIGINT,
  groupname TEXT,
  onsold VARCHAR(1),
  goodsdesc TEXT,
  descimg TEXT,
  saferoles TEXT,
  start TEXT,
  end TEXT,
  needaddress VARCHAR(1),
  time BIGINT,
  PRIMARY KEY(id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildsshop ON guildsshop(id,guildid,onsold)');

        // 频道礼品每日兑换记录表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS guildgoodsdaylog (
  guildid VARCHAR(30) NOT NULL,
  id BIGINT,
  todaycnt BIGINT,
  texttime VARCHAR(20),
  time BIGINT,
  PRIMARY KEY(guildid,id,texttime),
  FOREIGN KEY(id) REFERENCES guildsgoods(id) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildgoodsdaylog ON guildgoodsdaylog(guildid,id,texttime,time)');

        // 频道礼品用户每日兑换记录表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS guildgoodsdayuserlog (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  id BIGINT,
  todaycnt BIGINT,
  texttime VARCHAR(20),
  time BIGINT,
  PRIMARY KEY(guildid,user_id,id,texttime),
  FOREIGN KEY(id) REFERENCES guildsgoods(id) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildgoodsdayuserlog ON guildgoodsdayuserlog(guildid,user_id,id,texttime,time)');

        // 频道礼品卡密表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guildsgood_cards (
  cardid BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  id BIGINT,
  card VARCHAR(80) UNIQUE NOT NULL,
  onsold VARCHAR(1),
  time BIGINT,
  PRIMARY KEY(cardid),
  FOREIGN KEY(id) REFERENCES guildsgoods(id) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildsgood_cards ON guildsgood_cards(cardid,guildid,id,card,onsold,time)');

        // 频道礼品兑换日志表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guildsgoodslogs (
  logid BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  id BIGINT,
  type VARCHAR(1),
  name TEXT,
  image TEXT,
  pointcnt BIGINT,
  point_name TEXT,
  userid VARCHAR(30),
  usernick TEXT,
  userrole VARCHAR(2),
  userhead TEXT,
  finish VARCHAR(1),
  content TEXT,
  time BIGINT,
  PRIMARY KEY(logid),
  FOREIGN KEY(id) REFERENCES guildsgoods(id) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildsgoodslogs ON guildsgoodslogs(logid,guildid,id,userid,time,finish)');

        // 频道自定义卡密库列表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guildcardsdb (
  id BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  type VARCHAR(1),
  roleid TEXT,
  rolename TEXT,
  rolesecs BIGINT,
  pointcnt BIGINT,
  point_id VARCHAR(30),
  point_name TEXT,
  gaincnt BIGINT,
  fixchannel VARCHAR(30),
  time BIGINT,
  PRIMARY KEY(id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildcardsdb ON guildcardsdb(id,guildid)');

        // 频道自定义卡密表
        await TableInit(`
CREATE TABLE IF NOT EXISTS guildcards (
  cardid BIGINT AUTO_INCREMENT,
  guildid VARCHAR(30) NOT NULL,
  id BIGINT,
  card VARCHAR(80) UNIQUE NOT NULL,
  onsold VARCHAR(1),
  time BIGINT,
  PRIMARY KEY(cardid),
  FOREIGN KEY(id) REFERENCES guildcardsdb(id) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guildcards ON guildcards(cardid,guildid,id,card,onsold,time)');

        // 频道用户积分定时重置任务
        await TableInit(`
CREATE TABLE IF NOT EXISTS gupointsresettasks (
  useit VARCHAR(1) NOT NULL,
  guildid VARCHAR(30) NOT NULL,
  point_id VARCHAR(30) NOT NULL,
  resetpoint BIGINT NOT NULL,
  hours TEXT,
  weekdays TEXT,
  days TEXT,
  moths TEXT,
  time BIGINT NOT NULL,
  PRIMARY KEY(guildid,point_id),
  FOREIGN KEY(guildid,point_id) REFERENCES Guilds_Points(guildid,point_id) ON DELETE CASCADE,
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_gupointsresettasks ON gupointsresettasks(useit,guildid,point_id,time)');

        // 频道用户赞助数据表
        await TableInit(`
  CREATE TABLE IF NOT EXISTS guserpayrecord (
  guildid VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  out_trade_no TEXT,
  payurl TEXT,
  head TEXT,
  nick TEXT,
  point_id VARCHAR(30),
  point_cnt BIGINT,
  thisamount BIGINT,
  totalamount BIGINT,
  time BIGINT,
  PRIMARY KEY(guildid,user_id),
  FOREIGN KEY(guildid) REFERENCES Guilds(guildid) ON DELETE CASCADE
)
`, 'CREATE INDEX index_guserpayrecord ON guserpayrecord(guildid,user_id,time)');

        global.pool_application.end();
        global.pool_message.end();
        global.pool_tasks.end();
    }

    RunInit();

}