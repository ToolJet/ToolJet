class MysqlQueryService

    attr_accessor :data_query, :data_source, :query_variables

    def initialize(data_query, query_variables)
        @data_query = data_query
        @data_source = data_query.data_source
        @query_variables = query_variables
    end

    def process
        client = Mysql2::Client.new(
            host: data_source.options["host"], 
            username: data_source.options["username"],
            password:data_source.options["password"],
            port: data_source.options["port"],
            database: data_source.options["database"], 
        )

        query_text = data_query.options["query"]

        query_variables.each do |query_variable|
            query_text.gsub!(query_variable[0], query_variable[1])
        end

        results = client.query(query_text)

        { status: 'success', data: results.to_a }
    end
end
