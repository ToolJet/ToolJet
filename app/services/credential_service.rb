class CredentialService

    def initialize
    end

    def decrypt_options(options)
        parsed_options = {}
        options.keys.each do |key|
            option = options[key]

            if option["encrypted"]
                parsed_options[key] = Credential.find(option["credential_id"]).value
            else
                parsed_options[key] = option["value"]
            end
        end

        parsed_options
    end


end
