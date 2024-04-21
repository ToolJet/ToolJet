import React, { useState, useEffect } from 'react';
import { QRCode, Space, theme, ConfigProvider, Popover } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
import zhCN from 'antd/locale/zh_CN';


export const QrCode = function QrCode({
  id,
  height,
  width,
  properties,
  styles,
  setExposedVariable,
  registerAction,
  fireEvent,
  darkMode,
}) {

  const [value, setValue] = useState(properties.value);
  const [qrType, setQRType] = useState(properties.qrType);
  const [img, setImg] = useState();
  const [status, setStatus] = useState();
  const { qrBackgroundColor, qrColor, level, popQR } = properties;
  const { visibility } = styles;

  const widgetVisibility = visibility ?? true;

  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
  }, [properties.value]);

  useEffect(() => {
    setImg(properties.img);
  }, [properties.img]);

  useEffect(() => {
    setQRType(properties.qrType);
  }, [properties.qrType]);

  useEffect(() => {
    setStatus(properties.status);
    setExposedVariable('status', properties.status);
  }, [properties.status]);

  registerAction(
    'setText',
    async function (text) {
      setValue(text);
      setStatus('active');
      setExposedVariable('value', text);
      setExposedVariable('status', 'active');

    },
    [setValue]
  );

  registerAction(
    'download',
    async function (filename) {
      debugger
      const canvas = document.getElementById(id)?.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL();
        const a = document.createElement('a');
        a.download = `二维码${filename}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    []
  );

  registerAction(
    'setStatus',
    async function (status) {
      if (!['active', 'loading', 'expired'].includes(status)) {
        status = 'active'
      } else {
        console.log('二维码组件状态只能是active|loading|expired');
      }
      setStatus(status);
      setExposedVariable('status', status);

    },
    [setStatus]
  );

  const onRefresh = () => {
    fireEvent('onClick')
  }

  const darkTheme = {
    algorithm: [darkAlgorithm, compactAlgorithm],
  };

  return (
    <div id={id}>
      <ConfigProvider
        locale={zhCN}
        theme={darkMode ? darkTheme : {
          token: {
          }
        }}
      >
        <Space direction="vertical" align="center">
          {popQR ?
            (
              <Popover
                overlayInnerStyle={{
                  padding: 0,
                }}
                trigger={['hover', 'click']}
                content={<QRCode
                  value={value || '-'}
                  status={status}
                  onRefresh={onRefresh}
                  color={qrColor}
                  bgColor={qrBackgroundColor}
                  errorLevel={level}
                  type={qrType}
                  size={height > width ? width - 5 : height}
                  iconSize={height > width ? width / 4 : height / 4}
                  style={{
                    display: widgetVisibility ? '' : 'none',
                  }}
                />}
              >
                <img width={height > width ? width - 5 : height} height={height > width ? width - 5 : height} src={img} alt="icon" />
              </Popover>
            ) :
            (
              <QRCode
                value={value || '-'}
                icon={img}
                status={status}
                onRefresh={onRefresh}
                color={qrColor}
                bgColor={qrBackgroundColor}
                errorLevel={level}
                type={qrType}
                size={height > width ? width - 5 : height}
                iconSize={height > width ? width / 4 : height / 4}
                style={{
                  display: widgetVisibility ? '' : 'none',
                }}
              />
            )}

        </Space>
      </ConfigProvider>
    </div>
  );
};
