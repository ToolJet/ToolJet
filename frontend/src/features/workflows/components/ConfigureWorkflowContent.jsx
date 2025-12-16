import * as React from 'react';
import { useState } from 'react';
import { triggerTypes } from '../adapters/workflowData';
import { Play, Clock, Globe, Zap } from 'lucide-react';

const getTriggerIcon = (iconName) => {
  const iconMap = {
    Play: Play,
    Clock: Clock,
    Globe: Globe,
    Zap: Zap,
  };
  
  const IconComponent = iconMap[iconName] || Play;
  return <IconComponent className="tw-w-4 tw-h-4" />;
};

export function ConfigureWorkflowContent({ template, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'manual',
    description: '',
    enabled: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ ...formData, template: template?.id });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="tw-space-y-6">
      {/* Workflow Name */}
      <div>
        <label htmlFor="workflow-name" className="tw-block tw-text-sm tw-font-medium tw-text-text-default tw-mb-2">
          Workflow Name <span className="tw-text-red-500">*</span>
        </label>
        <input
          id="workflow-name"
          type="text"
          required
          placeholder="Enter workflow name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="tw-w-full tw-h-8 tw-px-3 tw-py-1.5 tw-text-xs tw-font-normal tw-text-text-default tw-bg-background-surface-layer-01 tw-border tw-border-border-default tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-accent focus:tw-border-accent"
        />
      </div>

      {/* Trigger Type */}
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-text-default tw-mb-3">
          Trigger Type <span className="tw-text-red-500">*</span>
        </label>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          {triggerTypes.map((trigger) => (
            <button
              key={trigger.id}
              type="button"
              onClick={() => handleChange('trigger', trigger.id)}
              className={`tw-flex tw-items-start tw-gap-3 tw-p-3 tw-border tw-rounded-md tw-transition-all tw-text-left ${
                formData.trigger === trigger.id
                  ? 'tw-border-border-accent-strong tw-bg-background-accent-subtle'
                  : 'tw-border-border-default tw-bg-white hover:tw-border-border-default-hover'
              }`}
            >
              <div
                className={`tw-shrink-0 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded ${
                  formData.trigger === trigger.id
                    ? 'tw-bg-background-accent tw-text-icon-accent'
                    : 'tw-bg-background-surface-layer-01 tw-text-icon-default'
                }`}
              >
                {getTriggerIcon(trigger.icon)}
              </div>
              <div className="tw-flex-1 tw-min-w-0">
                <div className="tw-text-xs tw-font-medium tw-text-text-default tw-mb-0.5">{trigger.name}</div>
                <div className="tw-text-xs tw-text-text-subtle tw-line-clamp-2">{trigger.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="workflow-description"
          className="tw-block tw-text-sm tw-font-medium tw-text-text-default tw-mb-2"
        >
          Description
        </label>
        <textarea
          id="workflow-description"
          placeholder="Enter workflow description (optional)"
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="tw-w-full tw-px-3 tw-py-2 tw-text-xs tw-font-normal tw-text-text-default tw-bg-background-surface-layer-01 tw-border tw-border-border-default tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-accent focus:tw-border-accent tw-resize-none"
        />
      </div>

      {/* Enable/Disable Toggle */}
      <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-background-surface-layer-01 tw-border tw-border-border-default tw-rounded-md">
        <div>
          <div className="tw-text-sm tw-font-medium tw-text-text-default tw-mb-1">Enable Workflow</div>
          <div className="tw-text-xs tw-text-text-subtle">Start with workflow enabled and ready to run</div>
        </div>
        <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="tw-sr-only tw-peer"
          />
          <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-2 peer-focus:tw-ring-accent tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-accent"></div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4 tw-border-t tw-border-border-default">
        <button
          type="submit"
          disabled={!formData.name.trim()}
          className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-accent tw-rounded-md hover:tw-bg-accent-hover disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors"
        >
          Create Workflow
        </button>
      </div>
    </form>
  );
}
