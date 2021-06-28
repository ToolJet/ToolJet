class GithubQueryService
  attr_accessor :query, :source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @query = data_query
    @source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def process
    operation = options['operation']
    access_token = source_options['access_token']

  if operation == 'list_issues'
    owner = options['owner']
    repo = options['repo']

    result = HTTParty.get("https://api.github.com/repos/#{owner}/#{repo}/issues",
    headers:{ 'Content-Type': 'application/json', "Authorization": "Bearer #{access_token}"})

    data = JSON.parse(result.body)
  end

  { status: 'success', data: data }

  end

end
