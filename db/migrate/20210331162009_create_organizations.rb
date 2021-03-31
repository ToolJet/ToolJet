class CreateOrganizations < ActiveRecord::Migration[6.1]
  def change
    create_table :organizations, id: :uuid do |t|
      t.string :name
      t.string :domain
      t.timestamps
    end
  end
end
