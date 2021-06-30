module AvailableDataSource
  class UnSupportedSource < StandardError; end

  POSTGRES = "POSTGRES".freeze
  AIRTABLE = "AIRTABLE".freeze
  DYNAMODB = "DYNAMODB".freeze
  ELASTICSEARCH = "ELASTICSEARCH".freeze
  FIRESTORE = "FIRESTORE".freeze
  MONGODB = "MONGODB".freeze
  MSSQL = "MSSQL".freeze
  MYSQL = "MYSQL".freeze
  REDIS = "REDIS".freeze

  def source_type_supported?(ds_type)
    [
      POSTGRES,
      AIRTABLE,
      DYNAMODB,
      ELASTICSEARCH,
      FIRESTORE,
      MONGODB,
      MSSQL,
      MYSQL,
      REDIS,
    ].include?(ds_type)
  end
end
