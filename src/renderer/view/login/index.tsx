/**
 * 登录: 小鱼账号登录/三方账号登录
 */

import { useEffect, useState, ChangeEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Row, Button, Checkbox, message } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import xyRTC from '@/utils/xyRTC';
import store from '@/utils/store';
import {
  DEFAULT_LOGIN_INFO,
  DEFAULT_USER_INFO,
  IVideoEffectTabPaneType,
  LoginTypeMap,
  PRIVACY_AGREEMENT_URL,
  XYLINK_AGREEMENT_URL,
} from '@/enum';
import { LoginType } from '@/type/enum';
import Section from '@/components/Section';
import Setting from '../components/Setting';
// import Annotation from '@/components/Annotation';
import { SDK_ERROR_MAP } from '@/enum/error';
import { SUCCESS_CODE } from '@/enum';
import { shell } from 'electron';
import { initVideoEffect } from '@/utils/initVideoEffect';
import videoEffectStore from '@/utils/videoEffectStore';
import { bgManager } from '@/utils/virtualBgManager';
import { settingInfoState, videoEffectTab, unLogin } from '@/utils/state';
import { ILoginState } from '@xylink/xy-electron-sdk';

import './index.scss';
import { ILoginData } from '@/type';
import { useRecoilValue, useSetRecoilState } from 'recoil';

const { XY, EXTERNAL, THREE_XY, THREE_EXT_TOKEN } = LoginType;

