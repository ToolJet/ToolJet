
export function findProp(obj, prop, defval){
    if (typeof defval == 'undefined') defval = null;
    prop = prop.split('.');
    console.log('prop', prop);
    console.log('obj', obj);
    for (var i = 0; i < prop.length; i++) {
        if(prop[i].endsWith("]")) {
            const actual_prop = prop[i].split('[')[0];
            const index = prop[i].split('[')[1].split(']')[0];
            obj = obj[actual_prop][index];
        } else {
            if(typeof obj[prop[i]] == 'undefined')
                return defval;
            obj = obj[prop[i]];
        }
    }
    return obj;
}

export function resolve(data, state) {
    if(data.startsWith("{{queries.")) {
        let prop = data.replace('{{', '').replace('}}', '');
        return findProp(state, prop, []);
    }
}