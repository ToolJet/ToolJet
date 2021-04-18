class CreateDataSourceUserOauth2s < ActiveRecord::Migration[6.1]
  def change
    create_table :data_source_user_oauth2s, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :data_source, null: false, foreign_key: true, type: :uuid
      t.text :encrypted_options

      t.timestamps
    end
  end
end
