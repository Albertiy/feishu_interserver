var express = require('express');
var router = express.Router();
var fs = require('fs');
let eventService = require('../src/service/eventDispose')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

router.post('/subscribe', function (req, res, next) {
  console.log('【---=====接收到subscribe请求=====---】')
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
  /** 若为验证请求，直接返回挑战字段 */
  if (type == "url_verification") {
    console.log("[type]: url_url_verification")
    // token 需要持久化，用于验证事件。算了，不验证也行。
    returnBack = {
      "challenge": data?.challenge
    }
  }
  /** 若为回调事件，判断是否是请假成功事件 */
  else if (type == "event_callback") {
    console.log("[type]: event_callback")
    // 当前只需要请假类型中的一个，前一个直接放弃
    if (data.event && data.event.type == "leave_approvalV2") {
      console.log('请求体：%o', data);
      fs.writeFileSync('./info.txt', JSON.stringify(data))  // 写入文件，方便后续处理
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
      eventService.sendTimeOffEvents(eventBody.user_id, eventBody.leave_start_time, eventBody.leave_end_time, eventBody.leave_reason).then((result) => {
        console.log('|| SUCCESS：%o', result)
      }).catch((err) => {
        console.log('|| FAILED：%o', err)
      });
    } else { }
  }
  res.json(returnBack)
})

router.get('/token', (req, res, next) => {
  eventService.getToken().then((result) => {
    res.send(result)
  }).catch((err) => {
    res.send(err)
  });
})