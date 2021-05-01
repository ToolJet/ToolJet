
export function getToolTipProps(paramMeta) {
    if(paramMeta.tip) {
        return {
            style: {
                textDecorationLine: 'underline',
                textDecorationStyle: 'dashed'
            },
            ['data-tip']: paramMeta.tip
        }
    } else {
        return {}
    }
}
