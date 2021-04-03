class CreateDataSources < ActiveRecord::Migration[6.1]
  def change
    create_table :data_sources, id: :uuid do |t|
      t.references :app, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.json :options
      t.string :kind

      t.timestamps
    end
  end
end
