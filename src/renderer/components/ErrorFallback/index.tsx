import { Button } from 'antd';

const ErrorFallback = () => {
    return (
      <div>
        <h4>程序出现异常，请刷新重试</h4>
        <Button type='primary' onClick={() => window.location.reload()}>刷新</Button>
      </div>
    );
}

export default ErrorFallback;
