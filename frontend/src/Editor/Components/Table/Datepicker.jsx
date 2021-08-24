import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';
import moment from 'moment'

export const Datepicker = function Datepicker({value, onChange, readOnly, isTimeChecked, dateFormat}) {
   
    const [date, setDate] = React.useState(value)

    const dateChange = (e) => {
        if(isTimeChecked) {
            setDate(e.format(`${dateFormat} LT`))
        } else {
            setDate(e.format(dateFormat))
        } 
    }

    React.useEffect(() => {
        const _date = isTimeChecked ? moment(value, `${dateFormat} hh:mm`) :  moment(value, dateFormat)

        if(!isTimeChecked) {
            setDate(_date)
        }

        if(isTimeChecked) {
            setDate(_date)
        }
    
    },[isTimeChecked, readOnly, dateFormat])


    let inputProps = {
        // placeholder: 'N/A',
        disabled: !readOnly,
    };


    return (
            <>
              <Datetime
                inputProps={inputProps}
                timeFormat={isTimeChecked} 
                className='cell-type-datepicker' 
                dateFormat={dateFormat} 
                value={date} 
                onChange={dateChange}
                onClose={() => onChange(date)}
              />
            </>
    )

};

