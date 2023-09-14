import React from 'react';
import Apps from './Apps.jsx';
import Archive from './Archive.jsx';
import ArrowBack from './ArrowBack.jsx';
import ArrowDown from './ArrowDown.jsx';
import Arroweft from './Arroweft.jsx';
import ArrowReturn from './ArrowReturn.jsx';
import ArrowRight from './ArrowRight.jsx';
import ArrowSort from './ArrowSort.jsx';
import ArrowSortRectangle from './ArrowSortRectangle.jsx';
import ArrowTransfer from './ArrowTransfer.jsx';
import ArrowUp from './ArrowUp.jsx';
import BookSearch from './BookSearch.jsx';
import Branch from './Branch.jsx';
import Debugger from './Debugger.jsx';
import Calender from './Calender.jsx';
import CheckRectangle from './CheckRectangle.jsx';
import CheveronDown from './CheveronDown.jsx';
import CheveronLeft from './CheveronLeft.jsx';
import CheveronRight from './CheveronRight.jsx';
import CheveronUp from './CheveronUp.jsx';
import ClearRectangle from './ClearRectangle.jsx';
import Clock from './Clock.jsx';
import Column from './Column.jsx';
import Columns from './Columns.jsx';
import Compass from './Compass.jsx';
import Computer from './Computer.jsx';
import Copy from './Copy.jsx';
import DarkMode from './DarkMode.jsx';
import Datasource from './Datasource.jsx';
import Diamond from './Diamond.jsx';
import DownArrow from './DownArrow.jsx';
import EditRectangle from './EditRectangle.jsx';
import Enterprise from './Enterprise.jsx';
import Eye from './Eye.jsx';
import Eye1 from './Eye1.jsx';
import EyeDisable from './EyeDisable.jsx';
import File01 from './File01.jsx';
import FileDownload from './FileDownload.jsx';
import FileUpload from './FileUpload.jsx';
import Filter from './Filter.jsx';
import FloppyDisk from './FloppyDisk.jsx';
import Folder from './Folder.jsx';
import FolderDownload from './FolderDownload.jsx';
import FolderUpload from './FolderUpload.jsx';
import Globe from './Globe.jsx';
import Grid from './Grid.jsx';
import HelpPolygon from './HelpPolygon.jsx';
import Home from './Home.jsx';
import Information from './Information.jsx';
import InformationCircle from './InformationCircle.jsx';
import InRectangle from './InRectangle.jsx';
import Interactive from './Interactive.jsx';
import Layers from './Layers.jsx';
import LeftArrow from './LeftArrow.jsx';
import LightMode from './LightMode.jsx';
import ListView from './ListView.jsx';
import Logout from './Logout.jsx';
import Menu from './Menu.jsx';
import MenuHome from './MenuHome.jsx';
import Minus from './Minus.jsx';
import Minus01 from './Minus01.jsx';
import Mobile from './Mobile.jsx';
import MoreHorizontal from './MoreHorizontal.jsx';
import MoreVertical from './MoreVertical.jsx';
import Notification from './Notification.jsx';
import NotificationRinging from './NotificationRinging.jsx';
import NotificationSide from './NotificationSide.jsx';
import NotificationSilent from './NotificationSilent.jsx';
import NotificationUnread from './NotificationUnread.jsx';
import Page from './Page.jsx';
import PageAdd from './PageAdd.jsx';
import Pin from './Pin.jsx';
import Unpin from './Unpin.jsx';
import AlignRight from './AlignRight';
import Play from './Play.jsx';
import Plus from './Plus.jsx';
import Plus01 from './Plus01.jsx';
import Reload from './Reload.jsx';
import Remove from './Remove.jsx';
import Remove01 from './Remove01.jsx';
import RemoveRectangle from './RemoveRectangle.jsx';
import RightArrow from './RightArrow.jsx';
import Row from './Row.jsx';
import SadRectangle from './SadRectangle.jsx';
import Search from './Search.jsx';
import SearchMinus from './SearchMinus.jsx';
import SearchPlus from './SearchPlus.jsx';
import Sent from './Sent.jsx';
import SentFast from './SentFast.jsx';
import Server from './Server.jsx';
import Settings from './Settings.jsx';
import Share from './Share.jsx';
import Shield from './Shield.jsx';
import ShieldCheck from './ShieldCheck.jsx';
import Signpost from './Signpost.jsx';
import SmileRectangle from './SmileRectangle.jsx';
import SortArrowDown from './SortArrowDown.jsx';
import SortArrowUp from './SortArrowUp.jsx';
import Subtract from './Subtract.jsx';
import Sun from './Sun.jsx';
import Table from './Table.jsx';
import Tick from './Tick.jsx';
import Trash from './Trash.jsx';
import UpArrow from './UpArrow.jsx';
import User from './User.jsx';
import UserAdd from './UserAdd.jsx';
import UserGroup from './UserGroup.jsx';
import UserRemove from './UserRemove.jsx';
import UTurn from './UTurn.jsx';
import Variable from './Variable.jsx';
import Workflows from './Workflows.jsx';
import Warning from './Warning.jsx';
import ZoomIn from './ZoomIn.jsx';
import ZoomOut from './ZoomOut.jsx';
import ZoomOutRectangle from './ZoomOutRectangle.jsx';
import AddRectangle from './AddRectangle.jsx';
import Lock from './Lock.jsx';
import Mail from './Mail.jsx';
import Logs from './Logs.jsx';
import Marketplace from './Marketplace.jsx';
import AuditLogs from './AuditLog.jsx';
import InstanceSettings from './InstanceSettings.jsx';
import EnterpriseGradient from './EnterpriseGradient.jsx';
import Workspace from './Workspace.jsx';
import CircularToggleDisabled from './CircularToggleDisabled.jsx';
import CircularToggleEnabled from './CircularToggleEnabled.jsx';
import Idea from './Idea.jsx';
import Minimize from './Minimize.jsx';
import Maximize from './Maximize.jsx';
import PlusRectangle from './PlusRectangle.jsx';
import EyeOpen from './EyeOpen.jsx';
import CloudInvalid from './CloudInvalid.jsx';
import CloudValid from './CloudValid.jsx';
import LayersVersion from './LayersVersion.jsx';
import Comments from './Comments';
import Inspect from './Inspect.jsx';
import ArrowForwardUp from './ArrowForwardUp.jsx';
import ArrowBackUp from './ArrowBackUp.jsx';
import CheveronLeftDouble from './CheveronLeftDouble.jsx';
import CheveronRightDouble from './CheveronRightDouble.jsx';
import Dot from './Dot.jsx';
import Check from './Check.jsx';
import Editable from './Editable.jsx';
import Save from './Save.jsx';
import Cross from './Cross.jsx';

