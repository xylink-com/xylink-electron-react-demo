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
  PRIVACY_AGREEMENT_URL,
  XYLINK_AGREEMENT_URL,
} from '@/enum';
import { LoginStatus, MeetingStatus } from '@/type/enum';
import Section from '@/components/Section';
import Setting from '../components/Setting';
import { SDK_ERROR_MAP } from '@/enum/error';
import { shell } from 'electron';
import { ILoginState } from '@xylink/xy-electron-sdk';
import { ILoginData } from '@/type';

import './index.scss';

const { XY, EXTERNAL } = MeetingStatus;

const Login = () => {
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
    const loginStateHandler = (e: ILoginState) => {
      const { state, info, error } = e;

      if (state === LoginStatus.Logined) {
        store.set('xyLoginInfo', info);

        navigate('join');
      } else if (state === LoginStatus.Logouted) {
        if (error === 'XYSDK:969001') {
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
    const { loginType } = userInfo;

    if (loginType === XY) {
      setVerifyDisabled(!(userInfo.phone && userInfo.password));
    }

    if (loginType === EXTERNAL) {
      setVerifyDisabled(
        !(userInfo.extID && userInfo.extUserId && userInfo.displayName)
      );
    }
  }, [userInfo]);

  const switchLoginType = () => {
    const loginType = userInfo.loginType === XY ? EXTERNAL : XY;

    setUserInfo((info) => ({
      ...info,
      loginType,
    }));

    store.set('xyUserInfo.loginType', loginType);
  };

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

    if (userInfo.loginType === XY) {
      const { phone, password } = e;

      xyRTC.login(phone, password);
    } else {
      const { extID, extUserId, displayName } = e;

      xyRTC.loginExternalAccount(extID, extUserId, displayName);
    }
  };

  const checkAgreement = (e: CheckboxChangeEvent) => {
    setCheckedAgreement(e.target.checked);
  };

  const openUrl = (event: MouseEvent<HTMLElement>, url: string) => {
    event?.preventDefault();
    shell.openExternal(url);
  };

  return (
    <Section>
      <div className="login-tab">
        <div>
          {userInfo.loginType === EXTERNAL ? '三方账号登录' : '账号密码登录'}
        </div>
        <div className="login-tab-click" onClick={switchLoginType}>
          {userInfo.loginType === EXTERNAL ? '账号密码登录' : '三方账号登录'}
        </div>
      </div>

      <Form onFinish={onLogin} initialValues={userInfo} className="xy-form">
        {userInfo.loginType === XY && (
          <>
            <Form.Item
              name="phone"
              rules={[{ required: true, message: '请输入账号!' }]}
            >
              <Input
                type="phone"
                placeholder="请输入账号"
                onChange={(e) => {
                  onChangeInput(e, 'phone');
                }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input
                type="password"
                placeholder="请输入密码"
                onChange={(e) => {
                  onChangeInput(e, 'password');
                }}
              />
            </Form.Item>
          </>
        )}

        {userInfo.loginType === EXTERNAL && (
          <>
            <Form.Item
              name="extID"
              rules={[{ required: true, message: '请输入企业ID!' }]}
            >
              <Input
                type="text"
                placeholder="请输入企业ID"
                onChange={(e) => {
                  onChangeInput(e, 'extID');
                }}
              />
            </Form.Item>
            <Form.Item
              name="extUserId"
              rules={[{ required: true, message: '请输入三方用户ID!' }]}
            >
              <Input
                type="text"
                placeholder="请输入三方用户ID"
                onChange={(e) => {
                  onChangeInput(e, 'extUserId');
                }}
              />
            </Form.Item>
            <Form.Item
              name="displayName"
              rules={[{ required: true, message: '请输入入会名称！' }]}
            >
              <Input
                type="text"
                placeholder="请输入入会名称"
                onChange={(e) => {
                  onChangeInput(e, 'displayName');
                }}
              />
            </Form.Item>
          </>
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
            </span>
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
