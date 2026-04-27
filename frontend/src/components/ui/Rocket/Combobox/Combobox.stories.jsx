import React from 'react';
import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
} from './Combobox';
import { Field, FieldLabel, FieldDescription, FieldError } from '../Field/Field';
import { TruncatingText } from '../TruncatingText/TruncatingText';
import { ChevronDown } from 'lucide-react';

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
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block tw-capitalize">{size}</span>
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
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Combobox>
        <ComboboxInput placeholder="Search country..." />
        <ComboboxContent>
          <ComboboxList>
            {Object.entries(countriesByRegion).map(([region, countries], i) => (
              <React.Fragment key={region}>
                {i > 0 && <ComboboxSeparator />}
                <ComboboxGroup>
                  <ComboboxLabel>{region}</ComboboxLabel>
                  {countries.map((country) => (
                    <ComboboxItem key={country} value={country}>
                      {country}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              </React.Fragment>
            ))}
          </ComboboxList>
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Clear ───────────────────────────────────────────────────────────
export const WithClear = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Search framework..." showClear />
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

// ── Custom Trigger ───────────────────────────────────────────────────────
// Button-style trigger (e.g. workspace selector) instead of the default input.
export const CustomTrigger = {
  render: () => {
    const workspaces = [
      { label: 'ABC cargo main team', value: 'abc-cargo-main-team' },
      { label: 'Design system', value: 'design-system' },
      { label: 'Backend API', value: 'backend-api' },
    ];

    return (
      <div className="tw-w-72 tw-p-4">
        <Combobox value={workspaces[0]} items={workspaces}>
          <ComboboxTrigger
            render={
              <button
                className={cn(
                  'tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1.5',
                  'tw-font-title-default tw-text-text-default tw-max-w-48',
                  'tw-rounded-md tw-border-0 tw-bg-transparent',
                  'hover:tw-bg-interactive-default',
                  'data-[pressed]:tw-bg-interactive-selected',
                  'data-[popup-open]:tw-bg-interactive-selected'
                )}
              >
                <ComboboxValue>
                  {(value) => <span className="tw-flex-1 tw-truncate">{value?.label ?? ''}</span>}
                </ComboboxValue>
                <ChevronDown className="tw-size-4 tw-text-icon-default tw-shrink-0" />
              </button>
            }
          />

          <ComboboxContent anchor={false} align="start" className="tw-flex tw-flex-col tw-gap-2">
            <ComboboxInput showTrigger={false} placeholder="Search workspace..." />
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No workspaces found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    );
  },
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

// ── Long Option Names — opt-in TruncatingText pattern ────────────────────
//
// Documents the "Truncating long values" pattern from Combobox.spec.md.
//
// Each row's label is wrapped in TruncatingText. When the row label
// overflows the dropdown width, TruncatingText sets the native `title`
// attribute and the OS tooltip appears on hover after ~500ms. Short rows
// show no tooltip.
//
// The selected-value-in-input case is intentionally not covered here —
// inputs scroll horizontally instead of clipping with ellipsis, so they
// need a different mechanism (tracked separately).

const longQueries = [
  'getProducts',
  'getProductsByCategory',
  'getProductsThatIsReallyLongToFitInaDropdownAndWillDefinitelyOverflow',
  'getOrders',
  'updateUserShippingAddressForCheckoutFlowWithLongName',
];

export const LongOptionNames = {
  render: () => (
    <div className="tw-w-[240px] tw-p-4">
      <Combobox items={longQueries}>
        <ComboboxInput placeholder="Search query..." />
        <ComboboxContent>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                <TruncatingText>{item}</TruncatingText>
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

// ── Bounded inside a host (consumer-side pattern) ────────────────────────
//
// Pattern for narrow hosts (e.g. an inspector panel) where:
//   - the trigger is smaller than the host
//   - the trigger is right-aligned within the host
//   - the dropdown should grow to fit long row labels but stay inside the host
//
// No Rocket changes needed — just three things at the consumer site:
//   1. `align="end"` on ComboboxContent — anchors the popover's right edge to
//      the trigger's right edge, so it grows leftward as it expands.
//   2. `!tw-w-max` — overrides shadcn's default `w-[var(--anchor-width)]` so
//      the popover sizes to its longest row instead of matching trigger width.
//      (`tw-w-max` is the Tailwind utility for `width: max-content`.)
//   3. `!tw-max-w-[<inner-width>px]` — caps the popover at the host's INNER
//      content width (outer width minus padding), so the popover's left edge
//      stops at the same boundary as the trigger area.
//
// The `!` (Tailwind important prefix) is needed because shadcn already sets
// `tw-w-[var(--anchor-width)]` and `tw-max-w-[var(--available-width)]` on the
// Popup element with normal specificity — overriding those requires `!`.
//
// Mirrors the Inspector panel layout: 300px outer host with 12px padding, so
// inner usable width is 276px. The 160px trigger is right-aligned within the
// 276px inner area. Cap is 276px so the popover, growing leftward via
// `align="end"`, never extends past the inner left edge.

export const BoundedInHost = {
  render: () => (
    <div className="tw-w-[300px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
      <div className="tw-mb-2 tw-text-xs tw-text-text-placeholder">
        300px outer • 12px padding • 276px inner • 160px right-aligned trigger
      </div>
      <div className="tw-flex tw-h-8 tw-items-center tw-justify-between">
        <span className="tw-text-sm tw-text-text-default">Query</span>
        <div className="tw-w-[160px]">
          <Combobox items={longQueries}>
            <ComboboxInput placeholder="Pick query..." />
            <ComboboxContent align="end" className="!tw-w-max !tw-max-w-[276px]">
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>No results.</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};
