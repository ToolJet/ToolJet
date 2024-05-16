import * as React from "react";
import { Switch } from "./switch";

// Storybook configuration
export default {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    label: {
        control: "text",
    },
    required: {
      control: "boolean",
    },
  },
};

export const RocketSwitch = {};

export const RocketSwitchWithLabel = {};

export const RocketSwitchWithLabelAndHelper = {};