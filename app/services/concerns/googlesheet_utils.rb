# frozen_string_literal: true

module GooglesheetUtils
  def convert_number_to_column(number)
    letter = ""

    while number > 0 do
      temp = (number - 1) % 26
      letter = (temp + 65).chr + letter
      number = (number - temp - 1) / 26
    end

    letter
  end
end
