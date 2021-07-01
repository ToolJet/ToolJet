# frozen_string_literal: true

class SlackOauthService
  def self.generate_base_auth_url
    client_id = ENV.fetch("SLACK_CLIENT_ID")
    "https://slack.com/oauth/v2/authorize?response_type=code&client_id=#{client_id}&redirect_uri=#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize"
  end

  def self.fetch_access_token(code)
    access_token_url = "https://slack.com/api/oauth.v2.access"
    client_id = ENV.fetch("SLACK_CLIENT_ID")
    client_secret = ENV.fetch("SLACK_CLIENT_SECRET")

    data = { code: code,
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: "#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize",
    }
    body = URI.encode_www_form(data)

    response = HTTParty.post(access_token_url, body: body)

    result = JSON.parse(response.body)

    access_token = result["access_token"]
    refresh_token = result["refresh_token"]

    [["access_token", access_token], ["refresh_token", refresh_token]]
  end
end
