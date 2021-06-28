class GithubOauthService

def self.generate_base_auth_url
  client_id = ENV.fetch('GITHUB_CLIENT_ID', '')
  "https://github.com/login/oauth/authorize?client_id=#{client_id}"
end

def self.fetch_access_token(code)
  access_token_url = "https://github.com/login/oauth/access_token"
  client_id = ENV.fetch('GITHUB_CLIENT_ID', '')
  client_secret = ENV.fetch('GITHUB_CLIENT_SECRET')

  data = {
    code: code,
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: "#{ENV.fetch('TOOLJET_HOST')}/oauth2/authorize"
  }

  body = URI.encode_www_form(data)

  response = HTTParty.post(access_token_url, body: body)

  result = JSON.parse(response.body.to_json)
  access_token = result['access_token']

end

end
