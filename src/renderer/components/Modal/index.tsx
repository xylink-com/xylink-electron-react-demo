import { ReactNode } from 'react';
import { Modal , ModalProps} from 'antd';
import style from './index.module.scss';
import SVG from '@/components/Svg';
import cn from 'classnames';

interface IProps extends ModalProps {
  visible: boolean;
  children: ReactNode;
  title?: string;
  wrapClassName?: string;
  className?: string;
}

const IndexView = (props: IProps) => {
  const {title, wrapClassName, className, ...rest} = props;


  return (
    <Modal
      title={title?? <div>&nbsp;</div>}
      wrapClassName={cn(style['xy-modal'],!!wrapClassName && wrapClassName)}
      className={cn(style['xy-modal-body'],!!className && className)}
      maskClosable={false}
      closable={true}
      {...rest}
      closeIcon={<SVG icon="modalClose" style={{ width: 'auto', height: 'auto' }} />}
      width={420}
      centered={true}
      footer={null}
    >
      {props.children}
    </Modal>
  );
};

export default IndexView;

