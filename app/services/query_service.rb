class QueryService
  attr_accessor :data_query, :options, :current_user

  def initialize(data_query, options, current_user)
    @data_query = data_query
    @options = options
    @current_user = current_user
  end

  def process
    parsed_options = {}
    data_source_options = data_query.data_source.options
    data_source_options.keys.each do |key|
      option = data_source_options[key]

      parsed_options[key] = if option['encrypted']
                              Credential.find(option['credential_id']).value
                            else
                              option['value']
                            end
    end

    service_class = "#{data_query.kind.capitalize}QueryService".constantize
    service = service_class.new data_query, options, parsed_options, current_user
    service.process
  end
end
