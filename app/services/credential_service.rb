# frozen_string_literal: true

class CredentialService
  def initialize; end

  def decrypt_options(options)
    parsed_options = {}
    options.keys.each do |key|
      option = options[key]

      parsed_options[key] = if option["encrypted"]
                              Credential.find(option["credential_id"]).value
                            else
                              option["value"]
                            end
    end

    parsed_options
  end
end
