/**
 * 设置
 */
import { useEffect } from 'react';
import { Menu, Modal } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import Device from './Device';
import Feedback from './Feedback';
import Version from './Version';
import Common from './Common';
import { TSettingType } from '@/type/index';
import {
  SettingOutlined,
  DesktopOutlined,
  VideoCameraOutlined,
  FormOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { currentTabState, settingModalState, unLogin } from '@/utils/state';

import './style/index.scss';
import VideoEffect from './VideoEffect';

const Setting = () => {
  const isUnLogin = useRecoilValue(unLogin);
  const [visible, setVisible] = useRecoilState(settingModalState);
  const [current, setCurrent] = useRecoilState(currentTabState);

  useEffect(() => {
    if (isUnLogin && current === 'video-effect') {
      setCurrent('common');
    }
  }, [current, isUnLogin]);

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
    !isUnLogin && {
      label: '虚拟背景和美颜',
      key: 'video-effect',
      icon: <DesktopOutlined />,
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
  ].filter(Boolean) as ItemType[];

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

            {current === 'video-effect' && !isUnLogin && <VideoEffect />}

            {current === 'feedback' && <Feedback />}
            {current === 'about' && <Version />}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Setting;
