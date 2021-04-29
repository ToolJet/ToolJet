class RestapiQueryService
  attr_accessor :data_query, :options, :source_options, :current_user, :data_source

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @options = options
    @source_options = source_options
    @current_user = current_user
    @data_source = data_query.data_source
  end

  def process
    url = options['url']
    method = options['method']
    headers = options['headers'].reject { |header| header[0].empty? }
    body = options['body']
    url_params = options['url_params']

    if source_options['auth_type'] === 'oauth2'

      oauth_tokens = DataSourceUserOauth2.where(user: current_user,
                                                data_source: data_source).order('created_at desc')
      if oauth_tokens.size == 0
        auth_url = "#{source_options['auth_url']}?response_type=code&client_id=#{source_options['client_id']}&redirect_uri=#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize&scope=#{source_options['scopes']}"
        return { error: { message: 'needs authorization', code: 'oauth2_needs_auth',
                          data: { auth_url: auth_url } } }
      else
        token = JSON.parse(oauth_tokens.first.options)['access_token']
      end

      if source_options['add_token_to'] === 'header'
        headers = {
          **headers.to_h,
          'Authorization': "Bearer #{token}"
        }
      end
    end

    response = if method.downcase === 'get'
                 HTTParty.send(method.downcase,
                               data_query.options['url'],
                               headers: headers,
                               query: url_params.to_h)
               else
                 HTTParty.send(method.downcase,
                               data_query.options['url'],
                               headers: headers,
                               query: url_params.to_h,
                               body: body.to_h)
               end

    if response.code == 401
      auth_url = "#{source_options['auth_url']}?response_type=code&client_id=#{source_options['client_id']}&redirect_uri=#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize&scope=#{source_options['scopes']}"
      return { error: { message: 'needs authorization', code: 'oauth2_needs_auth',
                        data: { auth_url: auth_url } } }
    end

    { code: response.code, data: JSON.parse(response.body) }
  end
end
