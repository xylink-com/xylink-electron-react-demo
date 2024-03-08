import { Modal, ModalProps } from 'antd';
import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';
import style from './index.module.scss';
interface IProps extends ModalProps{
  visible: boolean;
  children: React.ReactNode;
  onMouseEnterHandle?: (e: SyntheticEvent) => void;
  onMouseLeaveHandle?: (e: SyntheticEvent) => void;
}

const App= (props: IProps) => {
  const {visible, children, ...rest} = props;
  const [open, setOpen] = useState(visible);
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);


  useEffect(()=>{
    setOpen(visible);
  },[visible])

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  const onMouseEnterHandle = (e: React.SyntheticEvent<Element, Event>)=>{
    setDisabled(false);
    props.onMouseEnterHandle?.(e);
  }
  const onMouseLeaveHandle = (e: React.SyntheticEvent<Element, Event>)=>{
    setDisabled(true);
    props.onMouseLeaveHandle?.(e);
  }

  return (
    <>
      <Modal
        title={null}
        visible={open}
        footer={null}
        mask={false}
        maskClosable={false}
        closable={false}
        wrapClassName={style.modalWrapper}
        modalRender={modal => (
          <Draggable
            disabled={disabled}
            bounds={bounds}
            onStart={(event, uiData) => onStart(event, uiData)}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
        {...rest}
      >
        <div
            style={{
              width: '100%',
              cursor: 'move',
            }}

            onMouseEnter={onMouseEnterHandle}
            onMouseLeave={onMouseLeaveHandle}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
          >
           {children}
          </div>
      </Modal>
    </>
  );
};

export default App;
