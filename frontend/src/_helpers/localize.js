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
  {
    en: '^File size (.*)? is too small. Minimum size is (.*)?$',
    es: 'El tamaño del archivo $1 es demasiado pequeño. El tamaño mínimo es $2',
  },
  {
    en: '^File size (.*)? is too large. Maximum size is (.*)?$',
    es: 'El tamaño del archivo $1 es demasiado grande. El tamaño máximo es $2',
  },
  {
    en: '^Max file count reached$',
    es: 'Número máximo de archivos alcanzado',
  },
  {
    en: '^All files will be accepted$',
    es: 'Se aceptan todos los archivos',
  },
  {
    en: '^Max file reached!$',
    es: '¡Archivo máximo alcanzado!',
  },
  {
    en: '^Files will be rejected!$',
    es: '¡Los archivos serán rechazados!',
  },
  {
    en: '^Files$',
    es: 'Archivos',
  },
];

let localizeMessage = (message) => {
  if (!config.LANGUAGE || config.LANGUAGE == 'en') return message;
  const replaceMessage = MESSAGES.find((m) => new RegExp(m.en).test(message));
  if (!replaceMessage) return message;
  return message.replace(new RegExp(replaceMessage.en), replaceMessage[config.LANGUAGE]);
};

export { localizeMessage };
