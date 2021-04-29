class DataSourceConnectionService
  attr_accessor :data_source_kind, :options

  def initialize(data_source_kind, options)
    @data_source_kind = data_source_kind
    @options = options
  end

  def process
    service_class = "#{data_source_kind.capitalize}QueryService".constantize
    service_class.connection options
  end
end
