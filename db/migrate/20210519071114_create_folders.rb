class CreateFolders < ActiveRecord::Migration[6.1]
  def change
    create_table :folders, id: :uuid do |t|
      t.string :name
      t.references :organization, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
