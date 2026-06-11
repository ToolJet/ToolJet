'use strict';

const zendesk = require('../lib');

const ZENDESK_SUBDOMAIN = 'tooljet';

describe('zendesk', () => {
  const Zendesk = new zendesk.default();

  let sourceOptions = {
    subdomain: ZENDESK_SUBDOMAIN,
    access_token: 'access_token',
  };

  let queryOptions = {};
  beforeAll(() => {});

  it('should list all tickets', async () => {
    queryOptions.operation = 'read_tickets';
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['tickets'] instanceof Array).toBe(true);
  });

  it('should list all users', async () => {
    queryOptions.operation = 'list_users';
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['users'] instanceof Array).toBe(true);
  });

  it('should read requested tickets of an user', async () => {
    queryOptions.operation = 'read_requested_tickets';
    queryOptions.user_id = '6564404407965';
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['tickets'] instanceof Array).toBe(true);
  });

  it('should return a ticket', async () => {
    queryOptions.operation = 'show_ticket';
    queryOptions.ticket_id = '1';
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['ticket'] instanceof Object).toBe(true);
  });

  it('should get user details', async () => {
    queryOptions.operation = 'get_user';
    queryOptions.user_id = '6564404407965';
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['user'] instanceof Object).toBe(true);
  });

  it.todo('get profiles : not implemented');

  it('should update ticket', async () => {
    queryOptions.operation = 'update_ticket';
    queryOptions.ticket_id = 1;
    queryOptions.body = {
      ticket: {
        status: 'open',
      },
    };
    const { status, data } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
    expect(data['audit']['ticket_id']).toBe(queryOptions.ticket_id);
  });

  it('should return searched query', async () => {
    queryOptions.operation = 'search';
    queryOptions.query = 'type:ticket status:open';
    const { status } = await Zendesk.run(sourceOptions, queryOptions, 'zendesk-test');
    expect(status).toBe('ok');
  });
});
