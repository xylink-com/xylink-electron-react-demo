/**
 * 设置
 */
import { settingModalState } from '@/utils/state';
import { ReactNode } from 'react';
import { useSetRecoilState } from 'recoil';
import SettingModal from '../Modal';

interface IProps {
  className?: string;
  children?: ReactNode
}

const Setting = (props: IProps) => {
  const { ...rest } = props;
  const setVisible = useSetRecoilState(settingModalState);

  return (
    <>
      <SettingModal
      />

      <div
        {...rest}
        onClick={() => {
          setVisible(true);
        }}
      >
        {props.children}
      </div>
    </>
  );
};

export default Setting;
