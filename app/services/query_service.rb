class QueryService

    attr_accessor :data_query, :options

    def initialize(data_query, options)
        @data_query = data_query
        @options = options
    end

    def process
        service_class = "#{data_query.kind.capitalize}QueryService".constantize
        service = service_class.new data_query, options
        service.process
    end

end