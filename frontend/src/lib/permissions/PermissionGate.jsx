import React from "react";

export function PermissionGate({ allowed, fallback = null, children }) {
  return allowed ? children : fallback;
}

export default PermissionGate;
