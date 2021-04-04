class RestapiQueryService

    attr_accessor :data_query

    def initialize(data_query)
        @data_query = data_query
    end

    def process
        url = data_query.options["url"]
        method = data_query.options["method"]
        headers = data_query.options["headers"]
        body = data_query.options["body"]
        url_params = data_query.options["url_params"]

        response = HTTParty.send(method.downcase, 
            data_query.options["url"],
            body: body.to_h,
            headers: headers.to_h,
            query: url_params.to_h
        )
        
        { code: response.code, data: response.body}
    end
end
