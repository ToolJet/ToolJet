import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { LicenseBanner } from '@/LicenseBanner';
import { licenseService, customStylesService } from '@/_services';
import { toast } from 'react-hot-toast';
import InformationCircle from '@/_ui/Icon/solidIcons/InformationCircle';

export default function CustomStylesEditor({ darkMode }) {
  const { t } = useTranslation();

  const [styles, setStyles] = useState();
  const [initialStyles, setInitialStyles] = useState();
  const [disabled, setDisabledStatus] = useState(false);

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setDisabledStatus(
        data?.licenseStatus?.isExpired || !data?.licenseStatus?.isLicenseValid || data?.customStyling !== true
      );
    });
  };

  const fetchStyles = async () => {
    try {
      const data = await customStylesService.get();
      setStyles(data.styles);
      if (!initialStyles) {
        setInitialStyles(data.styles);
      }
    } catch (error) {
      toast.error('Failed to fetch custom styles. Please try again.', {
        position: 'top-center',
      });
    }
  };

  useEffect(() => {
    fetchFeatureAccess();
    fetchStyles();
  }, []);

  const reset = () => {
    if (disabled) {
      return;
    }
    setStyles(initialStyles);
    toast.success('Custom style changes discarded. No updates were made.', {
      position: 'top-center',
    });
  };

  const saveStyles = async () => {
    try {
      await customStylesService.save({ styles });
      setInitialStyles(styles);
      toast.success('Custom styles updated successfully', {
        position: 'top-center',
      });
    } catch (error) {
      toast.error('Failed to update custom styles. Please try again.', {
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
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="card-title m-0">Custom Styles</h3>
                  {disabled && <LicenseBanner isAvailable={false} showPaidFeatureBanner={true}></LicenseBanner>}
                </div>
              </div>
              <div className="w-100 p-4 custom-css-input-container">
                <CodeHinter
                  currentState={styles}
                  initialValue={!disabled ? styles : ''}
                  mode="css"
                  theme={darkMode ? 'monokai' : 'base16-light'}
                  height={700}
                  onChange={(value) => setStyles(value)}
                  enablePreview={false}
                  disabled={disabled}
                  placeholder={disabled ? styles : ''}
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
                  <button type="button" className="btn btn-light mr-2" onClick={reset} data-cy="cancel-button">
                    {t('globals.cancel', 'Cancel')}
                  </button>
                  <ButtonSolid
                    onClick={saveStyles}
                    data-cy="save-button"
                    disabled={disabled}
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
