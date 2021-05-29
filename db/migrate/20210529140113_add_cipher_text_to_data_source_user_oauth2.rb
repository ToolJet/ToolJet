class AddCipherTextToDataSourceUserOauth2 < ActiveRecord::Migration[6.1]
  def change
    add_column :data_source_user_oauth2s, :options_ciphertext, :text
  end
end
