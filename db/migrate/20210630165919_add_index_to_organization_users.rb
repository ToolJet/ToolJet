class AddIndexToOrganizationUsers < ActiveRecord::Migration[6.1]
  def change
    add_index :organization_users, [:organization_id, :user_id], unique: true, if_not_exists: true
  end
end
