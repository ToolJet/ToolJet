# frozen_string_literal: true

class GooglesheetsQueryService
  attr_accessor :query, :source, :options, :source_options, :current_user

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
    error = false

    if operation === "info"
      spreadsheet_id = options["spreadsheet_id"]
      result = get_spreadsheet_info(spreadsheet_id, access_token)

      if result.code === 401
        access_token = refresh_access_token
        result = get_spreadsheet_info(spreadsheet_id, access_token)
      end

      data = result
      error = result.code != 200
    end

    if operation === "append"

      spreadsheet_id = options["spreadsheet_id"]
      sheet = options["sheet"]
      rows = options["rows"]

      result = append_data_to_sheet(spreadsheet_id, sheet, rows, access_token)

      if result.code === 401
        access_token = refresh_access_token
        result = append_data_to_sheet(spreadsheet_id, sheet, rows, access_token)
      end

      error = result.code != 200
    end

    if operation === "read"
      result = read_data(access_token)

      if result.code === 401
        access_token = refresh_access_token
        result = read_data(access_token)
      end

      if result.code === 200

        headers = []
        values = []
        if result["values"]
          headers = result["values"][0] if
          values = result["values"][1..] if result["values"].size > 1
        end

        data = []
        values.each do |value|
          row = {}
          headers.each_with_index do |header, index|
            row[header] = value[index]
          end
          data << row
        end

      else
        error = true
        data = result["error"]
      end
    end

    if error
      { status: "error", code: 500, message: data["message"], data: data }
    else
      { status: "success", data: data }
    end
  end

  private

    def read_data_from_sheet(spreadsheet_id, sheet, access_token, range)
      result = HTTParty.get("https://sheets.googleapis.com/v4/spreadsheets/#{spreadsheet_id}/values/#{sheet}!#{range}",
        headers: { "Content-Type":
        "application/json", "Authorization": "Bearer #{access_token}" })

      result
    end

    def read_data(access_token)
      spreadsheet_id = options["spreadsheet_id"]
      sheet = options["sheet"]

      read_data_from_sheet(spreadsheet_id, sheet, access_token, "A1:V101")
    end

    def append_data_to_sheet(spreadsheet_id, sheet, rows, access_token)
      data = read_data_from_sheet(spreadsheet_id, sheet, access_token, "A1:V1")
      headers = data["values"][0]

      parsed_data = JSON.parse(rows)
      data_to_append = []

      parsed_data.each do |row|
        row_data = []
        headers.each_with_index do |header, index|
          row_data[index] = row[header]
        end
        data_to_append << row_data
      end

      data = {
        "values": data_to_append
      }.to_json

      result = HTTParty.post("https://sheets.googleapis.com/v4/spreadsheets/#{spreadsheet_id}/values/#{sheet}!A:V:append?valueInputOption=USER_ENTERED", body: data, headers: { "Content-Type":
        "application/json", "Authorization": "Bearer #{access_token}" })
    end

    def get_spreadsheet_info(spreadsheet_id, access_token)
      result = HTTParty.get("https://sheets.googleapis.com/v4/spreadsheets/#{spreadsheet_id}",
        headers: { "Content-Type":
        "application/json", "Authorization": "Bearer #{access_token}" })

      result
    end

    def refresh_access_token
      GoogleOauthService.refresh_access_token(source_options["refresh_token"], @source)
    end
end
