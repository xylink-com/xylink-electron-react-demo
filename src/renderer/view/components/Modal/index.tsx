/**
 * 设置
 */
import { Menu, Modal } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import Device from './Device';
import Feedback from './Feedback';
import Version from './Version';
import Common from './Common';
import { TSettingType } from '@/type/index';
import {
  SettingOutlined,
  VideoCameraOutlined,
  FormOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useRecoilState } from 'recoil';
import { currentTabState, settingModalState } from '@/utils/state';

import './style/index.scss';

const Setting = () => {
  const [visible, setVisible] = useRecoilState(settingModalState);
  const [current, setCurrent] = useRecoilState(currentTabState);

  const items = [
    {
      label: '常规',
      key: 'common',
      icon: <SettingOutlined />,
    },
    {
      label: '设备',
      key: 'device',
      icon: <VideoCameraOutlined />,
    },
    {
      label: '反馈',
      key: 'feedback',
      icon: <FormOutlined />,
    },
    {
      label: '关于',
      key: 'about',
      icon: <BulbOutlined />,
    },
  ];

  const onCancel = () => {
    setCurrent('common');

    setVisible(false);
  };

  return (
    <>
      <Modal
        title="设置"
        wrapClassName="xy__setting-modal"
        maskClosable={false}
        closable={false}
        visible={visible}
        footer={null}
        width={660}
        centered={true}
        onCancel={onCancel}
        destroyOnClose={true}
      >
        <div className="setting__container">
          <div className="close-icon" onClick={onCancel} />

          <div className="setting__header">
            <Menu
              style={{ width: 170 }}
              selectedKeys={[current]}
              mode="vertical"
              onClick={(e: MenuInfo) => {
                setCurrent(e.key as TSettingType);
              }}
              items={items}
            />
          </div>

          <div className="setting__content">
            {current === 'common' && <Common />}

            {current === 'device' && <Device />}

            {current === 'feedback' && <Feedback />}
            {current === 'about' && <Version />}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Setting;
