import {Suspense, lazy} from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { message } from 'antd';
import PrivateRoute from './PrivateRoute';
import Login from '../view/login';
import JoinMeeting from '../view/join';
import Meeting from '../view/meeting';
import SlaveScreen from '../view/slave';
import { useClientErrorLog } from '@/hooks/useClientErrorLog';
// import ScreenReginShare from '../view/screenRegionShare';

import '../assets/style/global.scss';
import '../assets/style/index.scss';

message.config({
  duration: 2,
  maxCount: 3,
});

// TODO：懒加载不生效
// const Login = lazy(() => import('../view/login'));
// const JoinMeeting = lazy(() => import(/* webpackChunkName: join*/ '../view/join'));
// const Meeting = lazy(() => import(/* webpackChunkName: meeting*/ '../view/meeting'));
// const SlaveScreen = lazy(() => import('../view/slave'));
// const ScreenReginShare = lazy(() => import('../view/screenRegionShare'));

export default function App() {
  useClientErrorLog();

  return (
    <Suspense fallback={'加载中。。。'}>  {/* TODO: 加loading */}
    <Router>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route
            path="/join"
            element={
              <PrivateRoute>
                <JoinMeeting />
              </PrivateRoute>
            }
          />
          <Route
            path="/meeting"
            element={
              <PrivateRoute>
                <Meeting />
              </PrivateRoute>
            }
          />
          <Route path="/slaveScreen" element={<SlaveScreen />} />
          {/* <Route path="/screenRegionShare/:type" element={<ScreenReginShare />} /> */}
        </Routes>
    </Router>
    </Suspense>
  );
}
