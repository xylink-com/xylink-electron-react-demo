/**
 * 电子铭牌逻辑：
 * 1. 看远端，远端打开电子铭牌，显示电子铭牌，远端未打开电子铭牌，根据本地是否打开人脸信息显示
 * 2. 看本地，本地点开电子铭牌，显示电子铭牌，本地未打开电子铭牌，根据本地是否打开人脸信息显示
 */
import { memo, useCallback } from 'react';
import { IFacePosition, ILayout, FaceType, IAIFaceInfo } from '@xylink/xy-electron-sdk';
import { useRecoilValue } from 'recoil';
import {
  AIFaceMapState,
  broadCastState,
  faceTypeState,
  localVideoFlip,
} from '@/utils/state';
import { LOCAL_VIEW_ID } from '@/enum';

interface IProps {
  item: ILayout;
}

const FaceInfo = (props: IProps) => {
  const { item } = props;
  const videoFlip = useRecoilValue(localVideoFlip);
  const AIFaceMap = useRecoilValue(AIFaceMapState); // 人脸位置等信息
  const faceType = useRecoilValue(faceTypeState); // 远端人脸 显示类型
  const broadCast = useRecoilValue(broadCastState); // 是否广播本地电子铭牌

  const getFacePosition = useCallback(
    (position: IFacePosition) => {
      const w = item.position.width;
      const h = item.position.height;
      const _videoWidth = item.roster.videoWidth || 0;
      const _videoHeight = item.roster.videoHeight || 0;

      let nW = w;
      let nH = h;

      let xOffset = 0;
      let yOffset = 0;

      if (_videoHeight > 0 && _videoWidth > 0) {
        const scale = w / h;
        const vScale = _videoWidth / _videoHeight;

        if (vScale >= scale) {
          if (_videoWidth >= w) {
            nH = _videoHeight / (_videoWidth / w);
          } else {
            nH = _videoHeight * (w / _videoWidth);
          }

          yOffset = (h - nH) / 2;
        } else {
          if (_videoHeight >= h) {
            nW = _videoWidth / (_videoHeight / h);
          } else {
            nW = _videoWidth * (h / _videoHeight);
          }

          xOffset = (w - nW) / 2;
        }
      }

      const a = 10000; // 缩放系数

      const x1 = (position.left * nW) / a + xOffset;
      const y1 = (position.top * nH) / a + yOffset;

      const x2 = (position.right * nW) / a + xOffset;
      const y2 = (position.bottom * nH) / a + yOffset;

      let startX = x1;

      if (item.sourceId === LOCAL_VIEW_ID && videoFlip) {
        startX = w - x2;
      }

      return {
        startX,
        startY: y1,
        width: x2 - x1,
        height: y2 - y1,
      };
    },
    [
      item.position.width,
      item.position.height,
      item.roster.videoHeight,
      item.roster.videoWidth,
      item.sourceId,
      videoFlip
    ]
  );

  const AIFace = AIFaceMap.get(item.roster.callUri);

  // 未开启摄像、content、无人脸信息 以上情况不显示
  if (
    !(item.roster.state === 5 && !item.roster.isContent && AIFace)
  ) {
    return null;
  }

  const {
    calluri = '',
    type,
    isLocal = false,
    faceInfoArr = [],
  } = AIFace;
  const isRemoteElectronicBadge = type === 2; // 远端打开了电子铭牌
  const isDetect = faceType === FaceType.Detect;
  const isElectronicBadge = faceType === FaceType.EletronicBadge;
  const positionLen = faceInfoArr.length;

  // 本地/远端开启电子铭牌，显示电子铭牌
  const isBroadCast =
    (isLocal && broadCast) || (!isLocal && isRemoteElectronicBadge);

  return (
    <>
      {faceInfoArr.map((faceInfo: IAIFaceInfo, index: number) => {
        const key = calluri + index;
        const { userName = '', userTitle = '' } = faceInfo|| {};

        if (!userName) {
          return null;
        }

        const { startX, startY, width, height } =
          getFacePosition(faceInfo.position) || {};

        const style = {
          width: width + 'px',
          height: height + 'px',
          left: startX + 'px',
          top: startY + 'px',
        };

        const badgeStyle = {
          marginTop: height + 20 + 'px',
        };

        const detectStyle = {
          width: width + 'px',
          height: height + 'px',
          backgroundSize: `${width}px ${height}px`,
        };

        if (isBroadCast) {
          const style =
            positionLen === 1
              ? { left: '20%', bottom: '12%' }
              : { left: startX + 'px', top: startY + height + 20 + 'px' };

          if (userName) {
            return (
              <div key={key} className="face-card" style={style}>
                <div className="face-user-name">{userName}</div>
                {userTitle && (
                  <div className="face-user-title">{userTitle}</div>
                )}
              </div>
            );
          }

          return null;
        }

        return (
          <div key={key} className="face-scan" style={style}>
            {isElectronicBadge && (
              <div className="face-card" style={badgeStyle}>
                <div className="face-user-name">{userName}</div>
                {userTitle && (
                  <div className="face-user-title">{userTitle}</div>
                )}
              </div>
            )}

            {isDetect && (
              <>
                <div className="face-scan-name">
                  <div className="face-user-name">{userName}</div>
                  {userTitle && (
                    <div className="face-user-title">{userTitle}</div>
                  )}
                </div>
                <div className="face-detect" style={detectStyle} />
              </>
            )}
          </div>
        );
      })}
    </>
  );
};

export default memo(FaceInfo);
