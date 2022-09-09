/**
 * 统计信息
 */

import { useEffect, useRef, useState } from 'react';
import xyRTC from '@/utils/xyRTC';
import { IStatistics } from '@xylink/xy-electron-sdk';
import { Base64 } from 'js-base64';

import './index.scss';

interface IProps {
  onClose: () => void;
}

const Internals = (props: IProps) => {
  const [statistics, setStatistics] = useState<IStatistics>();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const getStatistics = () => {
      const data = xyRTC.getStatistics();

      setStatistics(data);
    };

    timer.current = setInterval(() => {
      getStatistics();
    }, 500);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, []);

  const { network } = statistics || {
    rtt: 0,
    rxDetectBw: 0,
    rxJitter: 0,
    rxLost: 0,
    txDetectBw: 0,
    txJitter: 0,
    txLost: 0,
  };

  const { people } = statistics || {
    audioTxInfo: [],
    audioRxInfo: [],
    videoRxInfo: [],
    videoTxInfo: [],
  };

  const { audioTxInfo, audioRxInfo, videoTxInfo, videoRxInfo } = people || {};

  const { content } = statistics || {
    audioTxInfo: [],
    audioRxInfo: [],
    videoRxInfo: [],
    videoTxInfo: [],
  };

  const isContent =
    (content?.audioTxInfo || []).length > 0 ||
    (content?.audioRxInfo || []).length > 0 ||
    (content?.videoRxInfo || []).length > 0 ||
    (content?.videoTxInfo || []).length > 0;

  return (
    <div className="debug">
      <div className="debug__container">
        <div className="close-icon" onClick={props.onClose} />
        <h4>网络探测</h4>
        <table className="table" cellPadding="0" cellSpacing="0" border={0}>
          <thead>
            <tr className="table-title">
              <th>通道名称</th>
              <th>网络带宽(kbps)</th>
              <th>丢包率(%)</th>
              <th>往返延时(ms)</th>
              <th>抖动(ms)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>发送</td>
              <td>{network?.txDetectBw || 0}</td>
              <td>{network?.txLost || 0}</td>
              <td>{network?.rtt || 0}</td>
              <td>{network?.txJitter || 0}</td>
            </tr>
            <tr>
              <td>接收</td>
              <td>{network?.rxDetectBw || 0}</td>
              <td>{network?.rxLost || 0}</td>
              <td>{network?.rtt || 0}</td>
              <td>{network?.rxJitter || 0}</td>
            </tr>
          </tbody>
        </table>

        <br />
        <h4>媒体加密</h4>
        <table className="table">
          <>
            <thead>
              <tr className="table-title">
                <th>加密算法</th>
                <th>{statistics?.encrypt}</th>
              </tr>
            </thead>
          </>
        </table>

        {isContent && (
          <>
            <br />
            <h4>内容共享</h4>
            <table className="table">
              <>
                <thead>
                  <tr className="table-title">
                    <th>通道名称</th>
                    <th>Codec</th>
                    <th>分辨率</th>
                    <th>帧率(fps)</th>
                    <th>码率(kbps)</th>
                  </tr>
                </thead>
                <tbody>
                  {content?.audioTxInfo?.map((item, index: number) => {
                    return (
                      <tr key={`audioTx` + index}>
                        <td>音频发送</td>
                        <td>{item.codecType}</td>
                        <td>----</td>
                        <td>0</td>
                        <td>{item.actBw}</td>
                      </tr>
                    );
                  })}
                  {content?.audioRxInfo?.map((item, index: number) => {
                    return (
                      <tr key={`audioRx` + index}>
                        <td>音频接收</td>
                        <td>{item.codecType}</td>
                        <td>----</td>
                        <td>0</td>
                        <td>{item.actBw}</td>
                      </tr>
                    );
                  })}
                  {content?.videoTxInfo?.map((item, index: number) => {
                    return (
                      <tr key={`videoTx` + index}>
                        <td>视频发送</td>
                        <td>{item.codecType}</td>
                        <td>{item.resolution}</td>
                        <td>{item.frameRate}</td>
                        <td>{item.actBw}</td>
                      </tr>
                    );
                  })}
                  {content?.videoRxInfo?.map((item, index: number) => {
                    return (
                      <tr key={`videoRx` + index}>
                        <td>{Base64.decode(item.displayName)}</td>
                        <td>{item.codecType}</td>
                        <td>{item.resolution}</td>
                        <td>{item.frameRate}</td>
                        <td>{item.actBw}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            </table>
          </>
        )}

        <br />
        <h4>与会者</h4>
        <table className="table">
          <>
            <thead>
              <tr className="table-title">
                <th>名称</th>
                <th>通道名称</th>
                <th>Codec</th>
                <th>分辨率</th>
                <th>帧率(fps)</th>
                <th>码率(kbps)</th>
              </tr>
            </thead>
            <tbody>
              {audioTxInfo?.map((item, index: number) => {
                return (
                  <tr key={`audioTx` + index}>
                    <td></td>
                    <td>音频发送</td>
                    <td>{item.codecType}</td>
                    <td>----</td>
                    <td>0</td>
                    <td>{item.actBw}</td>
                  </tr>
                );
              })}
              {audioRxInfo?.map((item, index: number) => {
                return (
                  <tr key={`audioRx` + index}>
                    <td></td>
                    <td>音频接收</td>
                    <td>{item.codecType}</td>
                    <td>----</td>
                    <td>0</td>
                    <td>{item.actBw}</td>
                  </tr>
                );
              })}
              {videoTxInfo?.map((item, index: number) => {
                return (
                  <tr key={`videoTx` + index}>
                    <td></td>
                    <td>视频发送</td>
                    <td>{item.codecType}</td>
                    <td>{item.resolution}</td>
                    <td>{item.frameRate}</td>
                    <td>{item.actBw}</td>
                  </tr>
                );
              })}
              {videoRxInfo?.map((item, index: number) => {
                return (
                  <tr key={`videoRx` + index}>
                    <td>{Base64.decode(item.displayName)}</td>
                    <td>视频接收</td>
                    <td>{item.codecType}</td>
                    <td>{item.resolution}</td>
                    <td>{item.frameRate}</td>
                    <td>{item.actBw}</td>
                  </tr>
                );
              })}
            </tbody>
          </>
        </table>
      </div>
    </div>
  );
};

export default Internals;
