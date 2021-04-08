class RestapiQueryService

    attr_accessor :data_query, :options

    def initialize(data_query, options)
        @data_query = data_query
        @options = options
    end

    def process
        url = options["url"]
        method = options["method"]
        headers = options["headers"]
        body = options["body"]
        url_params = options["url_params"]

        response = HTTParty.send(method.downcase, 
            data_query.options["url"],
            body: body.to_h,
            headers: headers.to_h,
            query: url_params.to_h
        )
        
        { code: response.code, data: response.body}
    end
end
