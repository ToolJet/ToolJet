import { toDayjsFormat } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';

describe('toDayjsFormat', () => {
  it('reads date-fns style formats, which builds write', () => {
    expect(toDayjsFormat('MMM d, yyyy')).toBe('MMM D, YYYY');
    expect(toDayjsFormat('dd/MM/yyyy')).toBe('DD/MM/YYYY');
    expect(toDayjsFormat('EEE d MMM yy')).toBe('ddd D MMM YY');
    expect(toDayjsFormat('EEEE, MMMM do yyyy')).toBe('dddd, MMMM Do YYYY');
  });
  it('a lone d means the day of the month', () => {
    expect(toDayjsFormat('MMM d')).toBe('MMM D');
  });
  it('leaves dayjs formats and escaped text alone', () => {
    expect(toDayjsFormat('DD MMM YYYY')).toBe('DD MMM YYYY');
    expect(toDayjsFormat('ddd, D MMM YYYY')).toBe('ddd, D MMM YYYY');
    expect(toDayjsFormat('[day] D [of] MMMM')).toBe('[day] D [of] MMMM');
    expect(toDayjsFormat(undefined)).toBe(undefined);
  });
});
