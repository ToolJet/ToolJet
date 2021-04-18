class StripeQueryService

    attr_accessor :data_query, :options, :data_source, :source_options, :current_user

    def initialize(data_query, options, source_options, current_user)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
        @source_options = source_options
        @current_user = current_user
    end

    def replace_path_params(url, path_params)
        path_params.each do |param, value|
            url.gsub!("{#{param}}", value)
        end
        
        url
    end

    def process

        stripe_api_key = source_options["api_key"]
        api_base_url = "https://api.stripe.com"
        operation = data_query.options["operation"]
        path = data_query.options["path"]

        url = "#{api_base_url}#{path}"

        # Replace path params in url with their values
        path_params = options["params"]["path"]
        query_params = data_query.options["params"]["query"]
        body_params = data_query.options["params"]["request"]

        url = replace_path_params(url, path_params)

        headers = {
            'Authorization': "Bearer #{stripe_api_key}"
        }

        response = HTTParty.send(
            operation.downcase, 
            url,
            headers: headers,
            body: body_params,
            query: query_params
        )
        
        { code: response.code, data: JSON.parse(response.body) }
    end
end
