import React from "react";
import { fetchEdition } from "@/modules/common/helpers/utils";
import { authenticationService } from "@/_services";

export default function withAdminOrBuilderOnly(Component) {
  return function WrappedComponent(props) {
    const edition = fetchEdition();
    const { admin, is_builder } =
      authenticationService.currentSessionValue || {};
    if (!admin && !is_builder) return null;
    if (edition === "ce") return null;
    return <Component {...props} edition={edition} />;
  };
}
