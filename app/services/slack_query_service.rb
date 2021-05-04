class SlackQueryService
  attr_accessor :query, :ource, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @query = data_query
    @source = query.data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def process
    operation = query.options['operation']
    access_token = source_options['access_token']
    data = []

    if operation === 'list_users'
      result = HTTParty.get("https://slack.com/api/users.list",
        headers: { "Authorization": "Bearer #{access_token}" })

      data = JSON.parse(result.body)
    end

    { status: 'success', data: data }
  end
end
