class FirestoreQueryService
    
    attr_accessor :data_query, :options

    def initialize(data_query, options)
        @data_query = data_query
        @options = options
    end

    def process

        credential_json = JSON.parse(data_query.data_source.options["gcp_key"])
        data = {}
        error = nil

        begin
            Google::Cloud::Firestore.configure do |config|
                config.credentials = credential_json
            end

            firestore = Google::Cloud::Firestore.new

            operation = data_query.options["operation"]
        
            if operation == 'get_document'
                path = data_query.options["path"]
                doc_ref  = firestore.doc path
                snapshot = doc_ref.get
                data = snapshot.data
            end

            if operation == 'set_document'
                path = options["path"]
                body = options["body"].as_json
                doc_ref = firestore.doc path
                doc_ref.set body
            end

            if operation == 'query_collection'
                path = options["path"]
                doc_ref = firestore.col path
                data = []
                doc_ref.get do |doc|
                    data << { data: doc.data, document_id: doc.document_id}
                end
            end

        rescue => e
            puts e
            error = e.message
        end
        
        { data: data, error: error}
    end
end
