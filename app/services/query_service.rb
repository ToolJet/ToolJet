class QueryService

    attr_accessor :data_query

    def initialize(data_query)
        @data_query = data_query
    end

    def process
        service_class = "#{data_query.kind.capitalize}QueryService".constantize
        service = service_class.new data_query
        service.process
    end

end