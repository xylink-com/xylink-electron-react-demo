/**
 * 头像
 */
import { Image } from 'antd';
import defaultUserIcon from '@/assets/img/type/noicon.png';
import { ImageProps } from 'rc-image';
import style from './index.module.scss';

interface IAvatarProps extends ImageProps {
  src?: string;
  className?: string;
  preview?: boolean;
}

const Avatar = (props: IAvatarProps) => {
  const {
    src = defaultUserIcon,
    className,
    preview = false,
    width = 32,
    height = 32,
  } = props;

  return (
    <Image
      className={`${style.avatar} ${className}`}
      src={src}
      fallback={defaultUserIcon}
      preview={preview}
      width={width}
      height={height}
      {...props}
    />
  );
};

export default Avatar;
