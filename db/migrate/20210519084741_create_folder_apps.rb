class CreateFolderApps < ActiveRecord::Migration[6.1]
  def change
    create_table :folder_apps, id: :uuid do |t|
      t.references :folder, null: false, foreign_key: true, type: :uuid
      t.references :app, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
