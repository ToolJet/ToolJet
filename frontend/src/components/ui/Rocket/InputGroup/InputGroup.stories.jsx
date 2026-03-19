import React from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupSelect,
  InputGroupText,
  InputGroupButton,
} from './InputGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../Select/Select';
import { Search, Mail, Eye, ChevronDown, Copy, Globe, Phone } from 'lucide-react';

export default {
  title: 'Rocket/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── With Leading Icon ─────────────────────────────────────────────────────
export const WithLeadingIcon = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <Search size={14} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Trailing Icon ────────────────────────────────────────────────────
export const WithTrailingIcon = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <InputGroup>
        <InputGroupInput type="email" placeholder="you@example.com" />
        <InputGroupAddon align="inline-end">
          <Mail size={14} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Addon Text ───────────────────────────────────────────────────────
export const WithAddonText = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Button ───────────────────────────────────────────────────────────
export const WithButton = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <InputGroup>
        <InputGroupInput type="password" placeholder="Password" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Toggle visibility">
            <Eye size={14} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Dropdown ─────────────────────────────────────────────────────────
export const WithDropdown = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <Select defaultValue="usd">
            <InputGroupSelect>
              <SelectValue />
            </InputGroupSelect>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
              <SelectItem value="inr">INR</SelectItem>
            </SelectContent>
          </Select>
        </InputGroupAddon>
        <InputGroupInput type="number" placeholder="0.00" />
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Select (leading) ─────────────────────────────────────────────────
export const WithLeadingSelect = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <Select defaultValue="usd">
            <InputGroupSelect>
              <SelectValue />
            </InputGroupSelect>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
              <SelectItem value="inr">INR</SelectItem>
            </SelectContent>
          </Select>
        </InputGroupAddon>
        <InputGroupInput type="number" placeholder="0.00" />
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Select (trailing) ────────────────────────────────────────────────
export const WithTrailingSelect = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <InputGroup>
        <InputGroupInput placeholder="Enter amount" />
        <InputGroupAddon align="inline-end">
          <Select defaultValue="usd">
            <InputGroupSelect>
              <SelectValue />
            </InputGroupSelect>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
            </SelectContent>
          </Select>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Phone Input (country code select + input) ─────────────────────────────
export const PhoneInput = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <Select defaultValue="+1">
            <InputGroupSelect>
              <SelectValue />
            </InputGroupSelect>
            <SelectContent>
              <SelectItem value="+1">+1</SelectItem>
              <SelectItem value="+44">+44</SelectItem>
              <SelectItem value="+91">+91</SelectItem>
              <SelectItem value="+49">+49</SelectItem>
            </SelectContent>
          </Select>
        </InputGroupAddon>
        <InputGroupInput type="tel" placeholder="(555) 123-4567" />
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── All Variations ────────────────────────────────────────────────────────
export const AllVariations = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-4 tw-p-4">
      <InputGroup>
        <InputGroupAddon>
          <Search size={14} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Leading icon" />
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder="Trailing icon" />
        <InputGroupAddon align="inline-end">
          <Copy size={14} />
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput type="number" placeholder="Amount" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.00</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder="With error" aria-invalid="true" />
        <InputGroupAddon align="inline-end">
          <Mail size={14} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};
