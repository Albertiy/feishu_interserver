const { default: axios } = require('axios');
const appConfig = require('../../config').application()
var dayjs = require('dayjs')

/** URL：获取访问token */
const getAccessTokenUrl = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

/** URL：发送创建请假日程请求 */
const sendTimeOffEventsUrl = "https://open.feishu.cn/open-apis/calendar/v4/timeoff_events";

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
module.exports.getToken = function () {
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

/**
 * 发起请假日程；
 * 若成功，返回的 code=0，msg="success"
 * @param {string} user_id 
 * @param {string} start_time 格式：YYYY-MM-DD hh:mm:ss
 * @param {string} end_time   格式：YYYY-MM-DD hh:mm:ss
 * @param {string} leave_reason 
 * @returns {Promise<{code:number, data:object, msg:string}>} 响应体
 */
module.exports.sendTimeOffEvents = function (user_id, start_time, end_time, leave_reason) {
    return new Promise((resolve, reject) => {
        this.getToken().then((result) => {
            console.log('获取token结果: %o', result)
            let token = result.tenant_access_token;
            let formatedStartTime = dayjs(start_time)
            let formatedEndTime = dayjs(end_time)
            //是全天，保留日期
            if (formatedStartTime.isSame(formatedStartTime.startOf('day')) && formatedEndTime.isSame(formatedEndTime.startOf('day'))) {
                start_time = formatedStartTime.format('YYYY-MM-DD')
                end_time = formatedEndTime.format('YYYY-MM-DD')
            } else {  // 获取时间戳（秒数）
                start_time = Math.round(formatedStartTime.toDate() / 1000)
                end_time = Math.round(formatedEndTime.toDate() / 1000)
            }
            console.log('start_time: %o, \t end_time: %o', start_time, end_time);
            // resolve()
            let data = {
                user_id: user_id,
                timezone: "Asia/Shanghai",
                start_time: start_time,
                end_time: end_time,
                title: leave_reason,
                description: "",
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