const Icon = (props) => {
  switch (props.name) {
    case 'addrectangle':
      return <AddRectangle {...props} />;
    case 'alignright':
      return <AlignRight {...props} />;
    case 'apps':
      return <Apps {...props} />;
    case 'archive':
      return <Archive {...props} />;
    case 'arrowback':
      return <ArrowBack {...props} />;
    case 'arrowdown':
      return <ArrowDown {...props} />;
    case 'arroweft':
      return <Arroweft {...props} />;
    case 'arrowreturn':
      return <ArrowReturn {...props} />;
    case 'arrowright':
      return <ArrowRight {...props} />;
    case 'arrowsort':
      return <ArrowSort {...props} />;
    case 'arrowsortrectangle':
      return <ArrowSortRectangle {...props} />;
    case 'arrowtransfer':
      return <ArrowTransfer {...props} />;
    case 'arrowup':
      return <ArrowUp {...props} />;
    case 'auditlogs':
      return <AuditLogs {...props} />;
    case 'booksearch':
      return <BookSearch {...props} />;
    case 'branch':
      return <Branch {...props} />;
    case 'debugger':
      return <Debugger {...props} />;
    case 'calender':
      return <Calender {...props} />;
    case 'checkrectangle':
      return <CheckRectangle {...props} />;
    case 'cheverondown':
      return <CheveronDown {...props} />;
    case 'cheveronleft':
      return <CheveronLeft {...props} />;
    case 'cheveronleftdouble':
      return <CheveronLeftDouble {...props} />;
    case 'cheveronright':
      return <CheveronRight {...props} />;
    case 'cheveronrightdouble':
      return <CheveronRightDouble {...props} />;
    case 'cheveronup':
      return <CheveronUp {...props} />;
    case 'circularToggleDisabled':
      return <CircularToggleDisabled {...props} />;
    case 'circularToggleEnabled':
      return <CircularToggleEnabled {...props} />;
    case 'clearrectangle':
      return <ClearRectangle {...props} />;
    case 'clock':
      return <Clock {...props} />;
    case 'column':
      return <Column {...props} />;
    case 'columns':
      return <Columns {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'computer':
      return <Computer {...props} />;
    case 'copy':
      return <Copy {...props} />;
    case 'darkmode':
      return <DarkMode {...props} />;
    case 'datasource':
      return <Datasource {...props} />;
    case 'diamond':
      return <Diamond {...props} />;
    case 'downarrow':
      return <DownArrow {...props} />;
    case 'editrectangle':
      return <EditRectangle {...props} />;
    case 'enterprise':
      return <Enterprise {...props} />;
    case 'enterpriseGradient':
      return <EnterpriseGradient {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'eye1':
      return <Eye1 {...props} />;
    case 'eyedisable':
      return <EyeDisable {...props} />;
    case 'file01':
      return <File01 {...props} />;
    case 'filedownload':
      return <FileDownload {...props} />;
    case 'fileupload':
      return <FileUpload {...props} />;
    case 'filter':
      return <Filter {...props} />;
    case 'floppydisk':
      return <FloppyDisk {...props} />;
    case 'folder':
      return <Folder {...props} />;
    case 'folderdownload':
      return <FolderDownload {...props} />;
    case 'folderupload':
      return <FolderUpload {...props} />;
    case 'globe':
      return <Globe {...props} />;
    case 'grid':
      return <Grid {...props} />;
    case 'helppolygon':
      return <HelpPolygon {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'information':
      return <Information {...props} />;
    case 'inrectangle':
      return <InRectangle {...props} />;
    case 'instancesettings':
      return <InstanceSettings {...props} />;
    case 'interactive':
      return <Interactive {...props} />;
    case 'idea':
      return <Idea {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'leftarrow':
      return <LeftArrow {...props} />;
    case 'lightmode':
      return <LightMode {...props} />;
    case 'listview':
      return <ListView {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'logout':
      return <Logout {...props} />;
    case 'logs':
      return <Logs {...props} />;
    case 'menu':
      return <Menu {...props} />;
    case 'menuhome':
      return <MenuHome {...props} />;
    case 'minus':
      return <Minus {...props} />;
    case 'minus01':
      return <Minus01 {...props} />;
    case 'mobile':
      return <Mobile {...props} />;
    case 'informationcircle':
      return <InformationCircle {...props} />;
    case 'morehorizontal':
      return <MoreHorizontal {...props} />;
    case 'morevertical':
      return <MoreVertical {...props} />;
    case 'notification':
      return <Notification {...props} />;
    case 'notificationringing':
      return <NotificationRinging {...props} />;
    case 'notificationside':
      return <NotificationSide {...props} />;
    case 'notificationsilent':
      return <NotificationSilent {...props} />;
    case 'notificationunread':
      return <NotificationUnread {...props} />;
    case 'page':
      return <Page {...props} />;
    case 'pageAdd':
      return <PageAdd {...props} />;
    case 'pin':
      return <Pin {...props} />;
    case 'unpin':
      return <Unpin {...props} />;
    case 'play':
      return <Play {...props} />;
    case 'plus':
      return <Plus {...props} />;
    case 'plus01':
      return <Plus01 {...props} />;
    case 'plusrectangle':
      return <PlusRectangle {...props} />;
    case 'reload':
      return <Reload {...props} />;
    case 'remove':
      return <Remove {...props} />;
    case 'remove01':
      return <Remove01 {...props} />;
    case 'removerectangle':
      return <RemoveRectangle {...props} />;
    case 'rightarrrow':
      return <RightArrow {...props} />;
    case 'row':
      return <Row {...props} />;
    case 'sadrectangle':
      return <SadRectangle {...props} />;
    case 'search':
      return <Search {...props} />;
    case 'searchminus':
      return <SearchMinus {...props} />;
    case 'searchplus':
      return <SearchPlus {...props} />;
    case 'sent':
      return <Sent {...props} />;
    case 'sentfast':
      return <SentFast {...props} />;
    case 'server':
      return <Server {...props} />;
    case 'settings':
      return <Settings {...props} />;
    case 'comments':
      return <Comments {...props} />;
    case 'share':
      return <Share {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'shieldcheck':
      return <ShieldCheck {...props} />;
    case 'signpost':
      return <Signpost {...props} />;
    case 'smilerectangle':
      return <SmileRectangle {...props} />;
    case 'sortarrowdown':
      return <SortArrowDown {...props} />;
    case 'sortarrowup':
      return <SortArrowUp {...props} />;
    case 'subtract':
      return <Subtract {...props} />;
    case 'sun':
      return <Sun {...props} />;
    case 'table':
      return <Table {...props} />;
    case 'tick':
      return <Tick {...props} />;
    case 'trash':
      return <Trash {...props} />;
    case 'uparrow':
      return <UpArrow {...props} />;
    case 'user':
      return <User {...props} />;
    case 'useradd':
      return <UserAdd {...props} />;
    case 'usergroup':
      return <UserGroup {...props} />;
    case 'userremove':
      return <UserRemove {...props} />;
    case 'uturn':
      return <UTurn {...props} />;
    case 'variable':
      return <Variable {...props} />;
    case 'warning':
      return <Warning {...props} />;
    case 'zoomin':
      return <ZoomIn {...props} />;
    case 'zoomout':
      return <ZoomOut {...props} />;
    case 'zoomoutrectangle':
      return <ZoomOutRectangle {...props} />;
    case 'mail':
      return <Mail {...props} />;
    case 'marketplace':
      return <Marketplace {...props} />;
    case 'workspace':
      return <Workspace {...props} />;
    case 'workflows':
      return <Workflows {...props} />;
    case 'eyeopen':
      return <EyeOpen {...props} />;
    case 'layersversion':
      return <LayersVersion {...props} />;
    case 'cloudvalid':
      return <CloudValid {...props} />;
    case 'cloudinvalid':
      return <CloudInvalid {...props} />;
    case 'dot':
      return <Dot {...props} />;
    case 'check':
      return <Check {...props} />;
    case 'editable':
      return <Editable {...props} />;
    case 'minimize':
      return <Minimize {...props} />;
    case 'maximize':
      return <Maximize {...props} />;
    case 'inspect':
      return <Inspect {...props} />;
    case 'arrowbackup':
      return <ArrowForwardUp {...props} />;
    case 'arrowforwardup':
      return <ArrowBackUp {...props} />;
    case 'save':
      return <Save {...props} />;
    case 'cross':
      return <Cross {...props} />;
    default:
      return <Apps {...props} />;
  }
};
export default Icon;
