/* Copyright 2017 Infor
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// import lang from 'dojo/_base/lang';

const instances = {};

export function registerInstance(instance, name) {
  instances[name] = instance;
}

export function getInstance(name) {
  return instances[name];
}

export default function getResource(key) {
  const results = Object.keys(instances)
    .filter((name) => {
      return instances[name].exists(key);
    })
    .map((name) => {
      return instances[name];
    });

  if (results.length === 1) {
    return results[0].t(key, { returnObjects: true });
  } else if (results.length > 1) {
    throw new Error(`Duplicate translation key: ${key} was requested.`);
  } else {
    throw new Error(`Cannot find translation key: ${key} in any instances.`);
  }
}

/*
  const { defaultLocaleContext, localeContext, regionalContext } = window;
  if (!defaultLocaleContext || !localeContext) {
    return new Proxy({}, {
      properties: [],
      get(target, name) {
        if (name in target) {
          return target[name];
        }
        return '';
      },
    });
  }

  const defaultAttributes = defaultLocaleContext.getEntitySync(id).attributes;
  const currentAttributes = localeContext.getEntitySync(id).attributes;
  const regionalattributes = regionalContext.getEntitySync(id).attributes;

  lang.mixin(defaultAttributes, currentAttributes);
  return lang.mixin(defaultAttributes, regionalattributes);
}*/
