import store from '@/utils/store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();

  useEffect(() => {
    // 未登录 返回首页
    const { deviceId } = store.get('xyLoginInfo');

    if (!deviceId) {
      navigate('/');

      return;
    }
  }, [history]);

  return children;
}

export default PrivateRoute;
