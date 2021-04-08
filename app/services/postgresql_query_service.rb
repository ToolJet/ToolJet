class PostgresqlQueryService

    attr_accessor :data_query, :data_source, :options

    def initialize(data_query, options)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
    end

    def process
        conn = PG.connect( 
            dbname: data_source.options["database"], 
            user: data_source.options["username"],
            password:data_source.options["password"],
            host: data_source.options["host"],
            port: data_source.options["port"]
        )

        query_text = options["query"]

        result = conn.exec( query_text )
        { status: 'success', data: result.to_a }
    end
end
