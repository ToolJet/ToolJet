
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
    if(data.startsWith("{{queries.") || data.startsWith("{{globals.") || data.startsWith("{{components.")) {
        let prop = data.replace('{{', '').replace('}}', '');
        return findProp(state, prop, '');
    }
}

export function resolveAll(data, state) {

}

export function getDynamicVariables(text) {
    const matchedParams  = text.match(/\{\{(.*?)\}\}/g);
    return matchedParams;
}

export function computeComponentName(componentType, currentComponents) {
    
    const currentComponentsForKind = Object.values(currentComponents).filter(component => component.component.component === componentType);
    let found = false;
    let name = '';
    let currentNumber = currentComponentsForKind.length + 1;

    while(!found) { 
        name = `${componentType.toLowerCase()}${currentNumber}`;
        if(Object.values(currentComponents).find(component => component.name === name) === undefined) {
            found = true;
        }
    }

    return name;
}

export function computeActionName(actions) {
    
    let currentNumber = actions.value.length;
    let found = false;
    let actionName = '';

    while(!found) { 
        actionName = `Action${currentNumber}`;
        if(actions.value.find(action => action.name === actionName) === undefined) {
            found = true;
        }
        currentNumber = currentNumber + 1
    }

    return actionName;
}