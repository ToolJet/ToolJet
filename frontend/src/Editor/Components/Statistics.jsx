import React, { useEffect, useState } from 'react';
export const Statistics = function Statistics({ height, properties,styles}) {
    const { primaryValueLabel, primaryvalue, secondaryValueLabel, secondaryvalue, secondarysigndisplay } = properties;
    const { PrimaryLabelColour, PrimaryTextColour, SecondaryLabelColour, SecondaryTextColour } = styles;

    const [sign, setSign] = useState('')

    useEffect(() => {
        secondarysigndisplay == 'positive'? setSign('+'):setSign('-')
    }, [secondarysigndisplay]);

    const baseStyle = {
        borderRadius: 4,
        height,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        margin: '0px auto',
        width: '196px',
        border: ' 0.75px solid #A6B6CC',
        fontFamily: 'Inter'
    };

    const letterStyle = {
        fontSize: '14px',
        marginTop: '12px', marginBottom: '0px',
        fontWeight: '500',
    };

    const priceStyle = {
        fontSize: '34px',
        color: PrimaryTextColour,
        fontWeight: '700',
        marginBottom: '0px'
    };

    const marginStyle = {
        marginBottom: '0px'
    }

    const percentageContainer = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: ' center',
        padding: '5px 8px',
        width: '61px',
        height: '24px',
        background: secondarysigndisplay == 'positive'?'#EDFFF9':'#FDEAED',
        borderRadius: '58px',
        color: SecondaryTextColour?SecondaryTextColour:secondarysigndisplay == 'positive'?'#36AF8B':'#EE2C4D',
        fontWeight: '700'
    }

    return (
        <div className="" style={baseStyle}>
            <p style={{...letterStyle,color:PrimaryLabelColour}}>{primaryValueLabel}</p>
            <h2 style={priceStyle} >${primaryvalue}</h2>
            <div>
                <div className="d-flex flex-row ">
                    {secondarysigndisplay == 'positive'? < img src='../../../assets/images/icons/widgets/upstatics.svg' style={{ ...marginStyle, marginRight: '6.5px' }}/>: <img src='../../../assets/images/icons/widgets/downstatics.svg' style={{ ...marginStyle, marginRight: '6.5px' }} />}
                    <p style={{ ...marginStyle, ...percentageContainer }}>{sign}{secondaryvalue}%</p>
                </div>
                <p style={{ ...letterStyle,color:SecondaryLabelColour}} >{secondaryValueLabel}</p>
            </div>
        </div>
    );
};
