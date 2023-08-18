import config from 'config';

const MESSAGES = [
  {
    en: '^Minimum (\\d+) characters is needed$',
    es: 'Se requieren mínimo $1 caracteres',
  },
  {
    en: '^Maximum (\\d+) characters is allowed$',
    es: 'Se permiten máximo $1 caracteres',
  },
];

let localizeMessage = (message) => {
  if (!config.LANGUAGE || config.LANGUAGE == 'en') return message;
  const replaceMessage = MESSAGES.find((m) => new RegExp(m.en).test(message));
  if (!replaceMessage) return message;
  return message.replace(new RegExp(replaceMessage.en), replaceMessage[config.LANGUAGE]);
};

export { localizeMessage };
