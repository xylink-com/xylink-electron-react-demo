/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */

// CUSTOM 自定义布局时，需要自行计算Layout容器信息
export const getScreenInfo = (elementId:string, nextTemplateRate:number, offset = [0,0]) => {
  let { clientHeight, clientWidth } =
  document.getElementById(elementId) || document.body;

  clientHeight = clientHeight - offset[0];
  clientWidth = clientWidth - offset[1];

  const rateHeight = Math.floor(clientWidth * nextTemplateRate);
  const rateWidth = Math.floor(clientHeight / nextTemplateRate);
  const screenInfoObj = { rateHeight: 0, rateWidth: 0 };

  // 高充足，以屏幕宽计算高
  if (clientHeight > rateHeight) {
    screenInfoObj.rateHeight = rateHeight;
    screenInfoObj.rateWidth = clientWidth;
  } else {
    // 否则，以比例宽计算高
    screenInfoObj.rateHeight = clientHeight;
    screenInfoObj.rateWidth = rateWidth;
  }

  return screenInfoObj;
};
