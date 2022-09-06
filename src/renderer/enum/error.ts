
/**
 * 错误码
 */
 export const SDK_ERROR_MAP:Record<string,string> = {
  "XYSDK:969001": "成功",
  "XYSDK:961045": "企业id不存在",
  "XYSDK:962001": "无效的账号或密码",
  "XYSDK:962002": "没有登录",
  "XYSDK:962004": "账号不存在",
  "XYSDK:962030":"手机号码错误",
  "XYSDK:969002": "网络错误",
  "XYSDK:961048": "无法访问服务器",
  "XYSDK:969003": "内部状态错误",
  "XYSDK:963001": "云会议室密码不正确，请重试",
  "XYSDK:963002": "无效会议号",
  "XYSDK:963003": "会议异常断开",
  "XYSDK:964102": "该接口拒绝“公开访问”",
  "XYSDK:964103": "该接口的访问需要进行token认证，但是header中没有携带token；或者调用的接口未在api网关进行配置",
  "XYSDK:964104": "token过期",
  "XYSDK:964105": "token没有过期，但没有该接口访问权限",
  "XYSDK:964106": "refresh_token过期",
  "XYSDK:964107": "请求body内容超过1MB（请求体大小限制为1MB）",
  "XYSDK:964108": "api网关不存在该签名版本",
  "XYSDK:969004": "人脸识别未开通",
};

export const KICK_OUT_MAP:Record<string, string> = {
  "XYSDK:964000": "多个重复长连接建立",
  "XYSDK:964001": "您的账号在另一地点登录，您被迫下线",
  "XYSDK:964003": "登录过期",
};

export const RECORD_ERROR_MAP = {
  "XYSDK:963901": "录制参数错误",
  "XYSDK:963902": "没有录制权限",
  "XYSDK:963903": "云会议室不属于任何企业，无法录制",
  "XYSDK:963904": "当前云会议室存储空间已满，不能再发起录制", // 录制的存储空间已满，您无法开始录制
  "XYSDK:963905": "当前云会议室存储空间已满，不能再发起录制", // 云会议室存储空间已满，不能再发起录制
  "XYSDK:963906": "当前云会议室存储空间已满，不能再发起录制", // 所属部门的云会议室存储空间已满，不能再发起录制
  "XYSDK:963907": "当前云会议室存储空间已满，不能再发起录制", // 所属企业的云会议室存储空间已满，不能再发起录制
};