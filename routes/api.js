const { default: axios } = require('axios');
var express = require('express');
var router = express.Router();
var fs = require('fs');
const appConfig = require('../config').application()

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

router.post('/subscribe', function (req, res, next) {
  /**
   * @type {{
   *  token: string,
   *  type: string,
   *  challenge?: string,
   *  event?: object,
   * }}
   */
  let data = req.body;
  if (!data) {
    res.json()
    return
  }
  let type = data.type;
  if (!type) {
    res.json()
    return
  }

  let returnBack = '';
  if (type == "url_verification") {
    //TODO token 需要持久化，用于验证事件
    returnBack = {
      "challenge": data?.challenge
    }
  } else if (type == "event_callback") {
    fs.writeFileSync('./info.txt', JSON.stringify(data))  // 写入文件
    console.log('%o', data);
    // 当前只需要请假类型
    if (data.event && data.event.type == "leave_approvalV2") {
      /**
       * @type {{
       *  app_id,
       *  tenant_key,
       *  type: string,
       *  instance_code,
       *  user_id: string,
       *  start_time: string,
       *  end_time: string,
       *  leave_name,
       *  leave_unit,
       *  leave_start_time,
       *  leave_end_time,
       *  leave_detail,
       *  leave_range,
       *  leave_interval,
       *  leave_reason: string,
       *  i18n_resources,
       *  locale,
       *  is_default,
       *  texts,
       * }}
       */
      let eventBody = data.event;
      sendTimeOffEvents(eventBody.user_id, eventBody.start_time, eventBody.end_time, eventBody.leave_reason).then((result) => {
        console.log('发送请假日程成功：%o', result)
      }).catch((err) => {
        console.log('发送请假日程失败：%o', err)
      });
    }
  }
  res.json(returnBack)
})

sendTimeOffEventsUrl = 'https://open.feishu.cn/open-apis/calendar/v4/timeoff_events';

/**
 * 发起请假日程；
 * 若成功，返回的 code=0，msg="success"
 * @param {string} user_id 
 * @param {string} start_time 
 * @param {string} end_time 
 * @param {string} leave_reason 
 * @returns {Promise<{code:number, data:object, msg:string}>} 响应体
 */
function sendTimeOffEvents(user_id, start_time, end_time, leave_reason) {
  return new Promise((resolve, reject) => {
    getToken().then((result) => {
      console.log('获取token结果: %o', result)
      let token = result.tenant_access_token;
      let data = {
        user_id: user_id,
        timezone: "Asia/Shanghai",
        start_time: start_time,
        end_time: end_time,
        title: leave_reason,
        // description: "",
      }
      axios.post(sendTimeOffEventsUrl, data, {
        params: { user_id_type: "user_id" },
        headers: { 'Authorization': 'Bearer ' + token }
      }).then((result) => { resolve(result.data) })
        .catch((err) => { reject('添加请假日程失败：' + err) });
    }).catch((err) => {
      reject('获取Token失败：' + err)
    });
  })
}

getAccessTokenUrl = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

/**
 * 获取HR小程序的 tenant_access_token
 * 若成功，msg='ok', code = 0, expire 是剩余过期时间
 * @returns { Promise<{
 *  code: number,
 *  expire: number,
 *  msg: string,
 *  tenant_access_token: string
 * }>} 响应体
 */
function getToken() {
  return new Promise((resolve, reject) => {
    let data = {
      app_id: appConfig.app_id,
      app_secret: appConfig.app_secret,
    }
    axios.post(getAccessTokenUrl, data).then((result) => {
      resolve(result.data)
    }).catch((err) => {
      reject(err)
    });
  })
}