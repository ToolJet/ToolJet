import moment from 'moment';

export function findProp(obj, prop, defval) {
  if (typeof defval === 'undefined') defval = null;
  prop = prop.split('.');
  console.log('prop', prop);
  console.log('obj', obj);
  for (var i = 0; i < prop.length; i++) {
    if (prop[i].endsWith(']')) {
      const actual_prop = prop[i].split('[')[0];
      const index = prop[i].split('[')[1].split(']')[0];
      if (obj[actual_prop]) {
        obj = obj[actual_prop][index];
      } else {
        obj = undefined;
      }
    } else if (obj !== undefined) {
      if (typeof obj[prop[i]] === 'undefined') return defval;
      obj = obj[prop[i]];
    }
  }
  return obj;
}

export function resolve(data, state) {
  if (data.startsWith('{{queries.') || data.startsWith('{{globals.') || data.startsWith('{{components.')) {
    let prop = data.replace('{{', '').replace('}}', '');
    return findProp(state, prop, '');
  }
}

export function resolveAll(data, state) {

}

export function resolve_references(object, state) {
  if (typeof object === 'string') {
    if (object.startsWith('{{') && object.endsWith('}}')) {
      const code = object.replace('{{', '').replace('}}', '');
      let result = '';

      try {
        const evalFunction = Function(['components', 'queries', 'globals', 'moment'], `return ${code}`);
        result = evalFunction(state.components, state.queries, state.globals, moment);
      } catch (err) {
        console.log('eval_error', err);
      }

      return result;
    }

    const dynamicVariables = getDynamicVariables(object);
    if (dynamicVariables) {
      if (dynamicVariables.length === 1 && dynamicVariables[0] === object) {
        object = resolve(dynamicVariables[0], state);
      } else {
        for (const dynamicVariable of dynamicVariables) {
          const value = resolve(dynamicVariable, state);
          object = object.replace(dynamicVariable, value);
        }
      }
    }
    return object;
  } if (Array.isArray(object)) {
    console.log(`[Resolver] Resolving as array ${typeof object}`);

    const new_array = [];

    object.forEach((element, index) => {
      const resolved_object = resolve_references(element, state);
      new_array[index] = resolved_object;
    });

    return new_array;
  } if (typeof object === 'object') {
    console.log(`[Resolver] Resolving as object ${typeof object}, state: ${state}`);
    Object.keys(object).forEach((key, index) => {
      const resolved_object = resolve_references(object[key], state);
      object[key] = resolved_object;
    });

    return object;
  }
  return object;
}

export function getDynamicVariables(text) {
  const matchedParams = text.match(/\{\{(.*?)\}\}/g);
  return matchedParams;
}

export function computeComponentName(componentType, currentComponents) {
  const currentComponentsForKind = Object.values(currentComponents).filter(component => component.component.component === componentType);
  let found = false;
  let componentName = '';
  let currentNumber = currentComponentsForKind.length + 1;

  while (!found) {
    componentName = `${componentType.toLowerCase()}${currentNumber}`;
    if (Object.values(currentComponents).find(component => component.name === componentName) === undefined) {
      found = true;
    }
  }

  return componentName;
}

export function computeActionName(actions) {
  const values = actions ? actions.value : [];

  let currentNumber = values.length;
  let found = false;
  let actionName = '';

  while (!found) {
    actionName = `Action${currentNumber}`;
    if (values.find(action => action.name === actionName) === undefined) {
      found = true;
    }
    currentNumber += 1;
  }

  return actionName;
}
