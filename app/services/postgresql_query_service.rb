class PostgresqlQueryService

    attr_accessor :data_query, :data_source

    def initialize(data_query)
        @data_query = data_query
        @data_source = data_query.data_source
    end

    def process
        conn = PG.connect( 
            dbname: data_source.options["database"], 
            user: data_source.options["username"],
            password:data_source.options["password"],
            host: data_source.options["host"],
            port: data_source.options["port"]
        )

        result = conn.exec( data_query.options["query"] )

        { status: 'success', data: result.to_a }
    end
end
