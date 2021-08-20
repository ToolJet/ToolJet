import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';


export const Datepicker = function Datepicker({value, onChange, readOnly, isTimeChecked}) {
const [date, setDate] = React.useState(value)

const dateChange = (e) => {
    let dateFormat = 'DD/MM/YYYY'
    if(isTimeChecked) {
        dateFormat = 'DD/MM/YYYY LT'
    }
    const _date = e.format(dateFormat)
    // console.log('__date-change__',_date );
    setDate(_date)

    onChange(_date)
}


    return (
        <>
        {readOnly ? (
            <span>{date}</span>
        ) : (
            <Datetime 
            timeFormat={isTimeChecked} 
            className='cell-type-datepicker' 
            dateFormat='DD/MM/YYYY' 
            value={date} 
            onChange={dateChange}/>
        )}
        </>
    )

};

