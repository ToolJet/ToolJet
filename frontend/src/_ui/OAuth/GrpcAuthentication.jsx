import React from 'react';
import Input from '@/_ui/Input';

const GrpcAuthentication = ({
  auth_type,
  username,
  grpc_apiKey_key,
  grpc_apiKey_value,
  bearer_token,
  password,
  optionchanged,
}) => {
  if (auth_type === 'api_key') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">KEY</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('grpc_apikey_key', e.target.value)}
            value={grpc_apiKey_key}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Value</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('grpc_apikey_value', e.target.value)}
            value={grpc_apiKey_value}
          />
        </div>
      </div>
    );
  } else if (auth_type === 'basic') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Username</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('username', e.target.value)}
            value={username}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">
            Password
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('password', e.target.value)}
            value={password}
          />
        </div>
      </div>
    );
  } else if (auth_type === 'bearer') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">
            Token
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('bearer_token', e.target.value)}
            value={bearer_token}
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default GrpcAuthentication;
