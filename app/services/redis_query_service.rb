class RedisQueryService
    require "redis"

    attr_accessor :data_query, :data_source, :options, :source_options, :current_user

    def initialize(data_query, options, source_options, current_user)
        @data_query = data_query
        @data_source = data_query.data_source
        @options = options
        @source_options = source_options
        @current_user = current_user
    end

    def process

        password = source_options["username"]
        password = nil if password.blank?

        redis = Redis.new(
            host: source_options["host"], 
            port: source_options["port"], 
            user: source_options["username"],
            password: password
        )

        query_text = options["query"]

        result = redis.call(query_text.split(" "))

        { status: 'success', data: result }
    end
end
