/**
 * 关于界面
 */
import { useEffect, useState } from 'react';
import xyRTC from '@/utils/xyRTC';

const Version = () => {
  const [about, setAbout] = useState({ version: '', update: '' });

  useEffect(() => {
    const splitData = xyRTC.getVersion()?.split('- build on');
    const about = {
      version: splitData[0],
      update: splitData[1],
    };

    setAbout(about);
  }, []);

  return (
    <div className="setting__content-about">
      <div className="about-version">版本号：{about.version}</div>
      <div className="about-version about-time">变更时间：{about.update}</div>

      <div>CopyRight © 2022,XYLink Inc.</div>
    </div>
  );
};

export default Version;
