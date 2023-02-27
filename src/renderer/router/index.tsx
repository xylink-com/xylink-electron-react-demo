import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { message } from 'antd';
import PrivateRoute from './PrivateRoute';
import Login from '../view/login';
import JoinMeeting from '../view/join';
import Meeting from '../view/meeting';

import '../assets/style/global.scss';
import '../assets/style/index.scss';

message.config({
  duration: 2,
  maxCount: 3,
});

export default function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
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
        </Routes>
    </Router>
  );
}
