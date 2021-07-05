# frozen_string_literal: true

class GoogleOauthService
  def self.generate_base_auth_url
    client_id = ENV.fetch("GOOGLE_CLIENT_ID", "")
    "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=#{client_id}&redirect_uri=#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize"
  end

  def self.fetch_access_token(code)
    access_token_url = "https://oauth2.googleapis.com/token"
    client_id = ENV.fetch("GOOGLE_CLIENT_ID", "")
    client_secret = ENV.fetch("GOOGLE_CLIENT_SECRET", "")
    grant_type = "authorization_code"

    custom_params = [
      %w[prompt consent],
      %w[access_type offline]
    ].to_h

    response = HTTParty.post(access_token_url,
                             body: { code: code,
                                     client_id: client_id,
                                     client_secret: client_secret,
                                     grant_type: grant_type,
                                     redirect_uri: "#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize",
                                     **custom_params }.to_json,
                             headers: { "Content-Type" => "application/json" })

    result = JSON.parse(response.body)

    access_token = result["access_token"]
    refresh_token = result["refresh_token"]

    [["access_token", access_token], ["refresh_token", refresh_token]]
  end

  def self.refresh_access_token(refresh_token, data_source)
    access_token_url = "https://oauth2.googleapis.com/token"
    client_id = ENV.fetch("GOOGLE_CLIENT_ID")
    client_secret = ENV.fetch("GOOGLE_CLIENT_SECRET")
    grant_type = "refresh_token"

    response = HTTParty.post(access_token_url,
                             body: { refresh_token: refresh_token,
                                     client_id: client_id,
                                     client_secret: client_secret,
                                     grant_type: grant_type,
                                     redirect_uri: "#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize"
                                    }.to_json,
                             headers: { "Content-Type" => "application/json" })

    result = JSON.parse(response.body)

    access_token = result["access_token"]

    credential_id = data_source.options["access_token"]["credential_id"]
    credential = Credential.find(credential_id)
    credential.update(value: access_token)

    access_token
  end
end
