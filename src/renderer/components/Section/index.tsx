import { ReactNode } from 'react';
import AppHeader from '../Header';

interface IProps {
  children: ReactNode;
}

const Section = (props: IProps) => {
  return (
    <div className="xy-section">
      <AppHeader maximize={false} />
      <section className="left" />
      <section className="right">
        <div className="section-content">{props.children}</div>
      </section>
    </div>
  );
};

export default Section;
