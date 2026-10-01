'use strict';

const cpfcnpj = require('../lib');
const { isValidCpf, isValidCnpj, normalizeCpf, normalizeCnpj } = require('../lib/validators');

const TOKEN = 'test-token';

const jsonResponse = (status, body) => ({
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
});

const rawResponse = (status, text) => ({
  status,
  text: async () => text,
});

describe('cpfcnpj validators', () => {
  it('normalizes a CPF to digits only', () => {
    expect(normalizeCpf('111.444.777-35')).toBe('11144477735');
  });

  it('normalizes a CNPJ keeping letters and upper-casing', () => {
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });

  it('validates a correct CPF', () => {
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('rejects a CPF with wrong check digits', () => {
    expect(isValidCpf('12345678900')).toBe(false);
  });

  it('rejects a CPF made of repeated digits', () => {
    expect(isValidCpf('00000000000')).toBe(false);
  });

  it('validates a numeric CNPJ', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('validates an alphanumeric CNPJ', () => {
    expect(isValidCnpj('12ABC34501DE35')).toBe(true);
  });

  it('validates a masked alphanumeric CNPJ', () => {
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
  });

  it('rejects a document with the wrong length', () => {
    expect(isValidCnpj('1122233300018')).toBe(false);
  });
});

describe('cpfcnpj run', () => {
  const service = new cpfcnpj.default();

  afterEach(() => {
    delete global.fetch;
  });

  it('looks up a CPF and returns ok on status 1', async () => {
    const body = { status: 1, cpf: '111.444.777-35', nome: 'Test Token', pacoteUsado: 1 };
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, body));

    const result = await service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '111.444.777-35' });

    expect(result.status).toBe('ok');
    expect(result.data).toEqual(body);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cpfcnpj.com.br/test-token/1/11144477735',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } })
    );
  });

  it('builds the right URL and package per operation', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { status: 1 }));

    await service.run({ token: TOKEN }, { operation: 'cpf_full', document: '11144477735' });
    await service.run({ token: TOKEN }, { operation: 'cnpj_basic', document: '11222333000181' });
    await service.run({ token: TOKEN }, { operation: 'cnpj_full', document: '12ABC34501DE35' });

    const urls = global.fetch.mock.calls.map((call) => call[0]);
    expect(urls).toEqual([
      'https://api.cpfcnpj.com.br/test-token/3/11144477735',
      'https://api.cpfcnpj.com.br/test-token/5/11222333000181',
      'https://api.cpfcnpj.com.br/test-token/6/12ABC34501DE35',
    ]);
  });

  it('calls the free saldo endpoint for balance', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { status: 1, pacote: { id: 5, nome: 'CNPJ B', saldo: 123 } }));

    const result = await service.run({ token: TOKEN }, { operation: 'balance', package: '5' });

    expect(result.status).toBe('ok');
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.cpfcnpj.com.br/test-token/saldo/5');
  });

  it('maps the status 0 error envelope arriving with HTTP 400', async () => {
    const body = { status: 0, cpf: '', nome: null, erro: 'CPF inválido!', pacoteUsado: 1, erroCodigo: 100 };
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(400, body));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toMatchObject({
      message: 'Query could not be completed',
      description: 'CPF inválido!',
      data: { erroCodigo: 100, httpStatus: 400 },
    });
  });

  it('surfaces the API message when erroCodigo is missing or arrives as a string', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { status: 0, erro: 'CPF inexistente' }))
      .mockResolvedValueOnce(jsonResponse(401, { status: '0', erro: 'Token inválido', erroCodigo: '1000' }));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toMatchObject({ description: 'CPF inexistente', data: { httpStatus: 400 } });

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toMatchObject({ description: 'Token inválido', data: { erroCodigo: 1000, httpStatus: 401 } });
  });

  it('accepts status "1" as a string on a successful response', async () => {
    const body = { status: '1', cpf: '111.444.777-35', nome: 'Test Token' };
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, body));

    const result = await service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' });
    expect(result).toEqual({ status: 'ok', data: body });
  });

  it('maps the gateway error envelope', async () => {
    const body = { status: 'error', code: 400, message: 'Incorrect parameters.' };
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(400, body));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cnpj_basic', document: '11222333000181' })
    ).rejects.toMatchObject({
      description: 'Incorrect parameters.',
      data: { code: 400, httpStatus: 400 },
    });
  });

  it('does not call fetch for an invalid document', async () => {
    global.fetch = jest.fn();

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '12345678900' })
    ).rejects.toMatchObject({
      description: 'Invalid CPF check digits',
      data: { code: 'invalid_document' },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('maps a network or timeout failure', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cnpj_full', document: '12ABC34501DE35' })
    ).rejects.toMatchObject({
      message: 'Query could not be completed',
      description: 'Request timed out after 60 seconds',
      data: { code: 'timeout' },
    });
  });

  it('keeps the HTTP status when the error answer has an empty body', async () => {
    global.fetch = jest.fn().mockResolvedValue(rawResponse(401, ''));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toMatchObject({
      description: 'Unexpected response from the CPF.CNPJ API',
      data: { httpStatus: 401 },
    });
  });

  it('reports a non JSON answer with its HTTP status', async () => {
    global.fetch = jest.fn().mockResolvedValue(rawResponse(502, '<html>Bad gateway</html>'));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toMatchObject({
      description: 'The API response was not valid JSON',
      data: { httpStatus: 502 },
    });
  });

  it('never leaks the token in a network error message', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error(`request to https://api.cpfcnpj.com.br/${TOKEN}/1/11144477735 failed`));

    await expect(
      service.run({ token: TOKEN }, { operation: 'cpf_basic', document: '11144477735' })
    ).rejects.toEqual(expect.objectContaining({ description: expect.not.stringContaining(TOKEN) }));
  });
});

describe('cpfcnpj testConnection', () => {
  const service = new cpfcnpj.default();

  afterEach(() => {
    delete global.fetch;
  });

  it('returns ok when saldo responds with status 1', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { status: 1, pacote: { id: 1, nome: 'CPF A', saldo: 10 } }));

    const result = await service.testConnection({ token: TOKEN });

    expect(result).toEqual({ status: 'ok' });
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.cpfcnpj.com.br/test-token/saldo/1');
  });

  it('returns failed with the envelope message on an invalid token', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(400, { status: 0, erro: 'Token inválido', erroCodigo: 1000 }));

    const result = await service.testConnection({ token: TOKEN });

    expect(result.status).toBe('failed');
    expect(result.message).toBe('Token inválido');
  });

  it('explains the HTTP 401 with an empty or null body', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(rawResponse(401, ''))
      .mockResolvedValueOnce(rawResponse(401, 'null'));

    for (let i = 0; i < 2; i++) {
      const result = await service.testConnection({ token: TOKEN });
      expect(result.status).toBe('failed');
      expect(result.message).toContain('HTTP 401');
      expect(result.message).toContain('outbound IP address');
      expect(result.message).not.toContain(TOKEN);
    }
  });

  it('returns failed without a token', async () => {
    const result = await service.testConnection({});
    expect(result.status).toBe('failed');
  });
});
