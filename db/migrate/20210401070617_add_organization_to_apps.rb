class AddOrganizationToApps < ActiveRecord::Migration[6.1]
  def change
    add_reference :apps, :organization, null: false, foreign_key: true, type: :uuid
  end
end
