# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_04_27_100209) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "uuid-ossp"

  create_table "app_users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "app_id", null: false
    t.uuid "user_id", null: false
    t.string "role"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["app_id"], name: "index_app_users_on_app_id"
    t.index ["user_id"], name: "index_app_users_on_user_id"
  end

  create_table "app_versions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "app_id", null: false
    t.string "name"
    t.json "definition"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["app_id"], name: "index_app_versions_on_app_id"
  end

  create_table "apps", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.uuid "organization_id", null: false
    t.json "definition"
    t.uuid "current_version_id"
    t.boolean "is_public", default: false
    t.index ["current_version_id"], name: "index_apps_on_current_version_id"
    t.index ["organization_id"], name: "index_apps_on_organization_id"
  end

  create_table "credentials", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "encrypted_value"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "data_queries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "app_id", null: false
    t.string "name"
    t.json "options"
    t.string "kind"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.uuid "data_source_id"
    t.index ["app_id"], name: "index_data_queries_on_app_id"
    t.index ["data_source_id"], name: "index_data_queries_on_data_source_id"
  end

  create_table "data_source_user_oauth2s", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "data_source_id", null: false
    t.text "encrypted_options"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["data_source_id"], name: "index_data_source_user_oauth2s_on_data_source_id"
    t.index ["user_id"], name: "index_data_source_user_oauth2s_on_user_id"
  end

  create_table "data_sources", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "app_id", null: false
    t.string "name"
    t.json "options"
    t.string "kind"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["app_id"], name: "index_data_sources_on_app_id"
  end

  create_table "organization_users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "organization_id", null: false
    t.uuid "user_id", null: false
    t.string "role"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "status", default: "invited"
    t.index ["organization_id"], name: "index_organization_users_on_organization_id"
    t.index ["user_id"], name: "index_organization_users_on_user_id"
  end

  create_table "organizations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name"
    t.string "domain"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "role"
    t.uuid "organization_id"
    t.string "invitation_token"
    t.index ["organization_id"], name: "index_users_on_organization_id"
  end

  add_foreign_key "app_users", "apps"
  add_foreign_key "app_users", "users"
  add_foreign_key "app_versions", "apps"
  add_foreign_key "apps", "app_versions", column: "current_version_id"
  add_foreign_key "apps", "organizations"
  add_foreign_key "data_queries", "apps"
  add_foreign_key "data_queries", "data_sources"
  add_foreign_key "data_source_user_oauth2s", "data_sources"
  add_foreign_key "data_source_user_oauth2s", "users"
  add_foreign_key "data_sources", "apps"
  add_foreign_key "organization_users", "organizations"
  add_foreign_key "organization_users", "users"
end
