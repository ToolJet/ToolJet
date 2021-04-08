class MysqlQueryService

    attr_accessor :data_query, :data_source, :options

    def initialize(data_query, options)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
    end

    def process
        client = Mysql2::Client.new(
            host: data_source.options["host"], 
            username: data_source.options["username"],
            password:data_source.options["password"],
            port: data_source.options["port"],
            database: data_source.options["database"], 
        )

        query_text = options["query"]

        results = client.query(query_text)

        { status: 'success', data: results.to_a }
    end
end
