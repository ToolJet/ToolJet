class AddSlugToApps < ActiveRecord::Migration[6.1]
  def change
    add_column :apps, :slug, :string
    add_index :apps, [:organization_id, :slug]

    App.find_each do |app|
      app.update(slug: app.id)
    end
  end
end
