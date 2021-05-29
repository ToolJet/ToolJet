class AddCipherTextToCredentials < ActiveRecord::Migration[6.1]
  def change
    add_column :credentials, :value_ciphertext, :text

    Credential.all.each do |credential|
      begin

        if credential.value.is_a? String
          credential.update(value: credential.value.as_json)
        end
      rescue 
      end  
    end
  end
end
