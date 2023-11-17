/**
 * 通用设置
 */
import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
} from 'antd';
import {
  DEFAULT_SETTING_INFO,
  LAYOUT_MODE_LIST,
  LAYOUT_MODE_MAP,
} from '@/enum';
import store from '@/utils/store';
import xyRTC from '@/utils/xyRTC';
import { ipcRenderer } from 'electron';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  broadCastState,
  callState,
  faceTypeState,
  settingInfoState,
  withDesktopAudioState,
  localResolutionState,
} from '@/utils/state';
import { FaceType, IModel, TFaceType } from '@xylink/xy-electron-sdk';
import { MeetingStatus } from '@/type/enum';
import { RuleObject } from 'antd/lib/form';
import { StoreValue } from 'antd/lib/form/interface';
import { ISettingInfo } from '@/type';
import { isMac } from '@/utils';

const { Option } = Select;

const Common = () => {
  const [settingInfo, setSettingInfo] = useRecoilState(settingInfoState);
  const meetingState = useRecoilValue(callState);
  const setSelectedResolution = useSetRecoilState(localResolutionState);
  const [faceType, setFaceType] = useRecoilState(faceTypeState);
  const [withDesktopAudio, setWithDesktopAudio] = useRecoilState(
    withDesktopAudioState
  );
  const [broadCast, setBroadCast] = useRecoilState(broadCastState);
  const [form] = Form.useForm();

  const isInMeeting = meetingState === MeetingStatus.MEETING;

  const { model } = settingInfo;

  // 校验服务器地址
  const handleCheckProxy = async (rule: RuleObject, value: StoreValue) => {
    if (!value) {
      return Promise.resolve();
    }

    const regex = RegExp(
      '^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:[0-9]*)?$'
    );

    if (!regex.test(value)) {
      return Promise.reject('服务器地址输入非法，请输入有效地址或IP');
    }

    return Promise.resolve();
  };

  const updateProxy = (values: ISettingInfo) => {
    store.set('xySettingInfo', { ...settingInfo, ...values });
    // 重启应用
    ipcRenderer.send('relaunch');
  };

  const resetProxy = () => {
    form.setFieldsValue({ ...settingInfo, ...DEFAULT_SETTING_INFO });

    setSettingInfo((info: ISettingInfo) => {
      const newInfo = { ...info, ...DEFAULT_SETTING_INFO };
      store.set('xySettingInfo', newInfo);

      return newInfo;
    });
  };

  // 切换布局模式
  // AUTO/CUSTOM
  const onSwitchModel = (val: IModel) => {
    setSettingInfo((info: any) => {
      const newInfo = { ...info, model: val };

      store.set('xySettingInfo', newInfo);

      return newInfo;
    });

    xyRTC.switchModel(val);
  };

  // 共享内容时采集电脑声音
  const onChangeContentAudio = (e: CheckboxChangeEvent) => {
    store.set('xyWithDesktopAudio', e.target?.checked);

    setWithDesktopAudio(e.target?.checked);
  };

  // 广播电子铭牌
  const changeBroadCast = (e: CheckboxChangeEvent) => {
    xyRTC?.broadcastEletronicBadge(e.target.checked);

    setBroadCast(e.target.checked);
  };

  // 是否显示远端人脸信息
  // 默认选择电子铭牌
  const changeShowFaceInfo = (e: CheckboxChangeEvent) => {
    const enable = e.target.checked;

    setFaceType(enable ? FaceType.EletronicBadge : '');

    xyRTC?.enableFaceDetectMode(faceType as TFaceType, enable);
  };

  // 选择人脸信息展示模式
  // 铭牌模式 | 扫描模式
  const changeFaceDetectMode = (e: RadioChangeEvent) => {
    const mode = e.target.value;

    setFaceType(mode);

    xyRTC?.enableFaceDetectMode(mode, true);
  };

  // 设置本地预览分辨率
  const onSelectResolution = (val: number) => {
    setSelectedResolution(val);

    xyRTC.setLocalPreviewResolution(val);
  };

  return (
    <div className="setting__content-common">
      {!isInMeeting && (
        <>
          <div className="setting-section">
            <div className="title">设置服务器</div>
            <div className="sub-title">
              更改服务器地址后，点击“修改”按钮客户端自动重启，再次登陆后生效
            </div>
            <Form
              className="setting-form"
              name="proxyForm"
              labelCol={{ flex: '100px' }}
              labelAlign="left"
              initialValues={settingInfo}
              colon={false}
              onFinish={updateProxy}
              form={form}
            >
              <Form.Item
                name="proxy"
                label="服务器地址"
                rules={[
                  { required: true, message: '请输入服务器地址' },
                  {
                    validateTrigger: 'onFinish',
                    validator: handleCheckProxy,
                  },
                ]}
              >
                <Input key="proxy" />
              </Form.Item>
              <Form.Item name="clientId" label="网关ID">
                <Input
                  key="clientId"
                  placeholder="不填写则用公有云环境默认值"
                />
              </Form.Item>
              <Form.Item name="clientSecret" label="网关Secret">
                <Input
                  key="clientId"
                  placeholder="不填写则用公有云环境默认值"
                />
              </Form.Item>
              <Form.Item name="extId" label="企业ID">
                <Input key="extId" placeholder="不填写则用公有云环境默认值" />
              </Form.Item>

              <Form.Item>
                <div className="setting-btn-box">
                  <Button
                    htmlType="submit"
                    className="operate-btn"
                    type="primary"
                  >
                    修改
                  </Button>
                  <Button
                    className="operate-btn"
                    type="default"
                    onClick={resetProxy}
                  >
                    恢复默认值
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>

          <div className="item">
            <div className="key">布局模式</div>
            <div className="value">
              <Select value={model} onChange={onSwitchModel}>
                {LAYOUT_MODE_LIST.map((key) => {
                  return (
                    <Option key={key} value={key}>
                      {LAYOUT_MODE_MAP[key]}
                    </Option>
                  );
                })}
              </Select>
            </div>
          </div>
        </>
      )}

      {/* <div className="item">
        <div className="key">本地分辨率</div>
        <div className="value">
          <Select
            style={{ width: 300 }}
            value={selectedResolution}
            onSelect={onSelectResolution}
          >
            {RESOLUTION_LIST.map(({ title, value }) => {
              return (
                <Option key={value} value={value}>
                  {title}
                </Option>
              );
            })}
          </Select>
        </div>
      </div> */}

      {/* mac 暂不支持 */}
      {!isMac && (
        <div className="item">
          <div className="key">内容共享</div>
          <div className="value">
            <Checkbox
              checked={withDesktopAudio}
              onChange={onChangeContentAudio}
            >
              共享内容时采集电脑声音
            </Checkbox>
          </div>
        </div>
      )}

      <div className="item">
        <div className="key">人脸识别</div>
        <div className="value">
          <Checkbox checked={broadCast} onChange={changeBroadCast}>
            广播本地电子铭牌
          </Checkbox>
        </div>
      </div>

      {isInMeeting && (
        <div className="item">
          <div className="key"></div>
          <div className="value face-value">
            <Checkbox checked={!!faceType} onChange={changeShowFaceInfo}>
              显示远端人脸信息
            </Checkbox>
            {!!faceType && (
              <Radio.Group
                className="face-type-group"
                value={faceType}
                onChange={changeFaceDetectMode}
              >
                <Radio value={FaceType.EletronicBadge}>
                  铭牌模式
                  <div className="electronic-icon" />
                </Radio>
                <Radio value={FaceType.Detect}>
                  扫描模式
                  <div className="detect-icon" />
                </Radio>
              </Radio.Group>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Common;
