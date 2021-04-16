class QueryService

    attr_accessor :data_query, :options

    def initialize(data_query, options)
        @data_query = data_query
        @options = options
    end

    def process

        parsed_options = {}
        data_source_options = data_query.data_source.options
        data_source_options.keys.each do |key|
            option = data_source_options[key]


            if option["encrypted"]
                parsed_options[key] = Credential.find(option["credential_id"]).value
            else
                parsed_options[key] = option["value"]
            end
        end

        service_class = "#{data_query.kind.capitalize}QueryService".constantize
        service = service_class.new data_query, options, parsed_options
        service.process
    end

end
