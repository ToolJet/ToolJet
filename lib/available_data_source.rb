# frozen_string_literal: true

module AvailableDataSource
  class UnSupportedSource < StandardError; end

  module ConnectionPooled
    POSTGRES = "POSTGRES"
    DYNAMODB = "DYNAMODB"
    ELASTICSEARCH = "ELASTICSEARCH"
    FIRESTORE = "FIRESTORE"
    MONGODB = "MONGODB"
    MSSQL = "MSSQL"
    MYSQL = "MYSQL"
    REDIS = "REDIS"

    def source_type_supported?(datasource_type)
      ConnectionPooled
        .constants
        .map { |constant| ConnectionPooled.const_get(constant) }
        .include?(datasource_type)
    end
  end
end
