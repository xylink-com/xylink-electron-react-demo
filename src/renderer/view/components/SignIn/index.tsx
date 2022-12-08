import { useEffect, useMemo } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button'
import style from './index.module.scss';
import xyRTC from '@/utils/xyRTC';
import xss from 'xss';

import { useRecoilState, useRecoilValue, useResetRecoilState } from 'recoil';
import { signInState, interactiveState } from '@/utils/state';
import { EventType } from '@xylink/xy-electron-sdk';
import useTimer from './useTimer'

const IndexView = () => {
  const { copywriting, duration, endUtcTime, webViewUrl, questionnaireId, eventType, endAuto } = useRecoilValue(interactiveState);
  const [{ modal }, setSignInState] = useRecoilState(signInState);
  const resetInteractive = useResetRecoilState(interactiveState);
  const resetSignIn = useResetRecoilState(signInState);

  const time = useTimer({
    endUtcTime,
    eventType,
    duration,
    endAuto
  })

  const onSignIn = () => {
    if (eventType === EventType.START) {
      xyRTC.signIn(webViewUrl, questionnaireId)
    } else if ((eventType === EventType.STOP)) {
      resetInteractive();
      resetSignIn();
    }
  }

  useEffect(() => {
    if (eventType === EventType.START || eventType === EventType.STOP) {
      setSignInState((state) => ({
        ...state,
        modal: true,
        promp: false,
      }))
    }
  }, [eventType]);

  const dialogSubContent = useMemo(() => {
    let content = "请点击下方按钮，完成签到";
    if (eventType === EventType.STOP || endAuto) {
      content = copywriting.dialogSubContent.replace('{0}', time ? `<span class="mark">${time}</span>` : '');
    }

    return content;
  }, [copywriting.dialogSubContent, time]);

  const createDesc = () => {
    return {
      __html: xss(dialogSubContent, {
        whiteList: {
          span: ['class']
        }
      })
    }
  }

  return (
    <Modal
      visible={modal}
      onCancel={() => {
        if (eventType === EventType.START) {
          setSignInState((state) => ({
            ...state,
            modal: false,
            promp: true,
          }))
        } else {
          resetInteractive();
          resetSignIn();
        }
      }}
      title={copywriting.dialogTitle}
    >
      <div className={style.signInContainer}>
        <div className={style.title}>{copywriting.dialogContent}</div>
        <div className={style.desc} dangerouslySetInnerHTML={createDesc()} />
      </div>
      <div className={style.buttonWrapper}>
        <Button bType="PRIMARY" onClick={onSignIn}>{copywriting.dialogLabel}</Button>
      </div>
    </Modal>
  );
};

export default IndexView;