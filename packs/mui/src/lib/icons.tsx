import React from 'react';
import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import AttachMoney from '@mui/icons-material/AttachMoney';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import Edit from '@mui/icons-material/Edit';
import FilterList from '@mui/icons-material/FilterList';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Link from '@mui/icons-material/Link';
import Lock from '@mui/icons-material/Lock';
import Mail from '@mui/icons-material/Mail';
import MoreVert from '@mui/icons-material/MoreVert';
import Person from '@mui/icons-material/Person';
import Phone from '@mui/icons-material/Phone';
import Refresh from '@mui/icons-material/Refresh';
import Save from '@mui/icons-material/Save';
import Search from '@mui/icons-material/Search';
import Send from '@mui/icons-material/Send';
import Settings from '@mui/icons-material/Settings';
import TrendingDown from '@mui/icons-material/TrendingDown';
import TrendingFlat from '@mui/icons-material/TrendingFlat';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Upload from '@mui/icons-material/Upload';

// The @mui/icons-material icons a prop may name, by their MUI names (the whole set is thousands of modules); an
// unknown name stays text where text fits, and is dropped where only an icon fits.
export const ICONS: Record<string, React.ComponentType<{ fontSize?: 'inherit' | 'small' | 'medium' | 'large' }>> = {
  Add,
  ArrowBack,
  ArrowForward,
  AttachMoney,
  CalendarMonth,
  Check,
  Close,
  Delete,
  Download,
  Edit,
  FilterList,
  KeyboardArrowDown,
  Link,
  Lock,
  Mail,
  MoreVert,
  Person,
  Phone,
  Refresh,
  Save,
  Search,
  Send,
  Settings,
  TrendingDown,
  TrendingFlat,
  TrendingUp,
  Upload,
};
export const ICON_NAMES = Object.keys(ICONS);

/** The named icon, or undefined. */
export const iconOf = (name: unknown, fontSize?: 'inherit' | 'small' | 'medium' | 'large'): React.ReactNode => {
  const Icon = ICONS[String(name ?? '').trim()];
  return Icon ? <Icon fontSize={fontSize} /> : undefined;
};

/** The named icon, else the text itself (an InputAdornment's content). */
export const iconOrText = (value: string): React.ReactNode => iconOf(value, 'small') ?? (value || undefined);
