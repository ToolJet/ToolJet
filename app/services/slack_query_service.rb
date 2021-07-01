# frozen_string_literal: true

class SlackQueryService
  attr_accessor :query, :ource, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @query = data_query
    @source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def process
    operation = options["operation"]
    access_token = source_options["access_token"]
    data = []

    if operation === "list_users"
      result = HTTParty.get("https://slack.com/api/users.list",
        headers: { "Authorization": "Bearer #{access_token}" })

      data = JSON.parse(result.body)
    end

    if operation === "send_message"

      body = {
        channel: options["channel"],
        text: options["message"],
        as_user: options["sendAsUser"]
      }.to_json

      result = HTTParty.post("https://slack.com/api/chat.postMessage",
        body: body,
        headers: { "Content-Type": "application/json", "Authorization": "Bearer #{access_token}" }
      )

      data = JSON.parse(result.body)
    end

    { status: "success", data: data }
  end
end
