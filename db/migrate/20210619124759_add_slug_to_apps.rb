class AddSlugToApps < ActiveRecord::Migration[6.1]
  def change
    add_column :apps, :slug, :string

    add_index :apps, [:organization_id, :slug]
  end
end
