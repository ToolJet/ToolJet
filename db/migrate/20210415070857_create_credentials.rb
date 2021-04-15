class CreateCredentials < ActiveRecord::Migration[6.1]
  def change
    create_table :credentials, id: :uuid do |t|
      t.text :encrypted_value

      t.timestamps
    end
  end
end