const Login = () => {
  const setVideoEffectTab = useSetRecoilState(videoEffectTab);
  const setIsUnLogin = useSetRecoilState(unLogin);
  const { loginType = XY } = useRecoilValue(settingInfoState);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    const cacheUserInfo = store.get('xyUserInfo');

    if (!cacheUserInfo) {
      store.set('xyUserInfo', DEFAULT_USER_INFO);
    }
    return cacheUserInfo || DEFAULT_USER_INFO;
  }); // 用户信息
  const [isCheckedAgreement, setCheckedAgreement] = useState(false);
  const [verifyDisabled, setVerifyDisabled] = useState(true);

  useEffect(() => {
    setIsUnLogin(true);
    // 重置虚拟背景，美颜等效果
    initVideoEffect.reset();
    setVideoEffectTab(IVideoEffectTabPaneType.VIRTUAL_BG);

    if(process.env.NODE_ENV === 'production'){
      xyRTC.setLogLevel('NONE');
    }

    const loginStateHandler = (e: ILoginState) => {
      const { state, info, error } = e;

      if (state === 'Logined') {
        store.set('xyLoginInfo', info);

        // 更新虚拟背景和美颜的 userId，绑定三方账号
        if (info) {
          const userId = `${info.userId}`;

          bgManager.setUser(userId);
          videoEffectStore.setUser(userId);
        }

        setIsUnLogin(false);
        initVideoEffect.init();  // 初始化虚拟背景
        navigate('join');
      } else if (state === 'Logouted') {

        if (error === SUCCESS_CODE) {
          // 清空登录信息
          store.set('xyLoginInfo', DEFAULT_LOGIN_INFO);
          return;
        } else {
          message.info(SDK_ERROR_MAP[error] || '服务异常');
        }
      }
    };

    xyRTC.on('LoginState', loginStateHandler);

    return () => {
      xyRTC.off('LoginState', loginStateHandler);
    };
  }, []);

  useEffect(() => {
    const {
      extID,
      phone = '',
      password,
      extUserId,
      displayName,
      token,
    } = userInfo;

    let isDisabled = false;

    switch (loginType) {
      case XY:
        isDisabled = !(phone && password);
        break;
      case EXTERNAL:
        isDisabled = !(extID && extUserId && displayName);
        break;
      case THREE_XY:
        isDisabled = !(extID && phone && password);
        break;
      case THREE_EXT_TOKEN:
        isDisabled = !(extID && token);
        break;
    }

    setVerifyDisabled(isDisabled);
  }, [loginType, userInfo]);

  const onChangeInput = (e: ChangeEvent<HTMLInputElement>, key: string) => {
    setUserInfo((info) => ({
      ...info,
      [key]: e.target.value,
    }));

    store.set('xyUserInfo.' + key, e.target.value);
  };

  const onLogin = (e: ILoginData) => {
    if (!isCheckedAgreement) {
      message.info('您需要同意《服务协议》和《隐私政策》');
      return;
    }

    const {
      extID = '',
      phone = '',
      password = '',
      extUserId = '',
      displayName = '',
      authCode = '',
      isTempUser = false,
      token = '',
    } = e;

    switch (loginType) {
      case XY:
        xyRTC.login(phone, password);
        break;
      case EXTERNAL:
        xyRTC.loginExternalAccount(
          extID,
          extUserId,
          displayName,
          authCode,
          isTempUser
        );
        break;

      case THREE_XY:
        const accountArr = phone.split('-');
        const countryCode = accountArr.length === 1 ? '+86' : accountArr[0];
        const account = accountArr.length > 1 ? accountArr[1] : phone;

        xyRTC.loginXYAccount({
          extID,
          countryCode,
          account,
          password,
        });
        break;
      case THREE_EXT_TOKEN:
        xyRTC.loginExtToken({
          extID,
          token,
        });
        break;
    }
  };

  const checkAgreement = (e: CheckboxChangeEvent) => {
    setCheckedAgreement(e.target.checked);
  };

  const openUrl = (event: MouseEvent<HTMLElement>, url: string) => {
    event?.preventDefault();
    shell.openExternal(url);
  };

  const onChangeTempUser = (e: CheckboxChangeEvent) => {
    setUserInfo((info) => ({
      ...info,
      isTempUser: e.target.checked,
    }));

    store.set('xyUserInfo.isTempUser', e.target.checked);
  };

  return (
    <Section>
      {/* <Annotation/> */}
      <div className="login-tab">
        <div>{LoginTypeMap[loginType]}</div>
        {/* <Toolbar annotationStatus={true} /> */}

      </div>

      <Form onFinish={onLogin} initialValues={userInfo} className="xy-form">
        {[EXTERNAL, THREE_XY, THREE_EXT_TOKEN].includes(
          loginType
        ) && (
          <Form.Item
            name="extID"
            rules={[{ required: true, message: '请输入企业ID!' }]}
          >
            <Input
              type="text"
              placeholder="企业ID (必填)"
              onChange={(e) => {
                onChangeInput(e, 'extID');
              }}
            />
          </Form.Item>
        )}

        {[XY, THREE_XY].includes(loginType) && (
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入账号!' }]}
          >
            <Input
              type="phone"
              placeholder="账号 (必填)"
              onChange={(e) => {
                onChangeInput(e, 'phone');
              }}
            />
          </Form.Item>
        )}
        {[XY, THREE_XY].includes(loginType) && (
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input
              type="password"
              placeholder="密码 (必填)"
              onChange={(e) => {
                onChangeInput(e, 'password');
              }}
            />
          </Form.Item>
        )}
        {[EXTERNAL].includes(loginType) && (
          <Form.Item
            name="extUserId"
            rules={[{ required: true, message: '请输入三方用户ID!' }]}
          >
            <Input
              type="text"
              placeholder="三方用户ID (必填)"
              onChange={(e) => {
                onChangeInput(e, 'extUserId');
              }}
            />
          </Form.Item>
        )}
        {[EXTERNAL].includes(loginType) && (
          <Form.Item
            name="displayName"
            rules={
              [{ required: true, message: '请输入入会名称！' }]
            }
          >
            <Input
              type="text"
              placeholder={`入会名称 (${'必填'})`}
              onChange={(e) => {
                onChangeInput(e, 'displayName');
              }}
            />
          </Form.Item>
        )}

        {loginType === THREE_EXT_TOKEN && (
          <Form.Item
            name="token"
            rules={[{ required: true, message: '请输入token!' }]}
          >
            <Input
              type="text"
              placeholder="token (必填)"
              onChange={(e) => {
                onChangeInput(e, 'token');
              }}
            />
          </Form.Item>
        )}
        {[EXTERNAL].includes(loginType) && (
          <Form.Item
            name="authCode"
          >
            <Input
              type="text"
              placeholder={`请输入授权码 (${'选填'})`}
              onChange={(e) => {
                onChangeInput(e, 'authCode');
              }}
            />
          </Form.Item>
        )}

        {[EXTERNAL].includes(loginType) && (
          <Form.Item
            name="isTempUser"
            valuePropName="checked"
            className="isTempUser"
          >
            <Checkbox onChange={onChangeTempUser}>临时用户</Checkbox>
          </Form.Item>
        )}

        <div className="declare">
          <Checkbox checked={isCheckedAgreement} onChange={checkAgreement}>
            我已阅读并同意
            <span
              className="declare-url"
              onClick={(e) => {
                openUrl(e, XYLINK_AGREEMENT_URL);
              }}
            >
              《服务协议》
            </span>{' '}
            和
            <span
              className="declare-url"
              onClick={(e) => {
                openUrl(e, PRIVACY_AGREEMENT_URL);
              }}
            >
              《隐私政策》
            </span>
          </Checkbox>
        </div>

        <Row justify="center" className="xy-form-bottom">
          <Button
            disabled={verifyDisabled}
            className={`xy-btn ${verifyDisabled ? ' disabled-btn' : ''}`}
            type="primary"
            htmlType="submit"
          >
            登录
          </Button>

          <Setting>
            <div className="setting-btn">设置</div>
          </Setting>
        </Row>
      </Form>
    </Section>
  );
};

export default Login;
