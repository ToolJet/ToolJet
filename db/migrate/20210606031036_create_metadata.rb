class CreateMetadata < ActiveRecord::Migration[6.1]
  def change
    create_table :metadata, id: :uuid do |t|
      t.json :data

      t.timestamps
    end
  end
end
