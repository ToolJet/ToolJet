class DataSourceUserOauth2 < ApplicationRecord
  include Encryptable
  
  belongs_to :user
  belongs_to :data_source

  attr_encrypted :options
    
end
