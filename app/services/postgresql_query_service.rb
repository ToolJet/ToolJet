class PostgresqlQueryService

    attr_accessor :data_query, :data_source, :query_variables

    def initialize(data_query, query_variables)
        @data_query = data_query
        @data_source = data_query.data_source
        @query_variables = query_variables
    end

    def process
        conn = PG.connect( 
            dbname: data_source.options["database"], 
            user: data_source.options["username"],
            password:data_source.options["password"],
            host: data_source.options["host"],
            port: data_source.options["port"]
        )

        query_text = data_query.options["query"]
        query_variables.each do |query_variable|
            query_text.gsub!(query_variable[0], query_variable[1])
        end

        result = conn.exec( data_query.options["query"] )
        { status: 'success', data: result.to_a }
    end
end
