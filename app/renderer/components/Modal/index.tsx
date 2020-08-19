import React, { useState } from 'react';
import { Modal, Input } from 'antd';

// @ts-ignore
const SettingModal = ({ visible, onHandleOk, onHandleCancel, value = '' }) => {
  const [proxy, setProxy] = useState(value);

  const handleOk = () => {
    if (value !== proxy) {
      onHandleOk(proxy);
    } else {
      onHandleCancel();
    }
  };

  const handleCancel = () => {
    onHandleCancel();
  };

  const onChange = (e: any) => {
    setProxy(e.target.value);
  };

  return (
    <>
      <Modal
        title="修改代理"
        // @ts-ignore
        placeholder="Input Proxy..."
        cancelText="取消"
        okText="修改"
        allowClear={true}
        visible={visible}
        width={350}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Input
          maxLength={50}
          value={proxy}
          onChange={onChange}
          onPressEnter={handleOk}
        />
      </Modal>
    </>
  );
};

export default SettingModal;
