import React from 'react';
import AddRectangle from './AddRectangle.jsx';
import Apps from './Apps.jsx';
import Archive from './Archive.jsx';
import ArrowBack from './ArrowBack.jsx';
import ArrowLeft from './Arrowleft.jsx';
import ArrowReturn from './ArrowReturn.jsx';
import ArrowRight from './ArrowRight.jsx';
import ArrowSort from './ArrowSort.jsx';
import ArrowSortRectangle from './ArrowSortRectangle.jsx';
import ArrowTransfer from './ArrowTransfer.jsx';
import ArrowUp from './ArrowUp.jsx';
import BookSearch from './BookSearch.jsx';
import Branch from './Branch.jsx';
import Bug from './Bug.jsx';
import Calender from './Calender.jsx';
import CheckRectangle from './CheckRectangle.jsx';
import CheveronDown from './CheveronDown.jsx';
import CheveronLeft from './CheveronLeft.jsx';
import CheveronRight from './CheveronRight.jsx';
import CheveronUp from './CheveronUp.jsx';
import ClearRectangle from './ClearRectangle.jsx';
import Clock from './Clock.jsx';
import Columns from './Columns.jsx';
import Compass from './Compass.jsx';
import Computer from './Computer.jsx';
import Copy from './Copy.jsx';
import Diamond from './Diamond.jsx';
import DownArrow from './DownArrow.jsx';
import EditRectangle from './EditRectangle.jsx';
import Eye from './Eye.jsx';
import Eye1 from './Eye1.jsx';
import EyeDisable from './EyeDisable.jsx';
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
import InRectangle from './InRectangle.jsx';
import Interactive from './Interactive.jsx';
import Layers from './Layers.jsx';
import LeftArrow from './LeftArrow.jsx';
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
import Setting from './Setting.jsx';
import Share from './Share.jsx';
import Shield from './Shield.jsx';
import ShieldCheck from './ShieldCheck.jsx';
import Signpost from './Signpost.jsx';
import SmileRectangle from './SmileRectangle.jsx';
import SortArrowDown from './SortArrowDown.jsx';
import SortArrowUp from './SortArrowUp.jsx';
import Sun from './Sun.jsx';
import Table from './Table.jsx';
import Tick from './Tick.jsx';
import Trash from './Trash.jsx';
import UpArrow from './UpArrow.jsx';
import UserAdd from './UserAdd.jsx';
import UserGroup from './UserGroup.jsx';
import UserRemove from './UserRemove.jsx';
import UTurn from './UTurn.jsx';
import Variable from './Variable.jsx';
import Warning from './Warning.jsx';
import ZoomIn from './ZoomIn.jsx';
import ZoomOut from './ZoomOut.jsx';
import ZoomOutRectangle from './ZoomOutRectangle.jsx';
import CheckCircle from './CheckCircle.jsx';
import Comments from './Comments.jsx';
import CommentsNotification from './CommentsNotification.jsx';
import Direction from './Direction.jsx';
import Dislike from './Dislike.jsx';
import Like from './Like.jsx';
import Moon from './Moon.jsx';
import RemoveCircle from './RemoveCircle.jsx';
import Telescope from './Telescope.jsx';
import Unlock from './Unlock.jsx';
import DragHandle from './DragHandle.jsx';
import Lock from './Lock.jsx';

const Icon = (props) => {
  switch (props.name) {
    case 'addrectangle':
      return <AddRectangle {...props} />;
    case 'apps':
      return <Apps {...props} />;
    case 'archive':
      return <Archive {...props} />;
    case 'arrowback':
      return <ArrowBack {...props} />;
    case 'arrowleft':
      return <ArrowLeft {...props} />;
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
    case 'booksearch':
      return <BookSearch {...props} />;
    case 'branch':
      return <Branch {...props} />;
    case 'bug':
      return <Bug {...props} />;
    case 'calender':
      return <Calender {...props} />;
    case 'checkrectangle':
      return <CheckRectangle {...props} />;
    case 'cheverondown':
      return <CheveronDown {...props} />;
    case 'cheveronleft':
      return <CheveronLeft {...props} />;
    case 'cheveronright':
      return <CheveronRight {...props} />;
    case 'cheveronup':
      return <CheveronUp {...props} />;
    case 'clearrectangle':
      return <ClearRectangle {...props} />;
    case 'clock':
      return <Clock {...props} />;
    case 'columns':
      return <Columns {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'computer':
      return <Computer {...props} />;
    case 'copy':
      return <Copy {...props} />;
    case 'diamond':
      return <Diamond {...props} />;
    case 'downarrow':
      return <DownArrow {...props} />;
    case 'editrectangle':
      return <EditRectangle {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'eye1':
      return <Eye1 {...props} />;
    case 'eyedisable':
      return <EyeDisable {...props} />;
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
    case 'interactive':
      return <Interactive {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'leftarrow':
      return <LeftArrow {...props} />;

    case 'listview':
      return <ListView {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'logout':
      return <Logout {...props} />;
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
    case 'play':
      return <Play {...props} />;
    case 'plus':
      return <Plus {...props} />;
    case 'plus01':
      return <Plus01 {...props} />;
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
    case 'setting':
      return <Setting {...props} />;
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
    case 'unlock':
      return <Unlock {...props} />;
    case 'telescope':
      return <Telescope {...props} />;
    case 'removeCircle':
      return <RemoveCircle {...props} />;
    case 'moon':
      return <Moon {...props} />;
    case 'like':
      return <Like {...props} />;
    case 'draghandle':
      return <DragHandle {...props} />;
    case 'dislike':
      return <Dislike {...props} />;
    case 'direction':
      return <Direction {...props} />;
    case 'commentsnotification':
      return <CommentsNotification {...props} />;
    case 'comments':
      return <Comments {...props} />;
    case 'checkcircle':
      return <CheckCircle {...props} />;

    default:
      return <Apps {...props} />;
  }
};
export default Icon;
