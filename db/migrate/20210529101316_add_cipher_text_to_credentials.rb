class AddCipherTextToCredentials < ActiveRecord::Migration[6.1]
  def change
    add_column :credentials, :value_ciphertext, :text
  end
end
