import React from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
} from './Combobox';
import { Field, FieldLabel, FieldDescription, FieldError } from '../Field/Field';

const frameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Qwik'];

const languages = ['JavaScript', 'TypeScript', 'Python', 'Go'];

const databases = ['PostgreSQL', 'MySQL', 'MongoDB'];

const countriesByRegion = {
  Americas: ['United States', 'Canada', 'Brazil'],
  Europe: ['United Kingdom', 'Germany', 'France'],
};

export default {
  title: 'Rocket/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Search framework..." />
        <ComboboxContent>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      {['large', 'default', 'small'].map((size) => (
        <div key={size}>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block tw-capitalize">
            {size}
          </span>
          <Combobox items={frameworks.slice(0, 3)}>
            <ComboboxInput size={size} placeholder={`${size} size`} />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>No results found.</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── States ────────────────────────────────────────────────────────────────
export const States = {
  render: () => {
    const items = ['Option A', 'Option B', 'Option C'];
    return (
      <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Default</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="Search..." />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">With clear</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="Search..." showClear />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Disabled</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="Disabled" disabled />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Read only</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="Read only" readOnly />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Loading</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="Loading..." loading />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Error</span>
          <Combobox items={items}>
            <ComboboxInput placeholder="With error" aria-invalid="true" />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    );
  },
  parameters: { layout: 'padded' },
};

// ── With Groups ───────────────────────────────────────────────────────────
export const WithGroups = {
  render: () => {
    const allCountries = Object.values(countriesByRegion).flat();
    return (
      <div className="tw-w-72 tw-p-4">
        <Combobox items={allCountries}>
          <ComboboxInput placeholder="Search country..." />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No countries found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    );
  },
  parameters: { layout: 'padded' },
};

// ── With Field ────────────────────────────────────────────────────────────
export const WithField = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Search frameworks..." />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </Field>

      <Field>
        <FieldLabel>Language</FieldLabel>
        <Combobox items={languages}>
          <ComboboxInput placeholder="Search languages..." />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Choose your primary language.</FieldDescription>
      </Field>

      <Field data-invalid="true">
        <FieldLabel>Database</FieldLabel>
        <Combobox items={databases}>
          <ComboboxInput placeholder="Select database..." aria-invalid="true" />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        <FieldError>Database is required.</FieldError>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Empty State ──────────────────────────────────────────────────────────
export const EmptyState = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Combobox items={[]} open>
        <ComboboxInput placeholder="Search framework..." />
        <ComboboxContent>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── All States ────────────────────────────────────────────────────────────
export const AllStates = {
  render: () => {
    const items = ['Option A', 'Option B'];
    return (
      <div className="tw-w-80 tw-flex tw-flex-col tw-gap-4 tw-p-4">
        {[
          { label: 'Default', props: {} },
          { label: 'Disabled', props: { disabled: true } },
          { label: 'Read only', props: { readOnly: true } },
          { label: 'Loading', props: { loading: true } },
          { label: 'Error', props: { 'aria-invalid': 'true' } },
        ].map(({ label, props }) => (
          <div key={label} className="tw-flex tw-items-center tw-gap-3">
            <span className="tw-w-20 tw-text-sm tw-text-text-medium">{label}</span>
            <Combobox items={items}>
              <ComboboxInput placeholder="Placeholder" {...props} />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        ))}
      </div>
    );
  },
  parameters: { layout: 'padded' },
};
