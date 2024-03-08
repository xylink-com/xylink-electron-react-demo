import cn from 'classnames';
import { createRoot } from 'react-dom/client';
import Toolbar from '@/components/Annotation/toolbar';
import Whiteboard from '@/components/Annotation/whiteboard';

import 'antd/dist/antd.css';
import style from './index.module.scss';

const { searchParams } = new URL(location.href);
const type = searchParams.get('type') || '';

const ScreenRegionShare = () => {
  return (
    <div
      className={cn(style.container, type === 'fullScreen' && style.fullScreen)}
    >
      <div className={cn(style.line, style.line1)}></div>
      <div className={cn(style.line, style.line2)}></div>
      <div className={cn(style.line, style.line3)}></div>
      <div className={cn(style.line, style.line4)}></div>
      <div
        className={style.center}
      >
        <Toolbar isLocalShare={true} />
        <Whiteboard isLocalShare={true} />
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(<ScreenRegionShare />);

export default ScreenRegionShare;
