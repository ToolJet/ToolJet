import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';
import moment from 'moment'

export const Datepicker = function Datepicker({value, onChange, readOnly, isTimeChecked, dateFormat}) {
   
    const [date, setDate] = React.useState(value)

    const dateChange = (e) => {
        if(isTimeChecked) {
            setDate(moment(e, `${dateFormat} LT`))
        } else {
            setDate(moment(e, dateFormat))
        } 
    }

    React.useEffect(() => {
        const date = moment(value, 'DD/MM/YYYY')

        if(!isTimeChecked) {
            setDate(date.format(dateFormat))
        }

        if(isTimeChecked) {
            setDate(date.format(`${dateFormat} LT`))
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

