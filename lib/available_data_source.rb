# frozen_string_literal: true

module AvailableDataSource
  class UnSupportedSource < StandardError; end

  POSTGRES = "POSTGRES".freeze
  DYNAMODB = "DYNAMODB".freeze
  ELASTICSEARCH = "ELASTICSEARCH".freeze
  FIRESTORE = "FIRESTORE".freeze
  MONGODB = "MONGODB".freeze
  MSSQL = "MSSQL".freeze
  MYSQL = "MYSQL".freeze
  REDIS = "REDIS".freeze

  def source_type_supported?(datasource_type)
    [
      POSTGRES,
      DYNAMODB,
      ELASTICSEARCH,
      FIRESTORE,
      MONGODB,
      MSSQL,
      MYSQL,
      REDIS,
    ].include?(datasource_type)
  end
end
