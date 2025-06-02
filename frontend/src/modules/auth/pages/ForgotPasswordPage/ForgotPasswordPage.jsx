import { withEditionSpecificComponent } from '@/modules/common/helpers';
import BasePasswordForgotPage from './components/BaseForgotPasswordPage/BaseForgotPasswordPage';

const ForgotPasswordPage = () => {
  const contactAdmin = false;
  return BasePasswordForgotPage({ contactAdmin });
};

export default withEditionSpecificComponent(ForgotPasswordPage, 'auth');
