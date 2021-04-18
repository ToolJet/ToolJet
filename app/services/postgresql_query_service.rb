class PostgresqlQueryService

    attr_accessor :data_query, :data_source, :options, :source_options, :current_user

    def initialize(data_query, options, source_options, current_user)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
        @source_options = source_options
        @current_user = current_user
    end

    def process
        conn = PG.connect( 
            dbname: source_options["database"], 
            user: source_options["username"],
            password:source_options["password"],
            host: source_options["host"],
            port: source_options["port"]
        )

        query_text = options["query"]

        result = conn.exec( query_text )
        { status: 'success', data: result.to_a }
    end
end
