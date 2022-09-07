/**
 * 数字键盘
 *
 */
import { ReactNode, useState } from 'react';
import { Modal } from 'antd';
import SVG from '@/components/Svg';

import './index.scss';
import xyRTC from '@/utils/xyRTC';
// import xyRTC from '@/utils/xyRTC';

const numArray = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

interface IProps {
  children?: ReactNode;
}

const NumberKeyBoard = (props: IProps) => {
  const [visible, setVisible] = useState(false);
  const [number, setNumber] = useState('');

  const onClose = () => {
    setVisible(false);
    setNumber('');
  };

  const sendDtmf = (value: string) => {
    const newNumber = number + value;

    setNumber(newNumber);

    xyRTC.sendDtmf(newNumber);
  };

  return (
    <>
      <Modal
        title=""
        wrapClassName="xy__setting-modal keyboard-modal"
        maskClosable={false}
        closable={false}
        visible={visible}
        footer={null}
        width={300}
        centered={true}
        onCancel={onClose}
      >
        <div className="keyboard-box">
          <div className="keyboard-header">
            <div className="keyboard-close" onClick={onClose}>
              <SVG icon="close" />
            </div>
          </div>
          <div className="keyboard-input">
            <span dir='ltr'>{number}</span>
          </div>
          <ul className="keyboard-number">
            {numArray.map((i) => {
              return (
                <li
                  key={i}
                  onClick={() => {
                    sendDtmf(i);
                  }}
                >
                  {i}
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
      <div
        onClick={() => {
          setVisible(true);
        }}
      >
        {props.children}
      </div>
    </>
  );
};

export default NumberKeyBoard;
