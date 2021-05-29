class AddCipherTextToDataSourceUserOauth2 < ActiveRecord::Migration[6.1]
  def change
    add_column :data_source_user_oauth2s, :options_ciphertext, :text

    DataSourceUserOauth2.all.each do |credential|
      begin
        if credential.options.is_a? String
          credential.update(options: credential.options)
        end
      rescue 
      end  
    end
  end
end
