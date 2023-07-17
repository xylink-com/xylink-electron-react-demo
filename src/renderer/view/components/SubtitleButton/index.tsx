/**
 * 同传字幕按钮
 */
import { useEffect, useState } from 'react';
import { LanguageType } from '@xylink/xy-electron-sdk';
import { ShowLanguage, LocalLanguage } from '@/type/enum';
import { Popover } from 'antd';
import DebounceButton from '@/components/DebounceButton';
import SVG from '@/components/Svg';
import xyRTC from '@/utils/xyRTC';

import './index.scss';
import { useRecoilState } from 'recoil';
import { captionIsStartState, captionShowLanguageState } from '@/utils/state';
import { languageList } from '@/enum';

const SubtitleButton = () => {
  const [localLanguage, setLocalLanguage] = useState(LocalLanguage.CHINESE);
  const [showLanguage, setShowLanguage] = useRecoilState(
    captionShowLanguageState
  );
  const [visible, setVisible] = useState(false);
  const [isStart, setIsStart] = useRecoilState(captionIsStartState); // 是否开启字幕

  // 设置本地说话的语言
  useEffect(() => {
    if(isStart){
      if (localLanguage === LocalLanguage.CHINESE) {
        xyRTC.setCaptionLanguage(LanguageType.CHINESE);
      } else if (localLanguage === LocalLanguage.ENGLISH) {
        xyRTC.setCaptionLanguage(LanguageType.ENGLISH);
      }
    }
  }, [isStart, localLanguage]);

  useEffect(()=>{
    if(!isStart){
      xyRTC.setCaptionLanguage(LanguageType.NONE);
    }
  },[isStart])

  //  设置本地说话的语言
  const switchLocalLanguage = (language: LocalLanguage) => {
    setLocalLanguage(language);
  };

  // 设置字幕显示的语言
  const switchShowLanguage = (language: ShowLanguage) => {
    setShowLanguage(language);
  };

  // 开启关闭字幕
  const toggleSubtitle = () => {
    setIsStart((prev)=>!prev);
  };

  const content = (
    <>
      <div className="select__item">
        <p>我说的语言</p>
        <ul>
          {Object.keys(languageList.local).map((key) => (
            <li
              key={key}
              value={localLanguage}
              className={key === localLanguage ? 'selected' : ''}
              onClick={() => {
                switchLocalLanguage(key as LocalLanguage);
              }}
            >
              {languageList.local[key as LocalLanguage]}
            </li>
          ))}
        </ul>
        <div className="h-line" />
      </div>
      <div className="select__item">
        <p>字幕显示的语言</p>
        <ul>
          {Object.keys(languageList.show).map((key) => (
            <li
              key={key}
              value={showLanguage}
              className={`${key === showLanguage ? 'selected' : ''}`}
              onClick={() => {
                switchShowLanguage(key as ShowLanguage);
              }}
            >
              {languageList.show[key as ShowLanguage]}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div className={`button-box`}>
      <DebounceButton onClick={toggleSubtitle} className="button">
        <SVG icon={isStart ? 'subtitle_stop' : 'subtitle'} />
        <div className="title"> {isStart ? '关闭字幕' : '开启字幕'} </div>
      </DebounceButton>
      <Popover
        content={content}
        visible={visible}
        onVisibleChange={setVisible}
        trigger="click"
        placement="top"
        overlayClassName="xy-popover select-popover"
      >
        <div className="arrow">
          <SVG icon="arrow" />
        </div>
      </Popover>
    </div>
  );
};

export default SubtitleButton;
