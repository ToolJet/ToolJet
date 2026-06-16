import EEEnvironmentSwitcher from '@ee/modules/Appbuilder/components/EnvironmentSwitcher';
const EnvironmentSwitcher = () => null;

export default process.env.TOOLJET_EDITION === 'ce' ? EnvironmentSwitcher : EEEnvironmentSwitcher;
