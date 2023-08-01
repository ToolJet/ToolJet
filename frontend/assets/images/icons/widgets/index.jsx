import React from 'react';

import BoundedBox from './boundedbox.jsx';
import Button from './button.jsx';
import ButtonGroup from './buttongroup.jsx';
import Calendar from './calendar.jsx';
import Chart from './chart.jsx';
import Checkbox from './checkbox.jsx';
import Circularprogressbar from './circularprogressbar.jsx';
import Codeeditor from './codeeditor.jsx';
import Colorpicker from './colorpicker.jsx';
import Container from './container.jsx';
import Customcomponent from './customcomponent.jsx';
import Datepicker from './datepicker.jsx';
import Daterangepicker from './daterangepicker.jsx';
import Divider from './divider.jsx';
import DividerHorizondal from './dividerhorizontal.jsx';
import Downstatistics from './downstatistics.jsx';
import Dropdown from './dropdown.jsx';
import Filepicker from './filepicker.jsx';
import Form from './form.jsx';
import Frame from './frame.jsx';
import Group from './group.jsx';
import Html from './html.jsx';
import Icon from './icon.jsx';
import Iframe from './iframe.jsx';
import Image from './image.jsx';
import Kanban from './kanban.jsx';
import Kanbanboard from './kanbanboard.jsx';
import Link from './link.jsx';
import Listview from './listview.jsx';
import Map from './map.jsx';
import Modal from './modal.jsx';
import Multiselect from './multiselect.jsx';
import Numberinput from './numberinput.jsx';
import Pagination from './pagination.jsx';
import Passwordinput from './passwordinput.jsx';
import Pdf from './pdf.jsx';
import Qrscanner from './qrscanner.jsx';
import RadioButton from './radio-button.jsx';
import RangePicker from './rangepicker.jsx';
import Rangeslider from './rangeslider.jsx';
import Rating from './rating.jsx';
import Richtexteditor from './richtexteditor.jsx';
import Spinner from './spinner.jsx';
import Starrating from './starrating.jsx';
import Statistics from './statistics.jsx';
import Steps from './steps.jsx';
import Svgimage from './svgimage.jsx';
import Table from './table.jsx';
import Tabs from './tabs.jsx';
import Tags from './tags.jsx';
import Text from './text.jsx';
import TextArea from './textarea.jsx';
import Texteditor from './texteditor.jsx';
import Textinput from './textinput.jsx';
import Timeline from './timeline.jsx';
import Timer from './timer.jsx';
import Toggleswitch from './toggleswitch.jsx';
import Treeselect from './treeselect.jsx';
import Upstatistics from './upstatistics.jsx';
import Verticaldivider from './verticaldivider.jsx';

const WidgetIcon = (props) => {
  console.log('props', props);
  switch (props.name) {
    case 'boundedbox':
      return <BoundedBox {...props} />;
    case 'button':
      return <Button {...props} />;
    case 'buttongroup':
      return <ButtonGroup {...props} />;
    case 'calendar':
      return <Calendar {...props} />;
    case 'chart':
      return <Chart {...props} />;
    case 'checkbox':
      return <Checkbox {...props} />;
    case 'circularprogressbar':
      return <Circularprogressbar {...props} />;
    case 'codeeditor':
      return <Codeeditor {...props} />;
    case 'colorpicker':
      return <Colorpicker {...props} />;
    case 'container':
      return <Container {...props} />;
    case 'customcomponent':
      return <Customcomponent {...props} />;
    case 'datepicker':
      return <Datepicker {...props} />;
    case 'daterangepicker':
      return <Daterangepicker {...props} />;
    case 'divider':
      return <Divider {...props} />;
    case 'divider-horizondal':
      return <DividerHorizondal {...props} />;
    case 'downstatistics':
      return <Downstatistics {...props} />;
    case 'dropdown':
      return <Dropdown {...props} />;
    case 'filepicker':
      return <Filepicker {...props} />;
    case 'form':
      return <Form {...props} />;
    case 'frame':
      return <Frame {...props} />;
    case 'group':
      return <Group {...props} />;
    case 'html':
      return <Html {...props} />;
    case 'icon':
      return <Icon {...props} />;
    case 'iframe':
      return <Iframe {...props} />;
    case 'image':
      return <Image {...props} />;
    case 'kanban':
      return <Kanban {...props} />;
    case 'kanbanboard':
      return <Kanbanboard {...props} />;
    case 'link':
      return <Link {...props} />;
    case 'listview':
      return <Listview {...props} />;
    case 'map':
      return <Map {...props} />;
    case 'modal':
      return <Modal {...props} />;
    case 'multiselect':
      return <Multiselect {...props} />;
    case 'numberinput':
      return <Numberinput {...props} />;
    case 'pagination':
      return <Pagination {...props} />;
    case 'passwordinput':
      return <Passwordinput {...props} />;
    case 'pdf':
      return <Pdf {...props} />;
    case 'qrscanner':
      return <Qrscanner {...props} />;
    case 'radio-button':
      return <RadioButton {...props} />;
    case 'rangeslider':
      return <Rangeslider {...props} />;
    case 'rating':
      return <Rating {...props} />;
    case 'richtexteditor':
      return <Texteditor {...props} />;
    case 'spinner':
      return <Spinner {...props} />;
    case 'starrating':
      return <Rating {...props} />;
    case 'statistics':
      return <Statistics {...props} />;
    case 'steps':
      return <Steps {...props} />;
    case 'svgimage':
      return <Svgimage {...props} />;
    case 'table':
      return <Table {...props} />;
    case 'tabs':
      return <Tabs {...props} />;
    case 'tags':
      return <Tags {...props} />;
    case 'text':
      return <Text {...props} />;
    case 'textarea':
      return <TextArea {...props} />;
    // case 'texteditor':
    //   return <Texteditor {...props} />;
    case 'textinput':
      return <Textinput {...props} />;
    case 'timeline':
      return <Timeline {...props} />;
    case 'timer':
      return <Timer {...props} />;
    case 'toggleswitch':
      return <Toggleswitch {...props} />;
    case 'treeselect':
      return <Treeselect {...props} />;
    case 'upstatistics':
      return <Upstatistics {...props} />;
    case 'verticaldivider':
      return <Verticaldivider {...props} />;

    default:
      return <BoundedBox {...props} />;
  }
};
export default WidgetIcon;
