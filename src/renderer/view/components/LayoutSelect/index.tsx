import  { ReactElement, useEffect, useState } from 'react';
import { Popover } from 'antd';
import { ILayoutItem } from '@/type';
import './index.scss';
import { TemplateModel } from '@xylink/xy-electron-sdk';
import SVG from '@/components/Svg';
import { useSetRecoilState } from 'recoil';
import {
  toolbarState,
} from '@/utils/state';
import { LAYOUT_MODEL_MAP } from '@/enum';

interface IProps {
  children: ReactElement;
  contentPartCount: number;
  templateModel: TemplateModel;
  switchLayout: (templateModel: TemplateModel) => void;
}

const LayoutSelect = (props: IProps) => {
  const { children, contentPartCount, templateModel } = props;
  const [visible, setVisible] = useState(false);
  const setToolVisible = useSetRecoilState(toolbarState);

  useEffect(() => {
    setToolVisible((state) => ({
      ...state,
      enableHidden: !visible,
      canHidden: !visible,
    }));
  }, [visible, setToolVisible]);

  const switchLayout = (key: TemplateModel) => {
    if (key === templateModel) {
      return;
    }

    props.switchLayout(key);
  };

  const renderLayout = () => {
    const { normal, content } = LAYOUT_MODEL_MAP;
    let layoutMap = contentPartCount> 0 ? content : normal;

    return (
      <>
        {layoutMap.map((layoutList: ILayoutItem[], index) => {
          return (
            <div className="section" key={'layout_' + index}>
              {layoutList.map((item: ILayoutItem) => {
                const { key, text } = item;

                const style = templateModel === key ? { color: '#6092FF' } : {};

                return (
                  <div
                    className="item"
                    key={key}
                    onClick={() => {
                      switchLayout(key);
                    }}
                  >
                    {templateModel === key ? (
                      <SVG icon={`${key}_active`} className="layout__select-icon" />
                    ) : (
                      <SVG icon={key} className="layout__select-icon" />
                    )}

                    <div className="text" style={style}>
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  const content = (
    <div className="layout__select">
      <div className="layout__select-head">窗口布局</div>
      <div className="layout__select-content">{renderLayout()}</div>
    </div>
  );

  return (
    <Popover
      content={content}
      visible={visible}
      onVisibleChange={setVisible}
      trigger="click"
      placement="top"
      overlayClassName="xy-popover select-popover layout-select-popover"
    >
      {children}
    </Popover>
  );
};

export default LayoutSelect;
