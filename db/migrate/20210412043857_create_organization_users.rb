class CreateOrganizationUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :organization_users, id: :uuid do |t|
      t.references :organization, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :role

      t.timestamps
    end
  end
end
