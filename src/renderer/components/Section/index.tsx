import { ReactNode } from 'react';
import AppHeader from '../Header';
import { ipcRenderer } from 'electron';

interface IProps {
  children: ReactNode;
}

const Section = (props: IProps) => {
  const showWebMeeting = () => {
    ipcRenderer.send('webviewShowWebMeeting');
  };

  return (
    <div className="xy-section">
      <AppHeader maximize={false} />
      <section className="right">
        <div className="section-content">{props.children}</div>
      </section>
      <section className="left">
        <div className="left-bg" onDoubleClick={showWebMeeting}></div>
      </section>
    </div>
  );
};

export default Section;
