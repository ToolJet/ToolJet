class FirestoreQueryService
  require 'google/cloud/firestore'

  attr_accessor :data_query, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection options
    gcp_key = JSON.parse(options.dig('gcp_key', 'value'))

    Google::Cloud::Firestore.configure do |config|
        config.credentials = gcp_key
    end

    firestore = Google::Cloud::Firestore.new

    firestore.cols # Try to fetch collections
  end

  def process
    credential_json = JSON.parse(source_options['gcp_key'])
    data = {}
    error = nil

    begin
      Google::Cloud::Firestore.configure do |config|
        config.credentials = credential_json
      end

      firestore = Google::Cloud::Firestore.new

      operation = data_query.options['operation']

      update_document(options['path'], options['body'].as_json, firestore) if operation == 'update_document'

      if operation == 'bulk_update'
        records = options['records']
        collection = options['collection']
        doc_key_id = options['document_id_key']

        records.each do |record|
          path = "#{collection}/#{record[doc_key_id]}"
          record.delete(doc_key_id)
          update_document(path, record.as_json, firestore)
        end
      end

      if operation == 'get_document'
        path = data_query.options['path']
        doc_ref  = firestore.doc path
        snapshot = doc_ref.get
        data = snapshot.data
      end

      if operation == 'set_document'
        path = options['path']
        body = options['body'].as_json
        doc_ref = firestore.doc path
        doc_ref.set body
      end

      if operation == 'query_collection'
        path = options['path']
        doc_ref = firestore.col path

        # execute where condition

        if options['where_field']
          doc_ref = doc_ref.where options['where_field'], options['where_operation'], options['where_value']
        end

        data = []
        doc_ref.get do |doc|
          data << { data: doc.data, document_id: doc.document_id }
        end
      end
    rescue StandardError => e
      puts e
      error = e.message
    end

    { data: data, error: error }
  end

  private

  def update_document(path, body, firestore)
    doc_ref = firestore.doc path
    doc_ref.update body
  end
end
