// shadcn/ui pack (experiment): registry of the generated shadcn widget configs.
import { shadAccordionConfig } from './shadAccordion';
import { shadAlertConfig } from './shadAlert';
import { shadAreaChartConfig } from './shadAreaChart';
import { shadAvatarConfig } from './shadAvatar';
import { shadBadgeConfig } from './shadBadge';
import { shadBarChartConfig } from './shadBarChart';
import { shadBreadcrumbConfig } from './shadBreadcrumb';
import { shadButtonConfig } from './shadButton';
import { shadCheckboxConfig } from './shadCheckbox';
import { shadDatePickerConfig } from './shadDatePicker';
import { shadEmptyConfig } from './shadEmpty';
import { shadHeadingConfig } from './shadHeading';
import { shadInputConfig } from './shadInput';
import { shadKanbanConfig } from './shadKanban';
import { shadPieChartConfig } from './shadPieChart';
import { shadProgressConfig } from './shadProgress';
import { shadRadioGroupConfig } from './shadRadioGroup';
import { shadSelectConfig } from './shadSelect';
import { shadSeparatorConfig } from './shadSeparator';
import { shadSkeletonConfig } from './shadSkeleton';
import { shadSliderConfig } from './shadSlider';
import { shadStatConfig } from './shadStat';
import { shadSwitchConfig } from './shadSwitch';
import { shadTextConfig } from './shadText';
import { shadTextareaConfig } from './shadTextarea';
import { shadToggleGroupConfig } from './shadToggleGroup';
import { shadListViewConfig } from './shadListView';
import { shadTabsConfig } from './shadTabs';
import { shadTableConfig } from './shadTable';

export const shadcnConfigs = [
  shadAccordionConfig,
  shadAlertConfig,
  shadAreaChartConfig,
  shadAvatarConfig,
  shadBadgeConfig,
  shadBarChartConfig,
  shadBreadcrumbConfig,
  shadButtonConfig,
  shadCheckboxConfig,
  shadDatePickerConfig,
  shadEmptyConfig,
  shadHeadingConfig,
  shadInputConfig,
  shadKanbanConfig,
  shadPieChartConfig,
  shadProgressConfig,
  shadRadioGroupConfig,
  shadSelectConfig,
  shadSeparatorConfig,
  shadSkeletonConfig,
  shadSliderConfig,
  shadStatConfig,
  shadSwitchConfig,
  shadTextConfig,
  shadTextareaConfig,
  shadToggleGroupConfig,
  shadListViewConfig,
  shadTabsConfig,
  shadTableConfig,
];
export const SHADCN_COMPONENTS = shadcnConfigs.map((c) => c.name);
