import React from "react";
import { Textarea } from "@/components/ui/TextArea/Textarea.jsx";
import Dropdown from "@/components/ui/Dropdown/Index.jsx";
import { Button } from "@/components/ui/Button/Button.jsx";

const AiBuilder = ({ onSubmit }) => {
  const [isValid, setIsValid] = React.useState(null);
  const [message, setMessage] = React.useState("");

  const handleChange = (e) => {
    setIsValid(!!e.target.value);
    setMessage(e.target.value);
  };

  const handleDropDownChange = (value) => {
    setIsValid(!!value);
    setMessage(value);
    onSubmit(value);
  };

  const handleSubmit = () => {
    setIsValid(true);
    onSubmit(message);
  };

  const options = {
    "Billing management system": {
      value:
        "Create a billing management system for a mid-sized SaaS company operating in Europe. The application should automate invoicing, track payments, and generate financial reports.",
    },
    "Supply chain management": {
      value:
        "Create a supply chain management system for a global electronics manufacturer. The application should optimize logistics, track shipments, and manage supplier contracts across multiple regions.",
    },
    "Mortgage management system": {
      value:
        "Create a mortgage management system for a large bank in the United States. The application should handle loan applications, automate payment tracking, and assess borrower risk.",
    },
    "HR employee portal": {
      value:
        "Create an HR employee portal for a mid-sized technology company with remote teams. The application should automate leave requests, manage employee records, and provide self-service access to benefits and company policies.",
    },
  };

  const prompts = [
    "Build an inventory management system for a manufacturing company",
    "Build a customer support ticketing system for SaaS startup",
    "Build a vendor onboarding portal for procurement department",
    "Build a compliance audit tracker for a finance company",
  ];
  const [promptIndex, setPromptIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tw-w-full tw-max-w-[640px] tw-relative ai-builder-chat-container">
      {/* Slot machine placeholder animation using pure CSS */}
      <div style={{ position: "relative" }}>
        <Textarea
          value={message}
          placeholder={""}
          width="100%"
          initialHeight="100px"
          onChange={handleChange}
          className="!tw-p-3 tw-scroll-pb-10 tw-resize-none"
        />
        {/* Only show the animated placeholder if textarea is empty */}
        {message === "" && (
          <div className="slot-placeholder-outer">
            <div
              className="slot-placeholder-inner"
              style={{ transform: `translateY(-${promptIndex * 16}px)` }}
            >
              {prompts.map((prompt, idx) => (
                <div
                  className={`slot-placeholder-line ${
                    idx === promptIndex ? "active" : ""
                  }`}
                  key={prompt}
                >
                  {prompt}
                  <kbd className="tw-ml-1 tw-text-[10px] tw-border-border-default tw-border-solid tw-text-text-placeholder tw-rounded-md tw-px-1 tw-h-4 tw-bg-page-weak tw-flex tw-items-center tw-justify-center tw-relative tw-font-normal">
                    <span className="tw-text-xl tw-leading-4 tw-relative -tw-top-[1px] tw-pr-0.5">
                      ⇥
                    </span>
                    Tab
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="ai-builder-footer">
        <div className="tw-relative tw-w-full tw-h-8 tw-flex tw-items-end tw-justify-end">
          <div
            className={`tw-flex tw-items-center tw-justify-end tw-absolute tw-w-full tw-transition-all tw-duration-300 tw-ease-in-out ${
              message
                ? "tw-opacity-100 tw-translate-y-0"
                : "tw-opacity-0 tw-translate-y-4"
            }`}
          >
            <Button
              variant="primary"
              leadingIcon="arrowreturn"
              iconOnly
              onClick={handleSubmit}
            />
          </div>
          <div
            className={`tw-flex tw-items-center tw-justify-end tw-absolute tw-w-full tw-transition-all tw-duration-300 tw-ease-in-out ${
              !message
                ? "tw-opacity-100 tw-translate-y-0"
                : "tw-opacity-0 tw-translate-y-4"
            }`}
          >
            <Dropdown
              options={options}
              placeholder="Example prompts"
              onChange={handleDropDownChange}
              className="example-prompts-dropdown"
            />
          </div>
        </div>
      </div>

      {/* <div className='tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-[100px] tw-bg-background-surface-layer-01 tw-rounded-b-[8px] tw-border-t-[1px] tw-border-solid tw-border-border-default'></div> */}
    </div>
  );
};

export default AiBuilder;
