class MysqlQueryService

    attr_accessor :data_query, :data_source, :options, :source_options, :current_user

    def initialize(data_query, options, source_options, current_user)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
        @source_options = source_options
        @current_user = current_user
    end

    def process
        client = Mysql2::Client.new(
            host: source_options["host"], 
            username: source_options["username"],
            password:source_options["password"],
            port: source_options["port"],
            database: source_options["database"], 
        )

        query_text = options["query"]

        results = client.query(query_text)

        { status: 'success', data: results.to_a }
    end
end
