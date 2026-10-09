import { HomePageComponent } from '../HomePage';
import { toast } from 'react-hot-toast';
import { authenticationService, aiOnboardingService, libraryAppService } from '@/_services';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

// handleAiOnboarding is what turns the website cookies into a deploy, a create, or the denied modal.
// The instance is built directly: its collaborators are stubbed so each test sees one decision.
const build = ({ aiCookies, canCreate = true, appType = 'front-end', realDeploy = false }) => {
  jest.spyOn(authenticationService, 'currentSessionValue', 'get').mockReturnValue({ ai_cookies: aiCookies });
  const page = new HomePageComponent({ appType });
  page.setState = jest.fn();
  page.canCreateApp = jest.fn(() => canCreate);
  page.createApp = jest.fn();
  if (!realDeploy) page.deployApp = jest.fn().mockResolvedValue({});
  page.eraseAIOnboardingRelatedCookies = jest.fn();
  return page;
};

describe('HomePage.handleAiOnboarding', () => {
  beforeEach(() => {
    jest.spyOn(libraryAppService, 'defaultAppName').mockResolvedValue({ name: 'Expense reimbursement' });
    jest.spyOn(aiOnboardingService, 'deleteAiCookies').mockResolvedValue({});
  });

  afterEach(() => jest.restoreAllMocks());

  it('deploys the template under the default name when the user can create apps', async () => {
    const page = build({ aiCookies: { tj_template_id: 'expense-reimbursement' } });
    page.handleAiOnboarding();

    await Promise.resolve();
    await new Promise(process.nextTick);
    expect(page.setState).toHaveBeenCalledWith({ showAIOnboardingLoadingScreen: true });
    expect(page.deployApp).toHaveBeenCalledWith(expect.any(Event), 'Expense reimbursement', {
      id: 'expense-reimbursement',
    });
    expect(page.eraseAIOnboardingRelatedCookies).not.toHaveBeenCalled();
  });

  it('opens the access modal and erases the cookies at once when the user cannot create apps', () => {
    const page = build({ aiCookies: { tj_template_id: 'expense-reimbursement' }, canCreate: false });
    page.handleAiOnboarding();

    expect(page.setState).toHaveBeenCalledWith({ showInsufficentPermissionModal: true });
    expect(page.eraseAIOnboardingRelatedCookies).toHaveBeenCalledTimes(1);
    expect(page.deployApp).not.toHaveBeenCalled();
    expect(page.createApp).not.toHaveBeenCalled();
  });

  it('does not erase the cookies a second time when the modal is dismissed', () => {
    const page = build({ aiCookies: { tj_template_id: 'x' }, canCreate: false });
    page.onPermissionDeniedModalHide();

    expect(page.setState).toHaveBeenCalledWith({ showInsufficentPermissionModal: false });
    expect(page.eraseAIOnboardingRelatedCookies).not.toHaveBeenCalled();
  });

  it('creates the app from the prompt when the website left one', () => {
    const page = build({ aiCookies: { tj_ai_prompt: 'a%20crm' } });
    page.handleAiOnboarding();

    expect(page.createApp).toHaveBeenCalledWith(expect.stringMatching(/^Untitled App: /), undefined, 'a crm');
    expect(page.deployApp).not.toHaveBeenCalled();
  });

  it('does nothing on the workflow home page', () => {
    const page = build({ aiCookies: { tj_template_id: 'x' }, appType: 'workflow' });
    page.handleAiOnboarding();

    expect(page.setState).not.toHaveBeenCalled();
    expect(page.deployApp).not.toHaveBeenCalled();
    expect(page.eraseAIOnboardingRelatedCookies).not.toHaveBeenCalled();
  });

  it('tells the user when the template cannot be created because the app name is taken', async () => {
    const error = jest.spyOn(toast, 'error').mockImplementation(() => {});
    const page = build({ aiCookies: { tj_template_id: 'expense-reimbursement' } });
    page.deployApp.mockResolvedValue(false);
    page.handleAiOnboarding();

    await new Promise(process.nextTick);
    expect(error).toHaveBeenCalledWith('Could not create the app from the template. The app name is taken.');
  });

  it('closes the loading screen and erases the cookies when the active git branch is gone', async () => {
    jest.spyOn(toast, 'error').mockImplementation(() => {});
    const { actions } = useWorkspaceBranchesStore.getState();
    useWorkspaceBranchesStore.setState({
      currentBranch: { name: 'deleted-branch' },
      actions: { ...actions, checkBranchExistsOnRemote: jest.fn().mockResolvedValue(false) },
    });
    // the real deployApp runs here: that is where the branch check lives
    const page = build({ aiCookies: { tj_template_id: 'expense-reimbursement' }, realDeploy: true });
    await page.deployApp(new Event('deploy'), 'Expense reimbursement', { id: 'expense-reimbursement' });

    expect(page.setState).toHaveBeenCalledWith({ showAIOnboardingLoadingScreen: false });
    expect(page.eraseAIOnboardingRelatedCookies).toHaveBeenCalledTimes(1);
  });
});
