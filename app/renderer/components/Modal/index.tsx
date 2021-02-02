import React, { useState, useEffect, useRef} from 'react';
import { Button, Modal, Input, Row, Col, Select } from "antd";
import {ISelectedDevice} from "../../type/index"
import "./index.css";

const {Option} = Select;

// @ts-ignore
const SettingModal = ({ visible, onHandleOk, onHandleCancel, value = '', xyRTC, deviceChangeType }) => {
  
  const [proxy, setProxy] = useState(value);
  const [cameraList, setCameraList] = useState([]);
  const [microphoneList, setMicrophoneList] = useState([]);
  const [speakerList, setSpeakerList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState({
    camera: "",
    microphone: "",
    speaker: "",
  });

  const selectedDeviceRef = useRef({
    camera: "",
    microphone: "",
    speaker: "",
  });

  useEffect(() => {
    (async () => {
      if (visible) {
        await updateDevices();
      }
    })();
  }, [xyRTC, visible]);

  useEffect(() => {
    (async () => {
      if (deviceChangeType === "camera") {
        await updateCameraDevices();
      } else if (deviceChangeType === "microphone") {
        await updateMicrophoneDevices();
      } else if (deviceChangeType === "speaker") {
        await updateSpeakerDevices();
      }

      setSelectedDevice(selectedDeviceRef.current);
    })();
  }, [deviceChangeType]);

  const updateDevices = async () => {
    await updateCameraDevices();
    await updateMicrophoneDevices();
    await updateSpeakerDevices();

    setSelectedDevice(selectedDeviceRef.current);
  };

  const updateCameraDevices = async () => {
    if (!xyRTC) {
      return;
    }

    const camera = await xyRTC.getDeviceList("camera");
    const selectedId = updateSelectedDevice(camera);

    setCameraList(camera);

    if(selectedId !==  selectedDevice.camera){
      onSwitchCamera(selectedId);
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      camera: selectedId,
    };
  };
  
  const updateMicrophoneDevices = async () => {
    if (!xyRTC) {
      return;
    }

    const microphone = await xyRTC.getDeviceList("microphone");
    const selectedId = updateSelectedDevice(microphone);

    setMicrophoneList(microphone);
    
    if(selectedId !== selectedDevice.microphone){
      onSwitchMicrophone(selectedId);
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      microphone: selectedId,
    };
  };

  const updateSpeakerDevices = async () => {
    if (!xyRTC) {
      return;
    }

    const speaker = await xyRTC.getDeviceList("speaker");
    const selectedId = updateSelectedDevice(speaker);

    setSpeakerList(speaker);

    if(selectedId !== selectedDevice.speaker){
      onSwitchSpeaker(selectedId)
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      speaker: selectedId,
    };
  };

  const updateSelectedDevice = (list:ISelectedDevice[]) => {
    let selectedId = "";
    const selectedDevice = list.filter((item) => item.isSelected);

    if (selectedDevice.length > 0) {
      selectedId = selectedDevice[0].devId;
    } else if (list.length > 0) {
      selectedId = list[0].devId;
    }

    return selectedId;
  };

  const handleOk = () => {
    if (value !== proxy) {
      onHandleOk(proxy);
    } else {
      onHandleCancel();
    }
  };

  const handleCancel = () => {
    onHandleCancel();
  };

  const onChange = (e:any) => {
    setProxy(e.target.value);
  };

  const onSwitchCamera = async (val:string) => {
    try {
      await xyRTC.switchDevice("camera", val);
    } catch (err) {
      console.log("switch camera device error: ", err);
    }
  }

  const onSwitchMicrophone = async (val:string) => {
    try {
      await xyRTC.switchDevice("microphone", val);
    } catch (err) {
      console.log("switch microphone device error: ", err);
    }
  }

  const onSwitchSpeaker = async (val:string) => {
    try {
      await xyRTC.switchDevice("speaker", val);
    } catch (err) {
      console.log("switch speaker device error: ", err);
    }
  }

  const onSelectCamera = async (val:string) => {
    setSelectedDevice({
      ...selectedDevice,
      camera: val,
    });

    onSwitchCamera(val);
  };
  const onSelectMicrophone = async (val:string) => {
    setSelectedDevice({
      ...selectedDevice,
      microphone: val,
    });

    onSwitchMicrophone(val);
  };
  const onSelectSpeaker = async (val:string) => {
    setSelectedDevice({
      ...selectedDevice,
      speaker: val,
    });
    
    onSwitchSpeaker(val);
  };


  return (
    <>
      <Modal
        title="设置"
        cancelText="取消"
        okText="确定"
        visible={visible}
        width={500}
        footer={null}
        onCancel={handleCancel}
      >
        <Row className="mb15">
          <Col span={4} className="center">
            <span>代理地址</span>
          </Col>
          <Col span={16}>
            <Input
              maxLength={50}
              value={proxy}
              onChange={onChange}
              onPressEnter={handleOk}
            />
          </Col>
          <Col span={4}>
            <Button type="link" onClick={handleOk}>
              设置
            </Button>
          </Col>
        </Row>

        <Row className="mb15">
          <Col span={4} className="center">
            <span>摄像头</span>
          </Col>
          <Col span={20}>
            <Select
              style={{ width: 300 }}
              value={selectedDevice.camera}
              onSelect={onSelectCamera}
            >
              {cameraList.map(({ devId, devName }) => {
                return (
                  <Option key={devId} value={devId}>
                    {devName}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>

        <Row className="mb15">
          <Col span={4} className="center">
            <span>麦克风</span>
          </Col>
          <Col span={20}>
            <Select
              style={{ width: 300 }}
              value={selectedDevice.microphone}
              onSelect={onSelectMicrophone}
            >
              {microphoneList.map(({ devId, devName }) => {
                return (
                  <Option key={devId} value={devId}>
                    {devName}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>

        <Row className="mb15">
          <Col span={4} className="center">
            <span>扬声器</span>
          </Col>
          <Col span={20}>
            <Select
              style={{ width: 300 }}
              value={selectedDevice.speaker}
              onSelect={onSelectSpeaker}
            >
              {speakerList.map(({ devId, devName }) => {
                return (
                  <Option  key={devId} value={devId}>
                    {devName}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default SettingModal;
