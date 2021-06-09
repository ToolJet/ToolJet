# == Schema Information
#
# Table name: metadata
#
#  id         :uuid             not null, primary key
#  data       :json
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Metadatum < ApplicationRecord
end
