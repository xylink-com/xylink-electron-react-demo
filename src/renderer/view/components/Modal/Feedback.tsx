import { useEffect, useState } from 'react';
import xyRTC from '@/utils/xyRTC';
import { Button, message, Input } from 'antd';
// import { SERVER } from '@/utils/config';

// import './index.scss';
// import { TServerEnv } from '@/type';

const { TextArea } = Input;

interface IProps {
  // env: TServerEnv;
  onClose?: () => void;
}

const Feedback = (props: IProps) => {
  // const { env } = props;
  const [uploadLoading, setUploadLoading] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    // 设置log server
    // const { logServer } = SERVER(env);

    // xyRTC.logger.setLogServer(logServer);
    xyRTC.on('LogUploadResult', uploadResult);

    return () => {
      xyRTC.off('LogUploadResult', uploadResult);
    };
  }, []);

const uploadResult = (event: any) => {
    const { code } = event;

    if (code === 'XYSDK:969001') {
      message.info('提交成功');

      setContent('');
      props.onClose && props.onClose();
    } else {
      message.info('提交失败');
    }
    setUploadLoading(false);
  };

  const upload = () => {
    setUploadLoading(true);

    try {
      xyRTC.logUpload(content);
    } catch (err) {
      console.log('upload error: ', err);
      message.info('提交失败');
      setContent('');
      props.onClose && props.onClose();
      setUploadLoading(false);
    }
  };

  return (
    <div className="feedback">
      <div className="feedback__content">
        <div className="item">
          <div className="key">内容描述</div>
          <div className="value">
            <TextArea
              placeholder="请输入您的宝贵意见和建议"
              style={{ height: '150px' }}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="feedback__footer">
        <Button
          className="upload-btn"
          loading={uploadLoading}
          onClick={upload}
          type="primary"
          disabled={!content.trim()}
        >
          {uploadLoading ? '提交中' : '提交'}
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
