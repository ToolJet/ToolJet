class QueryService
  attr_accessor :data_query, :options, :current_user

  def initialize(data_query, options, current_user)
    @data_query = data_query
    @options = options
    @current_user = current_user
  end

  def process
    parsed_options = {}
    data_source = DataSource.find data_query[:data_source_id]
    data_source_options = data_source.options if  data_source
    data_source_options.keys.each do |key|
      option = data_source_options[key]

      parsed_options[key] = if option['encrypted']
                              Credential.find(option['credential_id']).value
                            else
                              option['value']
                            end
    end if  data_source

    parsed_query_options = get_query_options(data_query[:options])

    service_class = "#{data_query[:kind].capitalize}QueryService".constantize
    service = service_class.new data_query, data_source, parsed_query_options, parsed_options, current_user
    service.process
  end

  private 
    def get_query_options(object)
      
      if object.class.name === "Hash"

        object.keys.each do |key|
          object[key] = get_query_options(object[key])
        end

      elsif object.class.name === "String"
        if object.start_with?('{{') && object.end_with?('}}')
          object = options[object]
        else
          variables = object.scan(/\{\{(.*?)\}\}/).to_a

          if variables.size > 0
            variables.each do |variable|
              object = object.gsub("{{#{variable[0]}}}", options["{{#{variable[0]}}}"])
            end
          else 
            object = object
          end
        end
      elsif object.class.name === "Array"

        object.each_with_index do |element, index|
          object[index] = get_query_options(element)
        end

      end

      object
    end
end
