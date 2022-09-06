import { useState } from 'react';
import xyRTC from '@/utils/xyRTC';
import { Button, message, Input } from 'antd';

const { TextArea } = Input;

interface IProps {
  onClose?: () => void;
}

const Feedback = (props: IProps) => {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [content, setContent] = useState('');

  const upload = () => {
    setUploadLoading(true);

    try {
      xyRTC.logUpload(content);

      message.info('提交成功');

      setContent('');

      props.onClose && props.onClose();
    } catch (err) {
      message.info('提交失败');
    }

    setUploadLoading(false);
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
