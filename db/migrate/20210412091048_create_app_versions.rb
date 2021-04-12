class CreateAppVersions < ActiveRecord::Migration[6.1]
  def change
    create_table :app_versions, id: :uuid do |t|
      t.references :app, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.json :definition

      t.timestamps
    end
  end
end
