class QueryService

    attr_accessor :data_query, :query_variables

    def initialize(data_query, query_variables)
        @data_query = data_query
        @query_variables = query_variables
    end

    def process
        service_class = "#{data_query.kind.capitalize}QueryService".constantize
        service = service_class.new data_query, query_variables
        service.process
    end

end