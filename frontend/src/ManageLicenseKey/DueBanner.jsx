import React, { useEffect, useState } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { licenseService } from '@/_services';
import { calculateDueDate, getDateDifferenceInDays } from '@/_helpers/utils';
import moment from 'moment';
import { ToolTip } from '@/_components';
import { capitalize } from 'lodash';

const statusList = ['failed', 'paid', 'draft'];

export default function DueBanner({ license, visibleOnlyFor = statusList }) {
  const [invoice, setInvoice] = useState(null);
  const [show, setShow] = useState(false);

  const { expiryDate, isExpired, licenseType } = license.licenseStatus ?? {};
  const { status } = invoice ?? {};
  const isDisabled = status === 'draft' ? true : false;

  const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(invoice?.invoiceDue));
  const invoiceMonth = moment(new Date(invoice?.invoiceDue)).format('MMM YYYY');

  useEffect(() => {
    licenseService.getUpcomingInvoice().then((data) => {
      setInvoice(data);
      setShow(!data.isViewed);
    });
  }, []);

  const handleMakePayment = () => {
    window.location.href = invoice?.invoiceLink;
  };

  const handleUpdateInvoice = () => {
    licenseService.updateInvoice(invoice.id).then(() => {
      setShow(false);
    });
  };

  const generateActionBtn = () => {
    if (status === 'paid') {
      return (
        <div onClick={handleUpdateInvoice} className="cursor-pointer">
          <SolidIcon fill="var(--slate9)" name="cross" width={25} viewBox="0 0 25 25" />
        </div>
      );
    } else {
      return (
        <ButtonSolid onClick={handleMakePayment} disabled={isDisabled} fill="var(--slate1)" rightIcon="arrowright">
          {isDisabled ? 'Auto-renew' : 'Make payment'}
        </ButtonSolid>
      );
    }
  };

  const generatePaymentStatus = () => {
    const currentDate = new Date();
    const expiry = expiryDate;
    const currentPeriodEndInMilliSeconds = moment(invoice?.currentPeriodEnd).unix();
    if (status === 'paid') {
      return {
        className: 'success',
        text: 'Payment successful!',
      };
    } else if (status === 'failed' && currentDate > new Date(invoice.currentPeriodEnd) && !isExpired) {
      return {
        className: 'error',
        text: `${calculateDueDate(currentPeriodEndInMilliSeconds)}. Kindly make the payment before ${moment(
          expiry
        ).format('DD MMMM YYYY')} to continue enjoying premium features!`,
      };
    } else if (status === 'failed' && isExpired) {
      return {
        className: 'error',
        headerText: `${capitalize(licenseType)} plan subscription expired`,
        text: 'Kindly make the payment to continue enjoying premium features!',
      };
    } else if (status === 'failed') {
      return {
        className: 'error',
        text: 'Payment failed. Please check your payment details or make a one-time payment.',
      };
    } else {
      return {
        className: '',
        text: `Amount due in ${daysLeft} day(s)`,
      };
    }
  };

  const paymentStatus = generatePaymentStatus();

  return (
    invoice &&
    show &&
    visibleOnlyFor.includes(status) && (
      <div className={`due-banner my-3 ${paymentStatus.className}`}>
        <div className="due-info-container">
          <div>
            <SolidIcon className="infoIcon" viewBox="0 0 20 20" name="informationPrimary" />
          </div>
          <div className="due-for-container">
            <div className="font-weight-500 tj-text-md">
              {paymentStatus?.headerText ?? `Invoice for ${invoiceMonth}`}
            </div>
            <div className={`font-weight-400 tj-text-sm text-secondary`}>{paymentStatus.text}</div>
          </div>
        </div>
        <ToolTip placement="top" show={isDisabled} message="Payment is on an auto-renew cycle">
          <div className="payment-btn-container">{generateActionBtn()}</div>
        </ToolTip>
      </div>
    )
  );
}
