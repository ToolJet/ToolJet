import * as ee from '@ee/modules/CodeMode';

// Extension points for the enterprise app builder. Without the enterprise module every hook keeps the visual
// builder's behaviour: components render nothing and helpers pass values through.
const Nothing = () => null;
const noop = () => {};

export const CodeModeHeaderTools = ee.CodeModeHeaderTools ?? Nothing;
export const BuildModeBadge = ee.BuildModeBadge ?? Nothing;
// Without the enterprise module the canvas renders as it is.
export const CodeCanvasViewport = ee.CodeCanvasViewport ?? (({ children }) => children ?? null);
export const CodeCanvasWidthControl = ee.CodeCanvasWidthControl ?? Nothing;
export const LocalBehindNote = ee.LocalBehindNote ?? Nothing;
export const LocalChangesNote = ee.LocalChangesNote ?? Nothing;
export const ToolbarTip = ee.ToolbarTip ?? (({ children }) => children ?? null);
export const useDraftFollowsLatestCode = ee.useDraftFollowsLatestCode ?? noop;
export const CodeHistoryPanel = ee.CodeHistoryPanel ?? Nothing;
export const CodeInspector = ee.CodeInspector ?? Nothing;
export const CodeInspectorSidebar = ee.CodeInspectorSidebar ?? Nothing;
export const CodePanel = ee.CodePanel ?? Nothing;
export const requestOpenInCodePanel = ee.requestOpenInCodePanel ?? noop;
export const SaveVersionError = ee.SaveVersionError ?? Nothing;
export const BUILDING_CODE_LABEL = ee.BUILDING_CODE_LABEL ?? 'Saving...';
export const takeOpenRequest = ee.takeOpenRequest ?? noop;
export const useOpenRequest = ee.useOpenRequest ?? Nothing;
export const CodeBuildError = ee.CodeBuildError ?? class CodeBuildError extends Error {};
export const codeSaveRefusal = ee.codeSaveRefusal ?? Nothing;
export const saveErrorMessage =
  ee.saveErrorMessage ?? ((error) => error?.message || error?.error || 'Error while creating version. Please try again.');
export const saveVersionWithBuild = ee.saveVersionWithBuild ?? ((save) => save());
export const useSaveVersionCodeCheck = ee.useSaveVersionCodeCheck ?? (() => ({ checking: false, error: null }));
export const blocksSave = ee.blocksSave ?? (() => false);
export const CodeDiffHost = ee.CodeDiffHost ?? Nothing;
export const ReleaseCodeChanges = ee.ReleaseCodeChanges ?? Nothing;
export const compareBundleFor = ee.compareBundleFor ?? Nothing;
export const BLOCKED_WRITE_MESSAGE = ee.BLOCKED_WRITE_MESSAGE ?? '';
export const writeBlockedInCompare = ee.writeBlockedInCompare ?? (() => false);
export const exposeCompareProbe = ee.exposeCompareProbe ?? noop;
export const ReleaseScanGate = ee.ReleaseScanGate ?? Nothing;
export const SecurityPanel = ee.SecurityPanel ?? Nothing;
export const SecurityStatusChip = ee.SecurityStatusChip ?? Nothing;
export const AccessPanel = ee.AccessPanel ?? Nothing;
export const useCodeModePin = ee.useCodeModePin ?? (() => false);
export const useStyleInspectorRail = ee.useStyleInspectorRail ?? (() => null);
export const FrameLibraryComponent = ee.FrameLibraryComponent ?? Nothing;
export const useCodeMode = ee.useCodeMode ?? (() => false);
export const useCodePage = ee.useCodePage ?? (() => ({ isCodePage: false, rootId: undefined }));
export const useRoutePageRedirect = ee.useRoutePageRedirect ?? noop;
export const viewerLayoutFor =
  ee.viewerLayoutFor ?? (({ width, forcedMobile = false }) => (forcedMobile || width < 600 ? 'mobile' : 'desktop'));
export const isCodePageRoot = ee.isCodePageRoot ?? (() => false);
export const withoutCodePageRoots = ee.withoutCodePageRoots ?? ((ids) => ids || []);
export const withCodeModeParam = ee.withCodeModeParam ?? ((query = '') => query);
