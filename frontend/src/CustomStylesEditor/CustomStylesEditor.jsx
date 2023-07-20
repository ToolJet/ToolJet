import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

import { customStylesService } from '@/_services';
import { toast } from 'react-hot-toast';
import InformationCircle from '@/_ui/Icon/solidIcons/InformationCircle';

export default function CustomStylesEditor({ darkMode }) {
  const [styles, setStyles] = useState();
  const { t } = useTranslation();

  useEffect(() => {
    customStylesService.get().then((data) => {
      setStyles(data.styles);
    });
  }, []);

  const saveStyles = async () => {
    try {
      await customStylesService.save({ styles });
      toast.success('Succesfully updated styles', {
        position: 'top-center',
      });
    } catch (error) {
      toast.error('Something went wrong! Please try again later.', {
        position: 'top-center',
      });
    }
  };

  return (
    <ErrorBoundary showFallback={true}>
      <div className="wrapper animation-fade">
        <div className="page-wrapper">
          <div className="container-xl">
            <div className="d-block org-settings-wrapper-card custom-styles-wrapper">
              <div className="col p-3 border-bottom">
                <h3 className="card-title m-0">Custom Styles</h3>
              </div>
              <div className="w-100 p-4 custom-css-input-container">
                <CodeHinter
                  currentState={''}
                  initialValue={styles}
                  mode="css"
                  theme={darkMode ? 'monokai' : 'base16-light'}
                  height={700}
                  onChange={(value) => setStyles(value)}
                  enablePreview={false}
                />
                <div className="w-100 mt-2 custom-css-input-container org-settings-info small p-3 mb-3 rounded d-flex">
                  <div className="pe-2">
                    <InformationCircle fill={darkMode ? '#273869' : '#aebdee'} width="33" innerFill="#3e63de" />
                  </div>
                  <div style={{ lineHeight: '20px' }}>
                    These styles will apply to all apps within this workspace. For example,{' '}
                    <code>{'._tooljet-Button button {color: red !important; }'}</code> will make the text color of all
                    buttons of all apps within this workspace red. Keep in mind that you might need to use{' '}
                    <code>!important</code> to apply some styles
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <ButtonSolid
                    onClick={saveStyles}
                    data-cy="save-button"
                    variant="primary"
                    className="ms-2"
                    leftIcon="floppydisk"
                    fill="#fff"
                    iconWidth="20"
                  >
                    {t('globals.savechanges', 'Save')}
                  </ButtonSolid>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
