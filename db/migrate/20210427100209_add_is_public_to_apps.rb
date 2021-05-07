class AddIsPublicToApps < ActiveRecord::Migration[6.1]
  def change
    add_column :apps, :is_public, :boolean, default: false
  end
end
