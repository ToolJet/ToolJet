class StripeQueryService

    attr_accessor :data_query, :query_variables, :data_source

    def initialize(data_query, query_variables)
        @data_query = data_query
        @data_source = data_query.data_source
        @query_variables = query_variables
    end

    def replace_path_params(url, path_params)
        path_params.each do |param|
            url.gsub!("{#{param[0]}}", param[1])
        end
        
        url
    end

    def process

        source_options = data_source.options
        stripe_api_key = source_options["api_key"]
        api_base_url = "https://api.stripe.com"
        operation = data_query.options["operation"]
        path = data_query.options["path"]

        url = "#{api_base_url}#{path}"

        # Replace path params in url with their values
        path_params = data_query.options["params"]["path"].to_a
        url = replace_path_params(url, path_params)

        headers = {
            'Authorization': "Bearer #{stripe_api_key}"
        }

        response = HTTParty.send(
            operation.downcase, 
            url,
            headers: headers
        )
        
        { code: response.code, data: JSON.parse(response.body) }
    end
end
