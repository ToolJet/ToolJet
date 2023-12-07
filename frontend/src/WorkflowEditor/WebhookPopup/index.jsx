import React, { useState } from 'react';
import { CustomToggleSwitch } from '@/Editor/QueryManager/Components/CustomToggleSwitch';
import { workflowExecutionsService } from '@/_services';
import Cancel from '../LeftSidebar/icons/cancel.svg';
import './styles.scss';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EndPoint from '../LeftSidebar/icons/endpoint.svg';
import EndPointBlock from './EndPointBlock';
import Environment from './Environment';
import Parameter from './Parameter';
import TokenApi from './TokenApi';
import { toast } from 'react-hot-toast';
import { getServerUrl } from '../utils';

function WebhookPopup(props) {
  const [showPopover, setShowPopover] = useState(false);
  const { isOpen, editorSessionActions, editorSession } = props;

  const value = editorSession.webhookEnable.value;

  const toggleSwitchFunction = (val) => {
    const workflowId = editorSession.app.id;
    workflowExecutionsService.enableWebhook(workflowId, val).then((data) => {
      if (data.statusCode === 200) {
        editorSessionActions.toggleWebhookEnable(val);
      } else {
        editorSessionActions.toggleWebhookEnable(false);
        toast.error('workflow id is not correct');
      }
    });
  };

  const closePopover = () => {
    setShowPopover(false);
  };

  const openPopover = () => {
    setShowPopover(true);
  };

  const serverUrl = getServerUrl();
  const Url = `${serverUrl}/v2/webhooks/workflows/${editorSession?.app?.id}/trigger?environment=${editorSession?.currentWebhookEnvironment}`;

  return (
    <>
      {isOpen && (
        <OverlayTrigger
          trigger="manual"
          show={showPopover}
          key="right"
          placement="right"
          overlay={
            <Popover className="webhook-popover" id={`popover-positioned-right`}>
              <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <div className="d-flex align-items-center justify-content-start">
                  <CustomToggleSwitch
                    isChecked={value}
                    toggleSwitchFunction={toggleSwitchFunction}
                    action={'endPointTrigger'}
                    //darkMode={props.darkMode}
                  />
                  <p className="webhook-header mb-0">Webhook</p>
                </div>
                <Cancel className="cursor-pointer" onClick={closePopover} />
              </div>
              <Popover.Body>
                <Environment editorSession={editorSession} editorSessionActions={editorSessionActions} />
                <EndPointBlock Url={Url} editorSession={editorSession} editorSessionActions={editorSessionActions} />
                {editorSession.webhookEnable.value && <TokenApi editorSession={editorSession} />}
                <Parameter editorSessionActions={editorSessionActions} editorSession={editorSession} />
              </Popover.Body>
            </Popover>
          }
        >
          <div className="dropdown-content p-2" onClick={openPopover}>
            <div className="bg-gray p-2 rounded d-flex align-items-center justify-content-between">
              <div className="end-point">
                <EndPoint />
              </div>
              <div className="btn-endpoint-url">{Url}</div>
              <div className="webhook-toggle">
                <CustomToggleSwitch
                  isChecked={value}
                  toggleSwitchFunction={toggleSwitchFunction}
                  action={'endPointTrigger'}
                  //darkMode={props.darkMode}
                />
              </div>
            </div>
          </div>
        </OverlayTrigger>
      )}
    </>
  );
}

export default WebhookPopup;
